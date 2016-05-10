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
  crashes: 'crashes',
  payingUsers: 'payingUsers'
};

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
  this.endpoint = '/data/time-series'

  _.extend(this.config, config);

  return this;
};

Query.prototype.date = function(start, end) {
	this.config.start = toMomentObject( start );
	this.config.end = toMomentObject(
		((typeof end == 'undefined') ? start : end)
	);

	return this;
}


Query.prototype.assembleBody = function() {
  this.config.start = toMomentObject(this.config.start);
  this.config.end = toMomentObject(this.config.end);

  if (this.config.end.diff(this.config.start, 'days') === 0 && _.isArray(this._time)) {
    this.config.start = this.config.start.subtract(this._time[0], this._time[0]);
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
    group: this.config.group,
    frequency: this.config.frequency,
    adamId: [
      this.adamId
    ],
    dimensionFilters: this.config.dimensionFilters,
    measures: this.config.measures
  };

  return body;
};

module.exports.Query = Query;

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
