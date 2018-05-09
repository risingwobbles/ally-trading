var sp500 = require('./sp500');

var config_object = {
  budget: 2000,
  rsi_buy_threshold: 20,
  rsi_sell_threshold: 80,
  start_date: '2018-04-01',
  cooldown: 72,
  watchlist_10: ['AAPL', 'MSFT', 'AMZN', 'FB', 'BRK.B', 'JPM', 'JNJ', 'XOM', 'GOOG', 'BAC'],
  watchlist: sp500.getSymbols()
}

module.exports = config_object;

// console.log(config_object.watchlist);
