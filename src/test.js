var itc = require('./analytics.js');
var Itunes = itc.Itunes;
var Query = itc.Query;

var instance = new Itunes('UNAME', 'PASS');

var query = new Query('940584421', {
  measures: itc.measures.pageViews
});

instance.request(query, function(error, result) {
  console.log(JSON.stringify(result));
});
