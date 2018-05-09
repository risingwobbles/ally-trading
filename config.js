var sp500 = require('./sp500');

module.exports = {

  // Global Parameters

  start_date: '2018-04-01',
  budget: 10000,
  cooldown: 72,
  // display_analytics: true,

  // RSI Parameters

  rsi_buy_threshold: 25,
  rsi_sell_threshold: 75,
  rsi_interval: 5,

  // Stock Watchlist

  // watchlist: ['AAPL']
  watchlist: ['AAPL', 'MSFT', 'AMZN', 'FB', 'BRK.B', 'JPM', 'JNJ', 'XOM', 'GOOG', 'BAC']
  // watchlist: sp500.getSymbols()

}
