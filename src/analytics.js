'use strict';

const _ = require('underscore');
const request = require('request-promise-native');
const async = require('async');
const url = require('url');
const readline = require('readline');
const query = require('./query.js');

var Itunes = function(username, password, options) {
  this.options = {
    baseURL: 'https://appstoreconnect.apple.com/olympus/v1',
    loginURL: 'https://idmsa.apple.com/appleauth/auth',
    settingsURL: 'https://analytics.itunes.apple.com/analytics/api/v1',
    appleWidgetKey: 'e0b80c3bf78523bfe80974d320935bfa30add02e1bff88ec2166c6bd5a706c42',
    concurrentRequests: 2,
    errorCallback: function(e) { console.log('Login failure: ' + e); },
    successCallback: function(d) { console.log('Login success.'); }
  };

  _.extend(this.options, options);

  // Private
  this._cookies = [];
  this._queue = async.queue(
    this.executeRequest.bind(this),
    this.options.concurrentRequests
  );
  this._queue.pause();

  if (typeof this.options['cookies'] !== 'undefined') {
    this._cookies = this.options.cookies;
    this._queue.resume();
  } else {
    this.login(username, password);
  }
};

Itunes.prototype.executeRequest = function(task, callback) {
  const query = task.query;
  const completed = task.completed;

  const requestBody = query.assembleBody();
  const uri = url.parse(query.apiURL + query.endpoint);

  request.post({
    uri: uri,
    headers: this.getHeaders(),
    timeout: 300000, //5 minutes
    json: requestBody
  }, function(error, response, body) {
    if (!response.hasOwnProperty('statusCode')) {
			error = new Error('iTunes Connect is not responding. The service may be temporarily offline.');
			body = null;
		} else if (response.statusCode == 401) {
			error = new Error('This request requires authentication. Please check your username and password.');
			body = null;
		}

    completed(error, body);
    callback();
  });
}

Itunes.prototype.login = function(username, password) {
  request.post({
    url: `${this.options.loginURL}/signin`,
    headers: {
      'Content-Type': 'application/json',
      'X-Apple-Widget-Key': this.options.appleWidgetKey
    },
    json: {'accountName': username, 'password': password, 'rememberMe': false},
    resolveWithFullResponse: true
  }).catch((res) => {
    if (res.statusCode !== 409) {
      return Promise.reject(res);
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'scnt': res.response.headers['scnt'],
      'X-Apple-ID-Session-Id': res.response.headers['x-apple-id-session-id'],
      'X-Apple-Widget-Key': this.options.appleWidgetKey,
      'X-Requested-With': 'XMLHttpRequest',
      'X-Apple-Domain-Id': '3',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors'
    };

    //We need to get the 2fa code
    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({input: process.stdin, output: process.stdout});
      rl.question('Enter the 2FA code: ', (answer) => {
        resolve(answer);
      });
    }).then((code) => {
      return request.post({
        url: `${this.options.loginURL}/verify/trusteddevice/securitycode`,
        headers: headers,
        json: {
          securityCode: { code: code }
        },
        resolveWithFullResponse: true
      }).then((res) => {
        return request.get({
          url: `${this.options.loginURL}/2sv/trust`,
          headers: headers,
          resolveWithFullResponse: true
        });
      }).catch((res) => {
        return Promise.reject(res);
      });
    });
  }).then((response) => {
    const cookies = response.headers['set-cookie'];
    if (!(cookies && cookies.length)) {
      throw new Error('There was a problem with loading the login page cookies. Check login credentials.');
    }
    const myAccount = /myacinfo=.+?;/.exec(cookies); //extract the account info cookie
    if (myAccount == null || myAccount.length == 0) {
      throw new Error('No account cookie :( Apple probably changed the login process');
    }

    const cookie = myAccount[0];
    this._cookies = cookie;

    return request.get({
      url: `${this.options.baseURL}/session`,
      followRedirect: false,
      headers: {
        'Cookie': cookie
      },
      resolveWithFullResponse: true
    });
  }).then((response) => {
    const cookies = response.headers['set-cookie'];
    if (!(cookies && cookies.length)) {
      throw new Error('There was a problem with loading the login page cookies.');
    }

    const itCtx = /itctx=.+?;/.exec(cookies); //extract the itCtx cookie
    if (itCtx == null || itCtx.length == 0) {
      throw new Error('No itCtx cookie :( Apple probably changed the login process');
    }
    
    this._cookies = `${this._cookies} ${itCtx[0]}`;
    this._queue.resume();
    this.options.successCallback(this._cookies);
  }).catch((err) => {
    this.options.errorCallback(err);
  });
};

Itunes.prototype.changeProvider = function(providerId, callback) {
  async.whilst((callback) => {
    callback(null, this._queue.paused);
  }, (callback) => {
    setTimeout(() => callback(null), 500);
  }, (err) => {
    request.post({
      url: `${this.options.baseURL}/session`,
      headers: this.getHeaders(),
      json: { provider: {providerId: providerId} },
      resolveWithFullResponse: true
    }).then((res) => {
      const myAccount = /myacinfo=.+?;/.exec(this._cookies); //extract the current acc info cookie
      const cookies = res.headers['set-cookie'];
      const itCtx = /itctx=.+?;/.exec(cookies);
      if (itCtx == null || itCtx.length == 0) {
        return callback(new Error('No itCtx cookie :( Apple probably changed the login process'));
      }

      this._cookies = `${myAccount[0]} ${itCtx[0]}`;
      callback(null);
    }).catch((err) => {
      callback(err);
    });
  });
};

Itunes.prototype.getApps = function(callback) {
  const url = `${this.options.settingsURL}/app-info/all`;
  this.getAPIURL(url, callback);
};

Itunes.prototype.getSettings = function(callback) {
  const url = `${this.options.settingsURL}/settings/all`;
  this.getAPIURL(url, callback);
};

Itunes.prototype.request = function(query, callback) {
  this._queue.push({
    query: query,
    completed: callback
  });
};

Itunes.prototype.getAPIURL = function(uri, callback) {
  async.whilst((callback) => {
    callback(null, this._queue.paused);
  }, (callback) => {
    setTimeout(() => callback(null), 500);
  }, (err) => {
    request.get({
      uri: uri,
      headers: this.getHeaders()
    }).then((res) => {
      const data = JSON.parse(res);
      callback(null, data);
    }).catch((err) => {
      callback(err, null);
    });
  });
}

Itunes.prototype.getCookies = function() {
  return this._cookies;
};

Itunes.prototype.getHeaders = function() {
  return {
    'Content-Type': 'application/json;charset=UTF-8',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://analytics.itunes.apple.com',
    'X-Requested-By': 'analytics.itunes.apple.com',
    'Referer': 'https://analytics.itunes.apple.com/',
    'Cookie': this._cookies
  };
}

module.exports.Itunes = Itunes;
module.exports.AnalyticsQuery = query.AnalyticsQuery;
module.exports.frequency = query.frequency;
module.exports.measures = query.measures;
module.exports.dimension = query.dimension;
module.exports.dimensionFilterKey = query.dimensionFilterKey;
module.exports.region = query.region;
module.exports.territory = query.territory;
module.exports.platform = query.platform;
module.exports.source = query.source;
module.exports.frequency = query.frequency;
module.exports.queryType = query.queryType;
