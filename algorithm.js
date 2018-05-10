var ally = require('./ally');
var config = require('./config');

exports.getBatchCalls = function()
{
  var promise = new Promise(function(resolve, reject){
    ally.getBatchRSICalls().then(function (data) {
      resolve(data);
    });
  });
  return promise;
}

//niggerino