'use strict';

var _ = require('underscore');
var request = require('request');
var async = require('async');
var moment = require('moment');
var query = require('./query.js');
var url = require('url');

function Itunes(username, password, options) {
  this.options = {
    baseURL: 'https://itunesconnect.apple.com',
    loginURL: 'https://idmsa.apple.com/appleauth/auth/signin',
    appleWidgetKey: '22d448248055bab0dc197c6271d738c3',
    concurrentRequests: 2,
    errorCallback: function(e) { console.log('Login failure: ' + e); },
    successCallback: function(d) { console.log('Login success.'); }
  };
  
  _.extend(this.options, options);
  
  this._cookies = [];
  this._queue = async.queue(
    this.executeRequest.bind(this),
    this.options.concurrentRequests
  );
  this._queue.pause();
  
  if (typeof this.options['cookies'] !== 'undefined') {
    this._cookies = this.options.cookies;
    this._queue.resume();
  } else if (username && password)  {
    // TODO: remove auto login call, strange for a constructor
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
  const self = this;
  request.post({
    url: this.options.loginURL,
    headers: {
      'Content-Type': 'application/json',
      'X-Apple-Widget-Key': this.options.appleWidgetKey,
      'X-Requested-With': 'XMLHttpRequest'
    },
    json: {
      'accountName': username,
      'password': password,
      'rememberMe': false
    }
  }, function (error, response, body) { 
    self.handleLogin(error, response, body).then(r => { 
      self.options.successCallback(r)
    }).catch(e => {
      self.options.errorCallback(e)
    })
  });
};

Itunes.prototype.handleLogin = function(error, response, body) {
  const self = this;
  return new Promise(function (successCallback, errorCallback) {
    var cookies = response ? response.headers['set-cookie'] : null;
    
    if (error || !(cookies && cookies.length)) {
      error = error || new Error('There was a problem with loading the login page cookies. Check login credentials.');
      errorCallback(error);
    } else {
      //extract the account info cookie
      var myAccount = /myacinfo=.+?;/.exec(cookies);
      
      if (myAccount == null || myAccount.length == 0) {
        const loginError = self.getLoginError(response);
        error = error || new Error('No account cookie :( Apple probably changed the login process');
        if (loginError && loginError.id) {
          error.loginError = loginError
          if (loginError.id == LOGIN_ERROR_2FA) {
            self.options.twoFactor = {
              x_apple_id_session_id: response.headers["x-apple-id-session-id"],
              scnt: response.headers["scnt"]
            }
            
            const headers = self.twoFactorHeaders()
            request.get("https://idmsa.apple.com/appleauth/auth", {headers: headers}, function(error, response, body) {
            if (error || !body) {
              errorCallback(error)
              return
            }
            body = JSON.parse(body)
            // get devices
            if (body.trustedDevices) {
              self.options.twoFactor.trustedDevices = body.trustedDevices;
            }
            else if (body.trustedPhoneNumbers) {
              self.options.twoFactor.trustedPhoneNumbers = body.trustedPhoneNumbers;
            }
            else {
              // TODO: Send detailed error
              errorCallback(null)
              return
            }
            loginError.options = self.options;
            var resultError = new Error("2fa")
            resultError.loginError = loginError
            
            errorCallback(resultError)
            return
          })
          return
        }
        
      }
      errorCallback(error);
    } 
    else {
      const account = myAccount[0]
      
      request.get({
        url: 'https://olympus.itunes.apple.com/v1/session', //self.options.baseURL + "/WebObjects/iTunesConnect.woa",
        followRedirect: false,	//We can't follow redirects, otherwise we will "miss" the itCtx cookie
        headers: {Cookie: account},
      }, function(error, response, body) {
        var cookies = response ? response.headers['set-cookie'] : null;
        
        if (error || !(cookies && cookies.length)) {
          error = error || new Error('There was a problem with loading the login page cookies.');
          errorCallback(error);
        } else {
          // extract the itCtx cookie
          var itCtx = /itctx=.+?;/.exec(cookies);
          if (itCtx == null || itCtx.length == 0) {
            error = error || new Error('No itCtx cookie :( Apple probably changed the login process');
            errorCallback(error);
          } else {
            self._cookies = account + " " + itCtx[0];
            successCallback(self._cookies);
            self._queue.resume();  
          }
          successCallback(self._cookies);
          self._queue.resume();
        }
      });
    }
  }
})
}

Itunes.prototype.requestCodeOnDevice = function (identifier) {
  const self = this
  return new Promise(function(resolve, reject){
    const headers = self.twoFactorHeaders()
    request.put("https://idmsa.apple.com/appleauth/auth/verify/device/"+identifier+"/securitycode", {headers: headers}, function (error, response, body) {
    if (error) {
      reject(error)
      return
    }
    resolve()
  })
})
}

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

Itunes.prototype.twoFactorHeaders = function() {
  return {
    "Accept" : "application/json",
    "scnt" : this.options.twoFactor.scnt,
    "X-Apple-ID-Session-Id" : this.options.twoFactor.x_apple_id_session_id,
    "X-Apple-Widget-Key" : this.options.appleWidgetKey,
  }
}

Itunes.prototype.validateTwoFactor = function(securityCode, deviceIdentifier) {
  var self = this;
  return new Promise(function (resolve, reject){
    const headers = self.twoFactorHeaders()
    
    var url = 'https://idmsa.apple.com/appleauth/auth/verify/trusteddevice/securitycode';
    var params = { headers: headers, json: true, body: {securityCode: {code: securityCode}} }
    if (deviceIdentifier) {
      url = "https://idmsa.apple.com/appleauth/auth/verify/device/"+ deviceIdentifier +"/securitycode"
      params = {json: true, headers: headers, body:{code: securityCode}}
    }
    request.post(url, params, function(error, response, body) { 
      // 204 --> Good // 4xx bad (401)
      if (error || response.statusCode > 299) {
        reject(error || new Error(response.statusCode))
        return
      }
      self.handleLogin(error, response, body).then(r => { 
        resolve(r)
      }).catch(e => {
        reject(e)
      })
      
    // })
  });
})

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
  var headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://analytics.itunes.apple.com',
    'X-Requested-By': 'analytics.itunes.apple.com',
    'Referer': 'https://analytics.itunes.apple.com/',
    'Cookie': this._cookies
  };
  
  return headers
}

Itunes.prototype.getLoginError = function(response) {
  if (response.statusCode == loginErrors.LOGIN_ERROR_2FA.httpCode) {
    return loginErrors.LOGIN_ERROR_2FA;
  }
  
  // I hope for JS that there is better practice to perform this check 🙈
  if (!response) { return null; }
  if (!response.body) { return null; }
  if (!response.body.serviceErrors) { return null; }
  if (!response.body.serviceErrors[0]) { return null; }
  if (!response.body.serviceErrors[0].code) { return null; }
  
  const itcErrorCode = response.body.serviceErrors[0].code
  for (let errorId of Object.keys(loginErrors)) {
    const error = loginErrors[errorId];
    if (error.appleCode == itcErrorCode) {
      return error;
    }
  }
  return null;
}

const LOGIN_ERROR_LOCKED = "LOGIN_ERROR_LOCKED"
const LOGIN_ERROR_BAD_CREDENTIALS = "LOGIN_ERROR_BAD_CREDENTIALS"
const LOGIN_ERROR_2FA = "LOGIN_ERROR_2FA"
const loginErrors = {
  LOGIN_ERROR_LOCKED: {
    id: LOGIN_ERROR_LOCKED, 
    appleCode: "-20209", 
    httpCode: 403, 
  },
  LOGIN_ERROR_BAD_CREDENTIALS: {
    id: LOGIN_ERROR_BAD_CREDENTIALS,
    httpCode: 401,
    appleCode:"-20101",
  },
  LOGIN_ERROR_2FA: {
    id: LOGIN_ERROR_2FA,
    httpCode: 409,
  }
}


module.exports.loginErrors = loginErrors
module.exports.Itunes = Itunes;
module.exports.AnalyticsQuery = query.AnalyticsQuery;
module.exports.frequency = query.frequency;
module.exports.measures = query.measures;
module.exports.dimension = query.dimension;
module.exports.dimensionFilterKey = query.dimensionFilterKey;
module.exports.platform = query.platform;
module.exports.frequency = query.frequency;
module.exports.queryType = query.queryType;
