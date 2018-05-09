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
  // console.log(timeRSI);
  callback(timeRSI);
}

// var timesales = {
//   '2018-04-02T13:30:00Z' : '168.385',
//   '2018-04-02T13:35:00Z' : '168.610',
//   '2018-04-02T13:40:00Z' : '168.420',
//   '2018-04-02T13:45:00Z' : '167.989',
//   '2018-04-02T13:50:00Z' : '167.540',
//   '2018-04-02T13:55:00Z' : '167.890',
//   '2018-04-02T14:00:00Z' : '167.540',
//   '2018-04-02T14:05:00Z' : '167.800',
//   '2018-04-02T14:10:00Z' : '167.550',
//   '2018-04-02T14:15:00Z' : '167.790',
//   '2018-04-02T14:20:00Z' : '167.810',
//   '2018-04-02T14:25:00Z' : '167.470',
//   '2018-04-02T14:30:00Z' : '167.280',
//   '2018-04-02T14:35:00Z' : '167.250',
//   '2018-04-02T14:40:00Z' : '167.310',
//   '2018-04-02T14:45:00Z' : '167.500',
//   '2018-04-02T14:50:00Z' : '167.120',
//   '2018-04-02T14:55:00Z' : '166.970',
//   '2018-04-02T15:00:00Z' : '166.735',
//   '2018-04-02T15:05:00Z' : '166.828',
//   '2018-04-02T15:10:00Z' : '166.590',
//   '2018-04-02T15:15:00Z' : '166.840'
// };
//
// rsi(timesales, function(data) {
//   console.log(data);
// });

exports.rsi = function(timeSales, callback)
{
  rsi(timeSales, function(data)
  {
    callback(data);
  });
}
