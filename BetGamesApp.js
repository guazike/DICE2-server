//给console.log()增加时间戳
(function() { //add timestamp to console.log and console.error(from http://yoyo.play175.com)
  var date = new Date();

  function timeFlag() {
      date.setTime(Date.now());
      var m = date.getMonth() + 1;
      var d = date.getDate();
      var hour = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();
      var milliseconds = date.getMilliseconds();
      return '[' + ((m < 10) ? '0' + m : m) + '-' + ((d < 10) ? '0' + d : d) +
          ' ' + ((hour < 10) ? '0' + hour : hour) + ':' + ((minutes < 10) ? '0' + minutes : minutes) +
          ':' + ((seconds < 10) ? '0' + seconds : seconds) + '.' + ('00' + milliseconds).slice(-3) + '] ';
  }
  var log = console.log;
  console.error = console.log = function() {
      var prefix = ''; //cluster.isWorker ? '[WORKER '+cluster.worker.id + '] ' : '[MASTER]';
      if (typeof(arguments[0]) == 'string') {
          var first_parameter = arguments[0]; //for this:console.log("%s","str");
          var other_parameters = Array.prototype.slice.call(arguments, 1);
          log.apply(console, [prefix + timeFlag() + first_parameter].concat(other_parameters));
      } else {
          var args = Array.prototype.slice.call(arguments);
          log.apply(console, [prefix + timeFlag()].concat(args));
      }
  }
})();

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//==================express配置===============
var app = express();
app.set('port', process.env.PORT || 6769);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//=================跨域设置==================
app.all('*',function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  if (req.method == 'OPTIONS') {
    res.send(200); /*让options请求快速返回*/
  }
  else {
    next();
  }
});

//================路由设置====================
var contract = require('./routes/contract');
//app.post('/helloPost', require('./routes/helloPost'));
app.get('/favicon.ico', (req, res)=>{res.end()});
app.post('/favicon.ico', (req, res)=>{res.end()});

app.get('/addCOO', contract.addCOO);
// app.get('/approveNextOwner', contract.approveNextOwner);
// app.get('/acceptNextOwner', contract.acceptNextOwner);
app.get('/getSign', contract.getSign);
app.get('/jackpot', contract.jackpot);
app.get('/withdrawFunds', contract.withdrawFunds);
app.get('/refundBet', contract.refundBet);
app.get('/historyLog', contract.historyLog);
app.get('/updateNonce', contract.updateNonce);
app.get('/deployContract', contract.deployContract);
app.get('/require_coin', contract.require_coin);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found: '+req.originalUrl+' from '+req.ip);
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  var msg="";
  if(err.message){
    msg += err.message;
  }
  if(err.stack){
    msg += err.stack;
  }
  // render the error page
  res.status(err.status || 500);
  if(err.status!=undefined){
    res.sendStatus(err.status);
  }
  console.log(msg);
  // res.end(msg);

});

//================设置web3==================
web3Conf = require("./web3Config");
web3Conf.startWeb3(contract.onWeb3);


//================启动服务===================
var http = require('http').Server(app);
//120.77.71.197
http.listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port ' + app.get('port'));
});
