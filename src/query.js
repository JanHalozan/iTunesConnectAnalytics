'use strict';

var _ = require('underscore');
var moment = require('moment');

module.exports.frequency = {
  day: 'DAY',
  week: 'WEEK',
  month: 'MONTH'
};

module.exports.measures = {
  installs: 'installs',
  sessions: 'sessions',
  pageViews: 'pageViewCount',
  activeDevices: 'activeDevices',
  activeLast30days: 'rollingActiveDevices',
  crashes: 'crashes',
  payingUsers: 'payingUsers',
  units: 'units',
  sales: 'sales',
  iap: 'iap',
  impressions: 'impressionsTotal',
  impressionsUnique: 'impressionsTotalUnique',
  pageViewUnique: 'pageViewUnique'
};

module.exports.dimension = {
  appVersion: 'appVersion',
  campaigns: 'campaignId',
  device: 'platform',
  platformVersion: 'platformVersion',
  region: 'region',
  territory: 'storefront',
  websites: 'domainReferrer'
}

module.exports.dimensionFilterKey = {
  appPurchaseWeek: 'apppurchaseWeek',
  apppurchaseDay: 'apppurchaseDay',
  apppurchaseMonth: 'apppurchaseMonth',
  appVersion: 'appVersion',
  campaigns: 'campaignId',
  device: 'platform',
  platformVersion: 'platformVersion',
  territory: 'storefront',
  region: 'region',
  websites: 'domainReferrer'
}

module.exports.platform = {
  iPhone: 'iPhone',
  iPad: 'iPad',
  iPod: 'iPod',
  appleTV: 'AppleTV'
}

module.exports.frequency = {
  days: 'DAY',
  weeks: 'WEEK',
  months: 'MONTH'
}

module.exports.queryType = {
  sources : 'sources',
  metrics : 'metrics'
}

function AnalyticsQuery(type, appId, config) {
  var fn = Query.prototype[type];
  if (typeof fn !== 'function') {
    throw new Error('Unknown query type: ' + type);
  }

  return new Query(appId, config)[type]();
}

AnalyticsQuery.metrics = function(appId, config) {
  return new Query(appId, config).metrics();
}

AnalyticsQuery.sources = function(appId, config) {
  return new Query(appId, config).sources();
}

var Query = function(appId, config) {
  this.config = {
    start: moment(),
    end: moment(),
    group: null,
    frequency: 'DAY',
    dimensionFilters: []
  };

  this.adamId = appId;
  this.apiURL = 'https://analytics.itunes.apple.com/analytics/api/v1';

  _.extend(this.config, config);
  
  if (this.config.group) {
    this.config.group = _.extend({ 
      metric: this.config.measures[0], 
      rank: "" /*  TODO: Find out what this actually does. Not adding this errors, so defaulting it to blank */, 
      limit: 200 
    }, this.config.group);
  }

  // Private
  this._time = null;

  return this;
};

Query.prototype.metrics = function() {
  this.endpoint = '/data/time-series';

  var keys = ['limit', 'dimension'];
  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i];
    delete this.config[key];
  }

  var defaults = [
    {key: 'group', value: null},
    {key: 'dimensionFilters', value: []},
  ];
  for (var i = 0; i < defaults.length; ++i) {
    var dflt = defaults[i];
    if (this.config[dflt.key] === undefined)
      this.config[dflt.key] = dflt.value;
  }

  return this;
}

Query.prototype.sources = function() {
  this.endpoint = '/data/sources/list';
  var keys = ['limit', 'group', 'dimensionFilters'];
  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i];
    delete this.config[key];
  }

  var defaults = [
    {key: 'limit', value: 200},
    {key: 'dimension', value: 'domainReferrer'},
  ];
  for (var i = 0; i < defaults.length; ++i) {
    var dflt = defaults[i];
    if (this.config[dflt.key] === undefined)
      this.config[dflt.key] = dflt.value;
  }

  return this;
}

Query.prototype.date = function(start, end) {
	this.config.start = toMomentObject(start);
  end = (typeof end == 'undefined') ? start : end;
	this.config.end = toMomentObject(end);

	return this;
}

Query.prototype.time = function(value, unit){
  this._time = [value, unit];
  return this;
}

Query.prototype.limit = function(limit){
  this.config.limit = limit;
  return this;
}

Query.prototype.assembleBody = function() {
  this.config.start = toMomentObject(this.config.start);
  this.config.end = toMomentObject(this.config.end);

  if (this.config.end.diff(this.config.start, 'days') === 0 && _.isArray(this._time)) {
    this.config.start = this.config.start.subtract(this._time[0], this._time[1]);
  } else if (this.config.end.diff(this.config.start) < 0) {
    this.config.start = this.config.end;
  }

  var timestampFormat = 'YYYY-MM-DD[T00:00:000Z]';

  if (!_.isArray(this.config.measures)) {
    this.config.measures = [this.config.measures];
  }

  var body = {
    startTime: this.config.start.format(timestampFormat),
    endTime: this.config.end.format(timestampFormat),
    adamId: [
      this.adamId
    ]
  };

  var cfg = {};
  _.extend(cfg, this.config);
  delete cfg.start;
  delete cfg.end;

  for (var prop in cfg) {
    body[prop] = cfg[prop];
  }

  return body;
};

module.exports.AnalyticsQuery = AnalyticsQuery;

function toMomentObject(date) {
  if (moment.isMoment(date))
  return date;

  if (date instanceof Date)
    return moment(date);

  var regex = new RegExp(/([0-9]{4})-([0-9]{2})-([0-9]{2})/);
  if(_.isString(date) && !!(date.match(regex)))
    return moment(date, "YYYY-MM-DD");

  throw new Error('Unknown date format. Please use Date() object or String() with format YYYY-MM-DD.');
}
