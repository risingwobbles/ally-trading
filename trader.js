//Executes symbol trading simulations based on historical data.

var http = require('http');
var ally = require('./ally');
var config = require('./config');

var debt = 0;
var basis = 0;
var portfolio = {};

// http.createServer(function (req, res) {
//
//   trade(req, res, 'AAPL', 1000, 72);
//
// }).listen(8080);

function trade()
{
  var promise = new Promise(function(resolve,reject) {
    ally.getBatchCalls(function(calls) {
      console.log(" ");
      console.log(calls);
      console.log(" ");
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
          console.log("Trade executed: " + numshares + " shares of " + symbol + " were purchased at " + price + " on " + call.date + ".");
        }
        if(call.order == 'sell')
        {
          if(symbol in portfolio && portfolio[symbol] > 0)
          {
            var price = call.price;
            var numshares = parseInt(portfolio[symbol]);
            debt -= price * numshares;
            portfolio[symbol] = 0;
            console.log("Trade executed: " + numshares + " shares of " + symbol + " were sold at " + price + " on " + call.date + ".");
          }
        }
      }
      console.log(" ");
      analytics().then(function(){
          resolve();
        });
      });
    });
  return promise;
}

trade();

function trade500()
{

}

function getBasisROI(symbol, startdate, buythreshold, sellthreshold, cdhours, bet)
{
  var promise = new Promise(function(resolve, reject) {
    trade(symbol, startdate, buythreshold, sellthreshold, cdhours, bet, true).then(function(profitBasis, holdings){
      var profit = Object.keys(profitBasis);
      var basis = profitBasis[profit];
      var roi = (profit/basis)*100;
      roi = roi.toFixed(2);
      var basisROI = {};
      basis = basis.toFixed(2);
      basisROI[basis] = roi;
      var stockBasisROI = {};
      stockBasisROI[symbol] = basisROI;
      resolve(stockBasisROI);
    });
  });
  return promise;
}

// getBasisROI('AAPL', '2018-04-01', 20, 80, 72, 2000).then(function(basisROI){
//   console.log(basisROI);
// });

function getBatchBasisROI(symbols, startdate, buythreshold, sellthreshold, cdhours, bet)
{
  var batchBasisROI = {};
  var count = 0;
  var promise = new Promise(function(resolve, reject) {
    for (var i = 0; i < symbols.length; i++)
    {
      var stock = symbols[i];
      getBasisROI(stock, startdate, buythreshold, sellthreshold, cdhours, bet).then(function(stockBasisROI){
        var name = Object.keys(stockBasisROI);
        var basisROI = stockBasisROI[name];
        batchBasisROI[name] = basisROI;
        count++;
        if(count > Object.keys(symbols).length - 1) after();
      });
    }
    function after() {
      resolve(batchBasisROI);
    }
  });
  return promise;
}

// getBatchBasisROI(symbols10, '2018-04-01', 20, 80, 72, 2000).then(function(batchBasisROI){
//   globalAnalytics().then(function(){
//     console.log(" ");
//     console.log(batchBasisROI);
//   });
// });

// function buy(symbol, price, budget, datetime)
// {
//   var numshares = Math.floor(budget/price);
//   debt += price * numshares;
//   if(debt > basis) basis = debt;
//   if(symbol in portfolio)
//   {
//     var current = parseInt(portfolio[symbol]);
//     portfolio[symbol] = current + numshares;
//   }
//   else {
//     portfolio[symbol] = numshares;
//   }
//   console.log("Trade executed: " + numshares + " shares of " + symbol + " were purchased at " + price + " on " + datetime + ".");
// }

// function sell(symbol, price, datetime)
// {
//   var numshares = parseInt(portfolio[symbol]);
//   debt -= price * numshares;
//   portfolio[symbol] = 0;
//   console.log("Trade executed: " + numshares + " shares of " + symbol + " were sold at " + price + " on " + datetime + ".");
// }

function analytics()
{
  var promise = new Promise(function(resolve, reject){

    getPortfolioValue().then(function(total){

      var profit = total - debt;
      profit = profit.toFixed(2);
      console.log("Investment basis: $" + basis.toFixed(2));
      console.log("Profit/Loss: $" + profit);
      var roi = (profit/basis)*100;
      roi = roi.toFixed(2);
      console.log("ROI: " + roi + "%");
      console.log(" ");
      total = total.toFixed(2);
      console.log("Value of holdings: $" + total);
      console.log(portfolio);
      var count = 0;
      // for (var i in portfolio)
      // {
      //   latestPriceName(i, function(priceName) {
      //     count++;
      //     var name = Object.keys(priceName);
      //     var price = priceName[name];
      //     price = price * 1;
      //     price = price.toFixed(2);
      //     console.log("Current price of " + name + ": $" +  price);
      //     if(count > Object.keys(portfolio).length - 1)
      //     {
      //       after();
      //     }
      //   });
      // }
      // function after() {
        resolve();
      // }
    });
  });
  return promise;
}

// function globalAnalytics()
// {
//   console.log("Global Analytics:");
//   console.log(" ");
//   var promise = new Promise(function(resolve, reject){
//     getPortfolioValue(portfolio).then(function(total){
//       var ndebt =  * -1;
//       var profit = total + ndebt;
//       profit = profit.toFixed(2);
//       var profitBasis = {};
//       profitBasis[profit] = basis;
//       analytics(profitBasis, portfolio).then(function(){
//         resolve();
//       });
//     });
//   });
//   return promise;
// }

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

// portfolio = {'AAPL': 1, 'IBM': 1};
// analytics();

// getPortfolioValue().then(function(data){
//   console.log(data);
// });

function latestValue(symbol, numshares, callback)
{
  ally.latestPrice(symbol, function(price) {
    var value = price * numshares;
    callback(value);
  });
}

function latestPriceName(symbol, callback)
{
  ally.latestPrice(symbol, function(price) {
    var value = {};
    value[symbol] = price;
    callback(value);
  });
}

// latestValue('AAPL', 12, function(value) {
//   console.log(value);
// });
