var sp500 = require('./sp500');

exports_Obj = {

  // Global Parameters

  start_date: '2018-04-01',
  budget: 10000,
  cooldown: 72,
  display_trades: true,
  display_analytics: true,
  display_adjusted_profits: false,

  // RSI Parameters

  rsi_buy_threshold: 25,
  rsi_sell_threshold: 75,
  rsi_interval: 5,

  // Stock Watchlist

<<<<<<< HEAD
  watchlist: ['TSLA']
=======
  watchlist: ['AAPL']
>>>>>>> 1abc2db5e133ecb30a1c65d9ea95afc5c21cd6a9
  // watchlist: ['AAPL', 'MSFT', 'AMZN', 'FB', 'BRK.B', 'JPM', 'JNJ', 'XOM', 'GOOG', 'BAC']
  // watchlist: sp500.getSymbols()

}

module.exports = exports_Obj;
