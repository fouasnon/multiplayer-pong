
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
var gameStateTransform = {
  left: {
    lastVal: .5,
    vals: []
  },
  right: {
    lastVal: .5,
    vals: []
  },
  ball: {
    x: {
      position: 0,
      velocity: 1,
      direction: 1
    },
    y: {
      position: 0,
      velocity: -1,
      direction: 0
    }
  },
  team: {
    left: {
      score: 0
    },
    right: {
      score: 0
    }
  }
};

var sendGame = function(ws, interval) {
  interval = interval || 100;
  var intervalId = setInterval(function() {
    console.log('sending game')
    ws.send(JSON.stringify(getGame(interval)));  
  }, interval);
  ws.on('close', function() {
    clearInterval(intervalId);
  });
};

var getGame = function(interval) {
  var nlx = gameStateTransform.left.vals.length;
  var nrx = gameStateTransform.right.vals.length;
  var nl = socketClients.controllers.leftPaddle.length;
  var nr = socketClients.controllers.rightPaddle.length;

  if (nlx > 0 && nl > 0) {
    gameStateTransform.left.lastVal = gameStateTransform.left.vals.reduce(function(previousValue, currentValue){
      return previousValue + currentValue;
    }, 0) / nlx;
  } else if (nrx > 0 && nr > 0) {
    gameStateTransform.right.lastVal = gameStateTransform.right.vals.reduce(function(previousValue, currentValue){
      return previousValue + currentValue;
    }, 0) / nrx;
  }

  var game = {
    messageType: 'board',
    paddles: {
      left: {
        x: gameStateTransform.left.lastVal
      },
      right: {
        x: gameStateTransform.right.lastVal
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
    },
    ball: gameStateTransform.ball
  };
  gameStateTransform.left.vals = [];
  gameStateTransform.right.vals = [];
  return game;
};
wss.on('connection', function(ws) {
  var clientBroadcastInterval;
  console.log('connection made!')
  ws.on('message', function(data){
    data = JSON.parse(data);
    console.log('received coords: %s', data);
    switch(data.messageType) {

    case "coords":
      if (data.paddle==='left') {
        gameStateTransform.left.vals.push((90 - data.position.x)/90);
      } else if (data.paddle==='right') {
        gameStateTransform.right.vals.push((90 - data.position.x)/90);
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
    sendGame(ws, 10);
  });

  ws.on('close', function() {
    clearInterval(clientBroadcastInterval)
    console.log('stopping client interval');
  });
});


/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
