var ally = require('./ally');
var fs = require('fs');
var sp500 = require('./sp500');

//TODO: figure out why update stops mid-way (maybe API overload?)

function updateSP500() {
  var sp500Symbols = sp500.getSymbols();
  var i = 0;

  var start = new Date().getTime();
  recurse();

  function recurse() {
    var symbol = sp500Symbols[i];
    var filename = 'timeSaleJSON/' + symbol + '.json';
    ally.getTimeSalesFromAPI(symbol, function(data) {
      fs.writeFile(filename, JSON.stringify(data), function() {
        var percent = (100*i/sp500Symbols.length).toFixed(2).padStart(5, '0');
        var current = i.toString().padStart(3);
        console.log(symbol.padStart(5) + ' successfully updated. (' + percent + '% complete, ' + current + ' of ' + sp500Symbols.length + ')');
        if (i < sp500Symbols.length - 1) {
          var end = new Date().getTime();
          var time = (end - start)/1000;

          var minutes = Math.floor(time / 60).toString().padStart(2);
          var seconds = Math.round((time - minutes * 60).toString().padStart(2));

          console.log('    Time elapsed: ' + minutes + ' min ' + seconds + ' sec\n');
          i++;
          recurse();
        }
      });
    });
  }
}

exports.updateSingle = function(symbol)
{
  var i = 0;
  var start = new Date().getTime();
  var filename = 'timeSaleJSON/' + symbol + '.json';
  ally.getTimeSalesFromAPI(symbol, function(data) {
    fs.writeFile(filename, JSON.stringify(data), function() {
      console.log(symbol.padStart(5) + ' successfully updated.');
      var end = new Date().getTime();
      var time = (end - start)/1000;
      var minutes = Math.floor(time / 60).toString().padStart(2);
      var seconds = Math.round((time - minutes * 60).toString().padStart(2));
      console.log('    Time elapsed: ' + minutes + ' min ' + seconds + ' sec\n');
    });
  });
}
