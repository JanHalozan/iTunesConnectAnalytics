# iTunesConnectAnalytics

[![CircleCI](https://circleci.com/gh/JanHalozan/iTunesConnectAnalytics/tree/master.svg?style=shield)](https://circleci.com/gh/JanHalozan/iTunesConnectAnalytics/tree/master)

A nodejs module wrapping the iTunes Connect Analytics API. Allows retrieving data available under the `App Analytics` section of iTunes Connect.

Original idea taken from [node-itunesconnect](https://github.com/stoprocent/node-itunesconnect). But that one only fetches `Sales  & Reports` which are outdated and contain a lot less info.

_If you're building a dashboard for yourself or your company you might be better off with checking out [Databox](https://databox.com) (where I currently work) where we provide a super easy to set up iTunesConnect integration as well as a Google Play Developer Console integration._

## Installation

`$ npm install itunesconnectanalytics`


## Example usage

The usual boilerplate:

```js
var itc = require('itunesconnectanalytics');
var Itunes = itc.Itunes;
var AnalyticsQuery = itc.AnalyticsQuery;

var username = 'UNAME';
var password = 'PASS';
var appId = '12345'; //Found in My Apps -> App -> Apple ID or read below on getting the app id.

var instance = new Itunes(username, password, {
  errorCallback: function(e) {
    console.log('Error logging in: ' + e);
  },
  successCallback: function(d) {
    console.log('Logged in');
  }
});
```

Getting available apps. Useful for getting app IDs needed for later queries. The field you're interested in is `adamId`.

```js
instance.getApps(function(error, data) {
  console.log(JSON.stringify(data, null, 2));
});
```

Getting the time interval for which data is available. Use `dataEndDate` property of the `configuration` object to know which is the most recent date that iTunesConnect has data for (the last day or two usually become available with a certain delay). You can use this date when making requests to avoid getting 0 values for days which do not have data yet.

```js
instance.getSettings(function(error, data) {
  // To get end date:
  // var end = data.configuration.dataEndDate;

  console.log(JSON.stringify(data, null, 2));
});
```

Creating an instance and getting app units for the specified time interval.

```js
var query = AnalyticsQuery.metrics(appId, {
  measures:  itc.measures.units,
}).date('2016-04-10','2016-05-10');

instance.request(query, function(error, result) {
  console.log(JSON.stringify(result, null, 2));
});
```

### AnalyticsQuery

The `AnalyticsQuery` object is used to describe what kind of data should be retrieved. Each query must contain the following properties (they are set by default but you can customize them):

- `start` - Date in format `YYYY-MM-DD`.
- `end` - Date in format `YYYY-MM-DD`.
- `frequency` - Day, week or month.
- `measures` - metrics to be fetched.

Metrics are specified under `measures` key in query options. They can also be an array `metrics: [itc.measures.units, itc.measures.sales]`.

Available metris:

- installs
- sessions
- pageViews
- activeDevices
- crashes
- payingUsers
- units
- sales
- iap (in app purchases)
- impressions
- impressionsUnique

#### Query types

There are two query types. One is `metrics` and the other is `sources`.

##### Metrics

Metrics query is used to retrieve data under the __Metrics__ section in analytics.

Example metrics query:

Fetches installs and crashes for the past day.

```js
var query = new AnalyticsQuery.metrics(appId, {
  measures: [itc.measures.installs, itc.measures.crashes]
}).time(1, 'days');
```

The full query can pretty much pull all data that can be accessed from the metrics tab of iTunes Analytics - 

```js
var query = new AnalyticsQuery.metrics(appId, {
	measures: [itc.measures.impressionsUnique /* First key required, Second key is optional for comparison */ , itc.measures.pageViewUnique],
	frequency: itc.frequency.months,  /* Optional - default is days */
	/* Grouping is optional - you can leave it out if you don't want data grouped by anything. 
	This is same as selecting "view by" in Analytics */
	group: {
		metric: itc.measures.impressionsUnique /* This is optional - it has to be one of the metric you add in
		measures above, else it will error. 
												
		If you leave it blank, we'll default it to the first measures, which is normally what you need. */, 
		dimension: itc.dimension.territory,  /* this is the main thing you need to add when grouping */
		rank: "", /* Optional - not really sure how it works, but else leave it alone and we will default it to blank. 
		TODO: Find out what this actually does */
		
		limit: 10 /* Optional - default is 200. TODO: Find out what this actually does */ 
	},
	/* Filtering is optional - you can leave it out if you don't want data filtered by anything. This is same as 
	selecting filtered by in Analytics */
	
	/* You can choose at most 2 filters if you don't use group by, and 1 filter if you use group by */

	/* NOTE: every metric cannot be grouped/filtered by every dimension/dimensionFilterKey - for e.g. for app
	impressions, app version is irrelevant - using incompatible dimensions with metrics will lead to errored responses.
	This is currently not checked by this module and is your responsibility. When in doubt, try out the Analytics
	interface and see what is allowed and what isn't. */
	
	dimensionFilters: [
		{dimensionKey: itc.dimensionFilterKey.device, optionKeys: [itc.platform.iPad]}
	]
}).date('2016-05-01', '2016-06-30'); //can be date or time like above. 
```


##### Sources

Sources query is used to retrieve data under the __Sources__ section in analytics.

From sources you can retrieve top websites or top campaigns. This can be specified using the `dimension` setting in options.

You can also specify a limit which limits the number of results.

Example sources query:

Get app store views for the last day from Top websites.

```js
var query = new AnalyticsQuery.sources(appId, {
  measures: itc.measures.pageViews,
  dimension: itc.dimension.websites,
  limit 100
}).time(1, 'days');
```

#### Some other examples

```js
// Get App Store Views for last 7 days by website sources
var query = AnalyticsQuery.sources('940584421', {
  measures:  itc.measures.pageViews,
  dimension: itc.dimension.websites
}).time(7,itc.frequency.day);

instance.request(query, function(error, result) {
  console.log(JSON.stringify(result, null, 2));
});

// Get installs for each day in date range 2016-04-10 to 2016-05-10
var query = AnalyticsQuery.metrics('940584421', {
  measures:  itc.measures.installs,
}).date('2016-04-10','2016-05-10');

instance.request(query, function(error, result) {
  console.log(JSON.stringify(result, null, 2));
});

// Get sessions for each day in last month
var query = AnalyticsQuery.metrics('940584421', {
  measures:  itc.measures.sessions,
}).time(1,itc.frequency.month);


instance.request(query, function(error, result) {
  console.log(JSON.stringify(result, null, 2));
});

//Make an arbitrary GET request to the itunes connect API
var url = 'https://analytics.itunes.apple.com/analytics/api/v1/settings/user-info'; //Get info about yourself :)
instance.getAPIURL(url, function(error, result) {
  console.log(JSON.stringify(result, null, 2));
});
```

## TODO

- More examples
- Tests

## Authors

- [JanHalozan](https://github.com/JanHalozan)
