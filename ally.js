var http = require('http');
var url = require('url');
var OAuth = require('oauth');
var fs = require('fs');
var util = require('util');
var technical = require('./technical');
var config = require('./config');

  var oauth = new OAuth.OAuth(
      'https://developers.tradeking.com/oauth/request_token',
      'https://developers.tradeking.com/oauth/access_token',
      'XlI5L8HoIvcdcOpC3J5KWlZRx0AM3WKoDCOAAoNxWew0',
      'zFDjJ8gs2TCaLNkm7jxDmYZ6r9TcN3gzT6IHC4Nhylc2',
      '1.0A',
      null,
      'HMAC-SHA1'
  );
//hi there
function getTimeSales(symbol, callback)
{
  var timeSales = {};
  var url = 'https://api.tradeking.com/v1/market/timesales.json?symbols=' + symbol + '&startdate=' + config.start_date + '&interval=1min';
  oauth.get(
    url,
    'Df6oUalv6FmFxD0x0HS84BZaPkLGFZUgqZQ7r0ZqpqM0', //test user token
    'jUmK8DwJIVZU6ZmUl26RUYWpJIGv6qGG9QS5ksp0Gw40', //test user secret
    function (e, data, res){
      if (e) console.error(e);
      var obj = JSON.parse(data);
      var timeSales = {};
      for(var i in obj["response"]["quotes"]["quote"])
      {
        var datetime = obj["response"]["quotes"]["quote"][i]["datetime"];
        var price = obj["response"]["quotes"]["quote"][i]["last"];
        timeSales[datetime] = price;
      }
      callback(timeSales);
  });
}

exports.getTimeSales = function(symbol, callback)
{
  getTimeSales(symbol, function(data){
    callback(data);
  })
}

// getTimeSales('AAPL', '2018-04-01', function(data){
//   // technical.rsi(data, function(rsidata){
//     // console.log(rsidata);
//   // });
//   console.log(data);
// });

// http.createServer(function (req, res) {
//   res.writeHead(200, {'Content-Type': 'text/html'});
//   var q = url.parse(req.url, true);
//   var qdata = q.query;
//   var timestring = qdata.startdate;
//   if (timestring != undefined)
//   getTimeSales(qdata.symbol,timestring,function(data){
//     technical.rsi(data, function(rsidata) {
//       for (var i in data)
//       {
//         var rsi = rsidata[i];
//         res.write("'" + i + "' : '" + rsi + "',</br>");
//       }
//       res.end() ;
//     });
//   });
// }).listen(8080);

function getRSIRawCalls(symbol, startdate, buythreshold, sellthreshold, callback)
{
  var calls = [];
  getTimeSales(symbol, startdate, function(timesales) {
    technical.rsi(timesales, function(rsidata) {
      for(var i in rsidata)
      {
        var rsi = rsidata[i];
        if(rsi > sellthreshold)
        {
          var call = {};
          call['symbol'] = symbol;
          call['order'] = 'sell';
          call['date'] = i;
          call['price'] = timesales[i];
          calls.push(call);
        }
        if(rsi < buythreshold)
        {
          var call = {};
          call['symbol'] = symbol;
          call['order'] = 'buy';
          call['date'] = i;
          call['price'] = timesales[i];
          calls.push(call);
        }
      }
      callback(calls);
    });
  });
}

function getBatchRSICalls()
{
  var batchCalls = [];
  var promise = new Promise(function(response, reject) {
    var symbols = config.watchlist_10;
    var count = 0;
    for (var i = 0; i < symbols.length; i++)
    {
      var symbol = symbols[i];
      getRSIRawCalls(symbol, config.start_date, config.rsi_buy_threshold, config.rsi_sell_threshold, function (rawcalls) {
        // console.log(rawcalls);
        cooldown(rawcalls, config.cooldown, function (cooledcalls) {
          // console.log(cooledcalls);
          for (var j = 0; j < cooledcalls.length; j++)
          {
            var call = cooledcalls[j];
            // console.log(call);
            batchCalls.push(call);
          }
          count++;
          if(count == symbols.length)
          {
            after();
          }
        })
      });
      if(count == symbols.length)
      {
        after();
      }
    }
    function after() {
      var sortedBatchCalls = dateSort(batchCalls);
      response(sortedBatchCalls);
    }
  });
  return promise;
}

// getBatchRSICalls().then(function(data) {
  // console.log(data);
  // console.log(data.length);
// });

// var symbol = config.watchlist_10[0];
// getRSIRawCalls(symbol, config.start_date, config.rsi_buy_threshold, config.rsi_sell_threshold, function (data) {
//   cooldown(data, 72, function (data2) {
//     console.log(data2);
//   });
  // var call = data[0];
  // console.log(call.order);
  // console.log(data);
// });

// var symbol = config.watchlist_10[0];
// getRSIRawCalls(symbol, config.start_date, config.rsi_buy_threshold, config.rsi_sell_threshold, function (data) {
  // console.log(data);
//   cooldown(data, 72, function(cooledcalls) {
//     console.log(cooledcalls);
//   });
// });

exports.getBatchCalls = function(callback)
{
  getBatchRSICalls().then(function (data) {
    callback(data);
  });
}

function cooldown(rawcalls, hours, callback)
{
  var cooledcalls = [];
  var lastbuydate;
  var first = true;
  var justsold = false;
  for(var i = 0; i < rawcalls.length; i++)
  {
    var call = rawcalls[i];
    var order = call.order;
    if(order == 'sell' && first)
    {
      continue;
    }
    if(order == 'sell' && justsold)
    {
      continue;
    }
    if(order == 'sell')
    {
      cooledcalls.push(call);
      justsold = true;
    }
    if(order == 'buy' && first)
    {
      var currentdate = new Date(call.date);
      lastbuydate = currentdate;
      cooledcalls.push(call);
      first = false;
      justsold = false;
    }
    if(order == 'buy' && !first)
    {
      var currentdate = new Date(call.date);
      if(Math.abs(currentdate-lastbuydate) > (hours*3600000))
      {
        lastbuydate = currentdate;
        cooledcalls.push(call);
        justsold = false;
      }
    }
  }
  callback(cooledcalls);
}

function latestPrice(symbol, callback)
{
  var url = 'https://api.tradeking.com/v1/market/ext/quotes.json?symbols=' + symbol;
  oauth.get(
    url,
    'Df6oUalv6FmFxD0x0HS84BZaPkLGFZUgqZQ7r0ZqpqM0', //test user token
    'jUmK8DwJIVZU6ZmUl26RUYWpJIGv6qGG9QS5ksp0Gw40', //test user secret
    function (e, data, res){
      if (e) console.error(e);
      var obj = JSON.parse(data);
      var last = obj["response"]["quotes"]["quote"]["last"];
      callback(last);
  });
}

exports.latestPrice = function(symbol, callback)
{
  latestPrice(symbol, function(data) {
    callback(data);
  });
}

function dateSort(rawdata)
{
  // console.log(rawdata);
  var data = rawdata;
  var sorted = [];
  while(data.length > 0)
  {
    var mincall = data[0];
    var mincallindex = 0;
    for (var i = 0; i < data.length; i++)
    {
      var currentcall = data[i];
      if(new Date(currentcall.date) - new Date(mincall.date) < 0)
      {
        mincallindex = i;
        mincall = currentcall;
      }
    }
    // console.log(mincallindex);
    sorted.push(mincall);
    data.splice(mincallindex, 1);
  }
  return sorted;
}
