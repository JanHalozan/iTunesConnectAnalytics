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
  uninstalls: 'uninstalls',
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
  websites: 'domainReferrer',
  apps: 'appReferrer',
  sourceType: 'source'
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
  websites: 'domainReferrer',
  source: 'source'
}

module.exports.source = {
  search: "Search",
  navigation: "Other",
  apps: "AppRef",
  websites: "WebRef",
  unknown: "Unknown"
}

module.exports.region = {
  usaCanada: '-100001',
  latinAmericaTheCaribbean: '-100002',
  europe: '-100003',
  asiaPacific: '-100004',
  africaMiddleEastIndia: '-100005'
}

module.exports.territory = {
  unitedStates: '143441',
  france: '143442',
  germany: '143443',
  unitedKingdom: '143444',
  austria: '143445',
  belgium: '143446',
  finland: '143447',
  greece: '143448',
  ireland: '143449',
  italy: '143450',
  luxembourg: '143451',
  netherlands: '143452',
  portugal: '143453',
  spain: '143454',
  canada: '143455',
  sweden: '143456',
  norway: '143457',
  denmark: '143458',
  switzerland: '143459',
  australia: '143460',
  newZealand: '143461',
  japan: '143462',
  hongKong: '143463',
  singapore: '143464',
  china: '143465',
  korea: '143466',
  india: '143467',
  mexico: '143468',
  russia: '143469',
  taiwan: '143470',
  vietnam: '143471',
  southAfrica: '143472',
  malaysia: '143473',
  philippines: '143474',
  thailand: '143475',
  indonesia: '143476',
  pakistan: '143477',
  poland: '143478',
  saudiArabia: '143479',
  turkey: '143480',
  unitedArabEmirates: '143481',
  hungary: '143482',
  chile: '143483',
  nepal: '143484',
  panama: '143485',
  sriLanka: '143486',
  romania: '143487',
  czechRepublic: '143489',
  israel: '143491',
  ukraine: '143492',
  kuwait: '143493',
  croatia: '143494',
  costaRica: '143495',
  slovakia: '143496',
  lebanon: '143497',
  qatar: '143498',
  slovenia: '143499',
  colombia: '143501',
  venezuela: '143502',
  brazil: '143503',
  guatemala: '143504',
  argentina: '143505',
  elSalvador: '143506',
  peru: '143507',
  dominicanRepublic: '143508',
  ecuador: '143509',
  honduras: '143510',
  jamaica: '143511',
  nicaragua: '143512',
  paraguay: '143513',
  uruguay: '143514',
  macau: '143515',
  egypt: '143516',
  kazakhstan: '143517',
  estonia: '143518',
  latvia: '143519',
  lithuania: '143520',
  malta: '143521',
  moldova: '143523',
  armenia: '143524',
  botswana: '143525',
  bulgaria: '143526',
  jordan: '143528',
  kenya: '143529',
  macedonia: '143530',
  madagascar: '143531',
  mali: '143532',
  mauritius: '143533',
  niger: '143534',
  senegal: '143535',
  tunisia: '143536',
  uganda: '143537',
  anguilla: '143538',
  bahamas: '143539',
  antiguaAndBarbuda: '143540',
  barbados: '143541',
  bermuda: '143542',
  virginIslands: '143543',
  caymanIslands: '143544',
  dominica: '143545',
  grenada: '143546',
  montserrat: '143547',
  stKittsAndNevis: '143548',
  saintLucia: '143549',
  stVincentAndTheGrenadines: '143550',
  trinidadAndTobago: '143551',
  turksAndCaicos: '143552',
  guyana: '143553',
  suriname: '143554',
  belize: '143555',
  bolivia: '143556',
  cyprus: '143557',
  iceland: '143558',
  bahrain: '143559',
  bruneiDarussalam: '143560',
  nigeria: '143561',
  oman: '143562',
  algeria: '143563',
  angola: '143564',
  belarus: '143565',
  uzbekistan: '143566',
  azerbaijan: '143568',
  yemen: '143571',
  tanzania: '143572',
  ghana: '143573',
  albania: '143575',
  benin: '143576',
  bhutan: '143577',
  burkinaFaso: '143578',
  cambodia: '143579',
  capeVerde: '143580',
  chad: '143581',
  congo: '143582',
  fiji: '143583',
  gambia: '143584',
  guinea: '143585',
  kyrgyzstan: '143586',
  lao: '143587',
  liberia: '143588',
  malawi: '143589',
  mauritania: '143590',
  micronesia: '143591',
  mongolia: '143592',
  mozambique: '143593',
  namibia: '143594',
  palau: '143595',
  papuaNewGuinea: '143597',
  sãoToméandPríncipe: '143598',
  seychelles: '143599',
  sierraLeone: '143600',
  solomonIslands: '143601',
  swaziland: '143602',
  tajikistan: '143603',
  turkmenistan: '143604',
  zimbabwe: '143605'
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
  
  if (!_.isArray(this.config.measures)) {
    this.config.measures = [this.config.measures];
  }
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
