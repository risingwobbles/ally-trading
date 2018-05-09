var ally = require('./ally');
var fs = require('fs');

function getTimeSalesFromFile(stockSymbol, interval) {
    var promise = new Promise(function(resolve, reject) {
        fs.readFile('./timeSaleJSON/' + stockSymbol + '.json', function(err, data) {
            var timeSales = JSON.parse(data);
            var intervalTimeSales = [];
            var count = 0;
            for (var i in timeSales) {
                if (count % interval == 0) {
                    intervalTimeSales[i] = timeSales[i];
                }
                count++;
            }
            resolve(intervalTimeSales);
        });
    });
    return promise;
}

getTimeSalesFromFile('AAPL', 3).then(function(data) {
    console.log(data);
});