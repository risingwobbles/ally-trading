
var trader = require('./trader');

var count = 0;

recurse();

function recurse() {
  if(count < 60)
  {
    var interval = count + 1;
    exports_Obj.rsi_interval = interval;
    trader.trade().then(function(roi){
      trader.reset();
      console.log('Interval: ' + interval + ', ROI: ' + roi + '%');
      count++;
      recurse();
    });
  }
}
