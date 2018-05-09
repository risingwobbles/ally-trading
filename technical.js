//Technical indicator calculator.

function rsi(timeSales, callback)
{
  var timeUpMovement = {};
  var timeDownMovement = {};
  var previousPrice = 0;

  for (var i in timeSales)
  {
    var currentPrice = timeSales[i];
    if(previousPrice != 0)
    {
      var change = currentPrice - previousPrice;
      if(change > 0)
      {
        timeUpMovement[i] = change;
        timeDownMovement[i] = 0;
      }
      if(change < 0)
      {
        timeUpMovement[i] = 0;
        timeDownMovement[i] = change * -1;
      }
      if(change == 0)
      {
        timeUpMovement[i] = 0;
        timeDownMovement[i] = 0;
      }
    }
    previousPrice = currentPrice;
  }

  var timeAUM = {};
  var timeADM = {};
  var count = 0;
  var aUM = 0;
  var aDM = 0;

  for (var index in timeUpMovement)
  {
    if(count < 14)
    {
      aUM += (1/14) * timeUpMovement[index];
      aDM += (1/14) * timeDownMovement[index];
      count++;
    }
    if(count == 14)
    {
      timeAUM[index] = aUM;
      timeADM[index] = aDM;
      count++;
    }
    if(count > 14)
    {
      aUM = (1/14)*((aUM*13) + timeUpMovement[index]);
      aDM = (1/14)*((aDM*13) + timeDownMovement[index]);
      timeAUM[index] = aUM;
      timeADM[index] = aDM;
    }
  }

  var timeRSI = {};

  for (var i in timeAUM)
  {
    var rs = timeAUM[i] / timeADM[i];
    var rsi = 100 - (100/(rs + 1));
    timeRSI[i] = rsi;
  }
  callback(timeRSI);
}

exports.rsi = function(timeSales, callback)
{
  rsi(timeSales, function(data)
  {
    callback(data);
    // console.log(data);
  });
}
