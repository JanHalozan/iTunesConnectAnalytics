'use strict';

var _ = require('underscore');
var request = require('request');
var async = require('async');
var moment = require('moment');
var query = require('./query.js');
var url = require('url');

var Itunes = function(username, password, options) {
  this.options = {
    baseURL: 'https://itunesconnect.apple.com',
    loginURL: 'https://idmsa.apple.com/appleauth/auth/signin',
    appleWidgetKey: '22d448248055bab0dc197c6271d738c3',
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
  var query = task.query;
  var completed = task.completed;

  var requestBody = query.assembleBody();
  var uri = url.parse(query.apiURL + query.endpoint);

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
  var self = this;
  request.post({
    url: this.options.loginURL,
    headers: {
      'Content-Type': 'application/json',
      'X-Apple-Widget-Key': this.options.appleWidgetKey
    },
    json: {
      'accountName': username,
      'password': password,
      'rememberMe': false
    }
  }, function(error, response, body) {
    var cookies = response ? response.headers['set-cookie'] : null;

    if (error || !(cookies && cookies.length)) {
      error = error || new Error('There was a problem with loading the login page cookies. Check login credentials.');
      self.options.errorCallback(error);
    } else {
      //extract the account info cookie
      var myAccount = /myacinfo=.+?;/.exec(cookies);

      if (myAccount == null || myAccount.length == 0) {
        error = error || new Error('No account cookie :( Apple probably changed the login process');
        self.options.errorCallback(error);
      } else {
        request.get({
          url: 'https://olympus.itunes.apple.com/v1/session', //self.options.baseURL + "/WebObjects/iTunesConnect.woa",
          followRedirect: false,	//We can't follow redirects, otherwise we will "miss" the itCtx cookie
          headers: {
            'Cookie': myAccount[0]
          },
        }, function(error, response, body) {
          cookies = response ? response.headers['set-cookie'] : null;

          if (error || !(cookies && cookies.length)) {
            error = error || new Error('There was a problem with loading the login page cookies.');
            self.options.errorCallback(error);
          } else {
            //extract the itCtx cookie
            var itCtx = /itctx=.+?;/.exec(cookies);
            if (itCtx == null || itCtx.length == 0) {
              error = error || new Error('No itCtx cookie :( Apple probably changed the login process');
              self.options.errorCallback(error);
            } else {
              self._cookies = myAccount[0] + " " + itCtx[0];
              self.options.successCallback(self._cookies);
              self._queue.resume();
            }
          }
        });
      }
    }
  });
};

Itunes.prototype.changeProvider = function(providerId, callback) {
  var self = this;
  async.whilst(function() {
    return self._queue.paused;
  }, function(callback) {
    setTimeout(function() {
      callback(null);
    }, 500);
  }, function(error) {
    request.get({
      url: 'https://analytics.itunes.apple.com/analytics/api/v1/settings/provider/' + providerId,
      headers: self.getHeaders()
    }, function(error, response, body) {
      //extract the account info cookie
      var myAccount = /myacinfo=.+?;/.exec(self._cookies);

      if (myAccount == null || myAccount.length == 0) {
        error = error || new Error('No account cookie :( Apple probably changed the login process');
      } else {
        var cookies = response ? response.headers['set-cookie'] : null;

        if (error || !(cookies && cookies.length)) {
          error = error || new Error('There was a problem with loading the login page cookies.');
        } else {
          //extract the itCtx cookie
          var itCtx = /itctx=.+?;/.exec(cookies);
          if (itCtx == null || itCtx.length == 0) {
            error = error || new Error('No itCtx cookie :( Apple probably changed the login process');
          } else {
            self._cookies = myAccount[0] + " " + itCtx[0];
          }
        }
      }
      callback(error);
    });
  });
};

Itunes.prototype.getApps = function(callback) {
  var url = 'https://analytics.itunes.apple.com/analytics/api/v1/app-info/app';
  this.getAPIURL(url, callback);
};

Itunes.prototype.getSettings = function(callback) {
  var url = 'https://analytics.itunes.apple.com/analytics/api/v1/settings/all';
  this.getAPIURL(url, callback);
};

Itunes.prototype.getUserInfo = function(callback) {
  var url = 'https://analytics.itunes.apple.com/analytics/api/v1/settings/user-info';
  this.getAPIURL(url, callback);
};

Itunes.prototype.request = function(query, callback) {
  this._queue.push({
    query: query,
    completed: callback
  });
};

Itunes.prototype.getAPIURL = function(uri, callback) {
  var self = this;
  async.whilst(function() {
    return self._queue.paused;
  }, function(callback) {
    setTimeout(function() {
      callback(null);
    }, 500);
  }, function(error) {
    request.get({
      uri: uri,
      headers: self.getHeaders()
    }, function(error, response, body) {
      if (!response.hasOwnProperty('statusCode')) {
  			error = new Error('iTunes Connect is not responding. The service may be temporarily offline.');
  			body = null;
  		} else if (response.statusCode == 401) {
  			error = new Error('This request requires authentication. Please check your username and password.');
  			body = null;
  		} else {
        try {
          body = JSON.parse(body);
        } catch (e) {
          error = new Error('Error parsing JSON');
          body = null;
        }
      }
      callback(error, body);
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
module.exports.platform = query.platform;
module.exports.frequency = query.frequency;
module.exports.queryType = query.queryType;
