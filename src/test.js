var itc = require('./analytics.js');
var Itunes = itc.Itunes;
var Query = itc.Query;
var Report = itc.Report;

var instance = new Itunes('UNAME', 'PASS');

var query = Report.sources('940584421', {
  measures:  itc.measures.pageViews,
  dimension: itc.dimension.websites
}).time(7,itc.frequency.day);

instance.request(query, function(error, result) {
  console.log(JSON.stringify(result));
});
