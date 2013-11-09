
/**
 * Module dependencies
 */

var express = require('express'),
  routes = require('./routes'),
  api = require('./routes/api'),
  http = require('http'),
  path = require('path'),
  WebSocketServer = require('ws').Server;

var app = module.exports = express();
var server = http.createServer(app);
var wss = new WebSocketServer({server: server});


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
};


/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/name', api.name);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);


/**
 * WebSockets!
 */
var socketClients = {
  controllers: {
    leftPaddle: [],
    rightPaddle: []
  },
  boards: []
};
var tallies = {
  left: {
    lastVal: .5,
    vals: []
  },
  right: {
    lastVal: .5,
    vals: []
  }
};

var getGame = function() {
  var nlx = tallies.left.vals.length;
  var nrx = tallies.right.vals.length;
  var nl = socketClients.controllers.leftPaddle.length;
  var nr = socketClients.controllers.rightPaddle.length;

  if (nlx > 0 && nl > 0) {
    tallies.left.lastVal = tallies.left.vals.reduce(function(previousValue, currentValue){
      return previousValue + currentValue;
    }, 0) / nlx;
  } else if (nrx > 0 && nr > 0) {
    tallies.right.lastVal = tallies.right.vals.reduce(function(previousValue, currentValue){
      return previousValue + currentValue;
    }, 0) / nrx;
  }

  var game = {
    messageType: 'board',
    paddles: {
      left: {
        x: tallies.left.lastVal
      },
      right: {
        x: tallies.right.lastVal
      }
    },
    team: {
      left: {
        size: nl,
        score: 0
      },
      right: {
        size: nr,
        score: 0
      }
    }
  };
  tallies.left.vals = [];
  tallies.right.vals = [];
  return game;
};
wss.on('connection', function(ws) {
  console.log('connection made!')
  var clientType;
  ws.on('message', function(data){
    data = JSON.parse(data);
    console.log('received coords: %s', data);
    switch(data.messageType) {
    case "coords":
      if (data.paddle==='left') {
        tallies.left.vals.push((90 - data.position.x)/90);
      } else if (data.paddle==='right') {
        tallies.right.vals.push((90 - data.position.x)/90);
      }
    case "register":
      if (data.clientType==='controller') {
        if (socketClients.controllers.leftPaddle.length > socketClients.controllers.rightPaddle.length) { 
          socketClients.controllers.rightPaddle.push(data.clientId);
          ws.send(JSON.stringify({messageType: "paddle", paddle: "right"}));
        } else {
          socketClients.controllers.leftPaddle.push(data.clientId);
          ws.send(JSON.stringify({messageType: "paddle", paddle: "left"}));
        }
      } else if (data.clientType==='board') {

      }
    }

    var broadcast = function() {
      ws.send(JSON.stringify(getGame()));
      setTimeout(broadcast, 10);
    };
    broadcast();
  });

  ws.on('close', function() {
    console.log('stopping client interval');
  });
});


/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
