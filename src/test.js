var itc = require('./analytics.js');
var Itunes = itc.Itunes;
var Query = itc.Query;
var Report = itc.Report;

var instance = new Itunes('UNAME', 'PASS');

// Get App Store Views for last 7 days by website sources
var query = Report.sources('940584421', {
  measures:  itc.measures.pageViews,
  dimension: itc.dimension.websites
}).time(7,itc.frequency.day);

instance.request(query, function(error, result) {
  console.log(JSON.stringify(result));
});

// Get installs for each day in date range 2016-04-10 to 2016-05-10
var query = Report.metrics('940584421', {
  measures:  itc.measures.installs,
}).date('2016-04-10','2016-05-10');

instance.request(query, function(error, result) {
  console.log(JSON.stringify(result));
});

// Get sessions for each day in last month
var query = Report.metrics('940584421', {
  measures:  itc.measures.sessions,
}).time(1,itc.frequency.month);


instance.request(query, function(error, result) {
  console.log(JSON.stringify(result));
});
