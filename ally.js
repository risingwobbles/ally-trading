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

exports.getTimeSalesFromAPI = function(rawsymbol, callback)
{
  var timeSales = {};
  var symbol = "";
  for (var x = 0; x < rawsymbol.length; x++)
  {
    var c = rawsymbol.charAt(x);
    if(c == '.') c = '\'';
    symbol = symbol + c;
  }
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

function getRSIRawCalls(symbol, startdate, buythreshold, sellthreshold, callback)
{
  var calls = [];
  getTimeSalesFromFile(symbol, config.rsi_interval).then(function(timesales) { // Get timeSales from Local Files
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

exports.getBatchRSICalls = function()
{
  var batchCalls = [];
  var promise = new Promise(function(response, reject) {
    var symbols = config.watchlist;
    var count = 0;
    for (var i = 0; i < symbols.length; i++)
    {
      var symbol = symbols[i];
      getRSIRawCalls(symbol, config.start_date, config.rsi_buy_threshold, config.rsi_sell_threshold, function (rawcalls) {
        cooldown(rawcalls, config.cooldown, function (cooledcalls) {
          for (var j = 0; j < cooledcalls.length; j++)
          {
            var call = cooledcalls[j];
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

exports.latestPrice = function(symbol, callback)
{
    fs.readFile('./timeSaleJSON/' + symbol + '.json', function(err, data) {
        var timeSales = JSON.parse(data);
        var times = Object.keys(timeSales);
        var lastPrice = timeSales[times[times.length - 1]];
        callback(lastPrice);
    });
}

function dateSort(rawdata)
{
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
    sorted.push(mincall);
    data.splice(mincallindex, 1);
  }
  return sorted;
}

function getTimeSalesFromFile(stockSymbol, interval) {
    var promise = new Promise(function(resolve, reject) {
        fs.readFile('./timeSaleJSON/' + stockSymbol + '.json', function(err, data) {
            var timeSales = JSON.parse(data);
            var intervalTimeSales = {};
            var count = 0;
            for (var i in timeSales) {
              var datetime = i.split('T');
              var time = datetime[1];
              if(time == '13:29:00Z')
              {
                continue;
              }
              if(time == '13:30:00Z')
              {
                count = -1;
              }
              count++;
              if(count % interval == 0)
              {
                intervalTimeSales[i] = timeSales[i];
              }
            }
            resolve(intervalTimeSales);
        });
    });
    return promise;
}
