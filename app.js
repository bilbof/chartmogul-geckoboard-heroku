var https = require("https");
var Geckoboard = require('geckoboard-push');

///////////////////////////////
// Your personal settings /////
///////////////////////////////

// Geckoboard API key
var geckoKey = process.env.GECKOBOARD_ACCOUNT_API_KEY; // You can find this at https://.geckoboard.com/account/details

// ChartMogul API keys. Found at https://app.chartmogul.com/#admin/api (admin permission required).
var chartmogulApiToken = process.env.CHARTMOGUL_ACCOUNT_API_TOKEN;
var chartmogulSecretKey = process.env.CHARTMOGUL_ACCOUNT_SECRET_KEY;

// Data refresh rate. How often you want to send fresh data to your Geckoboard (in milliseconds).
var refreshRate = 15000; 

// Settings for line graph:
var lineGraph = {
	enabled: true, // turn this on or off with (true) or (false).
	metric: 'mrr', // see the Metrics API documentation for more options: https://github.com/chartmogul/metrics-api
	startDate: '2015-01-31', // start date of the line graph
	endDate: '2016-01-31', // end date of the line graph
	interval: 'month', // available options: day, week, month, quarter, year (depends on the metric, see the Metrics API documentation)
	widgetKey: process.env.GECKOBOARD_ACCOUNT_WIDGET_KEY
}

// Settings for GeckoMeter
var geckoMeter = {
	enabled: false, // turn this on or off with (true) or (false).
	metric: 'mrr', // see the Metrics API documentation for more options: https://github.com/chartmogul/metrics-api
	startDate: '2015-01-01',
	endDate: '2015-12-31', // use the current date here.
	interval: 'month',
	widgetKey: 'your_geckoboard_line_graph_widget_key',
	min: '5000', // the minimum value of your GeckoMeter
	max: '15000' // the maximum value of your GeckoMeter
}

/////////////////////////
// ChartMogul API ///////
/////////////////////////

function getMetrics(callback, options) {
	if (chartmogulApiToken) {
		var p = '/v1/metrics/all?start-date='+options.startDate+'&end-date='+options.endDate+'&interval='+options.interval;
		
		return https.get({
			host: 'api.chartmogul.com',
			path: p,
			auth: chartmogulApiToken+":"+chartmogulSecretKey
		}, function(response) {
			var body = '';
			response.on('data', function(d) {
			    body += d;
			});
			response.on('end', function() {
				var parsed = JSON.parse(body);
				callback(parsed, options);
			});
		});
	}
	else { console.log("App requires keys from config. Details: https://github.com/bilbof/chartmogul-geckoboard") }
}

/////////////////////////
// Geckoboard API ///////
/////////////////////////

var foo = new Geckoboard({api_key: geckoKey});

function populateLineGraph(data, options) {
	var bar = foo.line(options.widgetKey);

	var series = [{
			"data": []
		}]

	var axis = {
		x: {
			"labels": [],
			"type": "datetime"
		},
		y: {
			// can be 'percent', 'decimal' or 'currency'
			"format": "currency",
			"unit": "USD"
		}
	}

	for (var i = data.entries.length - 1; i >= 0; i--) {
		series[0]["data"].unshift(data.entries[i][options.metric] / 100);
		axis.x["labels"].unshift(data.entries[i].date);
	};

	bar.send(axis, series, function(err, response){
	  
	})
}

function populateGeckoMeter(data, options) {
	var bar = foo.geckoMeter(options.widgetKey);

	var value = data.entries[data.entries.length-1][options.metric] / 100;

	var min = {
	  "value" : options.min
	}

	var max = {
		"value": options.max
	}

	var type = 'standard';

	bar.send(value, min, max, type, function(err, response){
	  console.log(err, response);
	})
}


/////////////////////////
// Initialize ///////////
/////////////////////////

function init() {
	if (lineGraph.enabled) {
		getMetrics(
			populateLineGraph,
			lineGraph
			)
	}

	if (geckoMeter.enabled) {
		getMetrics(
			populateGeckoMeter,
			geckoMeter
			)
	}

}

function refresh() {
    console.log("Refreshing Geckoboard");
    init();
    setTimeout(refresh,refreshRate);
}

	refresh();
