//Executes symbol trading simulations based on historical data.

var http = require('http');
var ally = require('./ally');
var config = require('./config');
var algorithm = require('./algorithm');

var debt = 0;
var basis = 0;
var num_trades = 0;
var portfolio = {};

exports.reset = function()
{
  debt = 0;
  basis = 0;
  num_trades = 0;
  portfolio = {};
}

exports.trade = function()
{
  var promise = new Promise(function(resolve,reject) {
    algorithm.getBatchCalls().then(function(calls) {
      if (config.display_trades) console.log(" ");
      num_trades = calls.length;
      for (var i = 0; i < calls.length; i++)
      {
        var call = calls[i];
        var symbol = call.symbol;
        if (call.order == 'buy')
        {
          var price = call.price;
          var numshares = Math.floor(config.budget/price);
          debt += price * numshares;
          if(debt > basis) basis = debt;
          if(symbol in portfolio)
          {
            var current = parseInt(portfolio[symbol]);
            portfolio[symbol] = current + numshares;
          }
          else
          {
            portfolio[symbol] = numshares;
          }
          if (config.display_trades) console.log("Trade executed: " + numshares + " shares of " + symbol + " were purchased at " + price + " on " + call.date + ".");
        }
        if(call.order == 'sell')
        {
          if(symbol in portfolio && portfolio[symbol] > 0)
          {
            var price = call.price;
            var numshares = parseInt(portfolio[symbol]);
            debt -= price * numshares;
            portfolio[symbol] = 0;
            if (config.display_trades) console.log("Trade executed: " + numshares + " shares of " + symbol + " were sold at " + price + " on " + call.date + ".");
          }
        }
      }
      analytics().then(function(roi){
          resolve(roi);
        });
      });
    });
  return promise;
}

function analytics()
{
  var promise = new Promise(function(resolve, reject){

    getPortfolioValue().then(function(total){
      var profit = total - debt;
      profit = profit.toFixed(2);
      var roi = (profit/basis)*100;
      roi = roi.toFixed(2);
      var fees = num_trades*4.99;
      fees = fees.toFixed(2);
      var adjprofit = profit - num_trades*4.99;
      adjprofit = adjprofit.toFixed(2);
      var adjroi = (adjprofit/basis)*100;
      adjroi = adjroi.toFixed(2);
      total = total.toFixed(2);
      var count = 0;
      if(config.display_analytics)
      {
        console.log(" ");
        console.log("Investment basis: $" + basis.toFixed(2));
        console.log("Profit/Loss: $" + profit);
        console.log("ROI: " + roi + "%");
        console.log(" ");
        console.log("Number of trades: " + num_trades);
        console.log("Trading fees: $" + fees);
        if(config.display_adjusted_profits)
        {
          console.log(" ");
          console.log("Adjusted Profit/Loss: $" + adjprofit);
          console.log("Adjusted ROI: " + adjroi + "%");
        }
        console.log(" ");
        console.log("Value of holdings: $" + total);
      }
      resolve(roi);
    });
  });
  return promise;
}

function getPortfolioValue()
{
  var total = 0;
  var count = 0;
  var promise = new Promise(function(resolve, reject){
    if (Object.keys(portfolio) == 0)
    {
      resolve(total);
    }
    for (var i in portfolio)
    {
      latestValue(i, portfolio[i], function(value) {
        total += value;
        count++;
        if(count > Object.keys(portfolio).length-1)  after();
      });
    }
    function after (){
      resolve(total);
    }
  });
  return promise;
}

function latestValue(symbol, numshares, callback)
{
  ally.latestPrice(symbol, function(price) {
    var value = price * numshares;
    callback(value);
  });
}
