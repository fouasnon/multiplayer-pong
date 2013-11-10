
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
  left: [],
  right: [],
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
//    console.log('Sending Game')
    ws.send(JSON.stringify(getGame(interval)));  
  }, interval);
  ws.on('close', function() {
    console.log('Clearing Game Broadcast!');
    clearInterval(intervalId);
  });
};

var getGame = function(interval) {
  var nlx = gameStateTransform.left.vals.length;
  var nrx = gameStateTransform.right.vals.length;
  var nl = socketClients.left.length;
  var nr = socketClients.right.length;

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

var registerClient = function(ws, data) {
  if (data.clientType==='controller') {
    console.log('Registered New Controller!');
    data.messageType = 'registration';
    if (socketClients.left.length > socketClients.right.length) {
      data.paddle = 'right';
      socketClients.right.push(data.clientId);
      ws.send(JSON.stringify(data));
    } else {
      data.paddle = 'left';
      socketClients.left.push(data.clientId);
      ws.send(JSON.stringify(data));
    }
  } else if (data.clientType==='board') {
    console.log('Registered New Board!');
    socketClients.boards.push(data.clientId);
  }
  return data;
};

var removeIfPresent = function(arr, value) {
  var i = arr.indexOf(value) ;
  if (i > -1) {
    arr.splice(i, 1);
  }
}

var unregisterClient = function(client) {
  console.log('Unregistering Client: '+JSON.stringify(client));
  if (client.clientType==='controller' && client.paddle==='left') {
    removeIfPresent(socketClients.left, client.clientId);
  }
  else if (client.clientType==='controller' && client.paddle==='right') {
    removeIfPresent(socketClients.right, client.clientId);
  }
  else if (client.clientType==='board') {
    removeIfPresent(socketClients.boards, client.clientId);
  }
};

var updateCoords = function(data) {
//  console.log('Got Coords!');
  if (data.paddle==='left') {
    gameStateTransform.left.vals.push((90 - data.position.x)/90);
  } else if (data.paddle==='right') {
    gameStateTransform.right.vals.push((90 - data.position.x)/90);
  }
};

wss.on('connection', function(ws) {
  var client;
  console.log('Connection Made!')

  ws.on('message', function(data){
    data = JSON.parse(data);
    if (data.messageType==='coords') {
      updateCoords(data);
    } else if (data.messageType==='register') {
      client = registerClient(ws, data);
    }
    sendGame(ws, 100);
  });

  ws.on('close', function() {
    if (client) {
      unregisterClient(client);
    }
  });
});


/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
