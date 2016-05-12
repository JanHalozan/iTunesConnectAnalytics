var itca = require('./../src/analytics.js');
var AnalyticsQuery = itca.AnalyticsQuery;

exports.testMetricsQueryConfig = function(test) {
  var query = new AnalyticsQuery.metrics();

  test.ok(query.endpoint == '/data/time-series');

  test.done();
};
