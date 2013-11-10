
/**
 * Module dependencies
 */

var express = require('express'),
  routes = require('./routes'),
  util = require('util'),
  api = require('./routes/api'),
  http = require('http'),
  path = require('path'),
  events = require('events'),
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

/*
  THE GAME!
*/

var Game = function() {
  
  var that = this;
  var updateScore = function(interval){
    update();
    var rounds = that.state.team.left.score + that.state.team.right.score;
    
    // ball is 20%
    // paddle is 32%
    
    var bt = that.state.ball.y.position*100; // ball top
    var bb = bt + 20; // ball bottom
    // check if it's left or right ball
    if (rounds%2===0) {
      // check right
      var pt = that.state.right.y*100;
      var pb = pt + 32; 
      var offensivePaddle = 'left'; // this is who gets the point for
      var defensivePaddle = 'right'; // this is who gets the point for

    } else {
      var pt = that.state.left.y*100;
      var pb = pt + 32; 
      var offensivePaddle = 'right'; 
      var defensivePaddle = 'left'; // this is who gets the point for
    }
    
    if ((bt >= pt && bt <= pb) || (bb <= pb && bb >= pt)) {
      that.emit('safe', defensivePaddle);
    } else {
      var damper = 1.12;
      var direction = (rounds%2===0) ? -1 : 1;
      if (interval > 500) {
        that.state.ball.x.velocity = direction*that.state.ball.x.velocity*damper;
      } else {
        that.state.ball.x.velocity = direction*1/500;
      }
      that.state.ball.y.velocity = 1;
      that.state.team[offensivePaddle].score += 1
      that.emit('goal', offensivePaddle);
    }

    that.state.ball.x.interval = Math.abs(1/that.state.ball.x.velocity);
    setTimeout(
      function(){
        updateScore(that.state.ball.x.interval);
      }, that.state.ball.x.interval);

    // that.state.ball.x.interval = Math.abs(1/that.state.ball.x.velocity);
    // setTimeout(function(){
    //   updateScore(that.state.ball.x.interval);
    // }, that.state.ball.x.interval);
  };
  var update = function() {
    var nl = socketClients.left.length;
    var nr = socketClients.right.length;
    var nlx = that.state.left.yTransforms.length;
    var nrx = that.state.right.yTransforms.length;
    var rounds = that.state.team.left.score + that.state.team.right.score;
    // Change paddle positions
    if (nlx > 0 && nl > 0) {
      that.state.left.y = that.state.left.yTransforms.reduce(function(previousValue, currentValue){
        return previousValue + currentValue;
      }, 0) / nlx;
    } else if (nrx > 0 && nr > 0) {
      that.state.right.y = that.state.right.yTransforms.reduce(function(previousValue, currentValue){
        return previousValue + currentValue;
      }, 0) / nrx;
    }

    // Update number of player
    that.state.team.left.players = nl;
    that.state.team.right.players = nr;

    // Clear Transforms
    that.state.left.yTransforms = [];
    that.state.right.yTransforms = [];

    var timeDelta = new Date() - that.state.updated_at;

    // Calculate ball vectors.
    var yBallPos = that.state.ball.y.position + that.state.ball.y.velocity*timeDelta;
    if (yBallPos < 0) {
      yBallPos = Math.abs(yBallPos);
    } else if (yBallPos > 1) {
      yBallPos = yBallPos % 1;
    }
    that.state.ball.y.position = yBallPos;

    // This is where we check for a goal.
    var xBallPos = that.state.ball.x.position + that.state.ball.x.velocity*timeDelta;
    if (xBallPos < 0) {
      // did left score or miss?
      xBallPos = Math.abs(xBallPos);
    } else if (xBallPos > 1) {
      // did left score or miss?
      xBallPos = xBallPos % 1;
    }
    that.state.ball.x.position = xBallPos;

    // leave this at the end
    that.state.updated_at = new Date();
  };
  that.state = {
    created_at: new Date(),
    updated_at: new Date(),
    left: {
      y: .5,
      yTransforms: []
    },
    right: {
      y: .5,
      yTransforms: []
    },
    ball: {
      x: {
        interval: 6000,
        position: 0,
        velocity: 1/6000
      },
      y: {
        position: 0,
        velocity: -1
      }
    },
    team: {
      left: {
        players: 0,
        score: 0
      },
      right: {
        players: 0,
        score: 0
      }
    }
  };
  that.get = function(){
    update();
    return that.state;
  };
  that.addRightData = function(pos){
    that.state.right.yTransforms.push(pos);
  };
  that.addLeftData = function(pos){
    that.state.left.yTransforms.push(pos);
  };
  that.start = function(){
    that.emit('start', that.state);
    setTimeout(function(){
      updateScore(that.state.ball.x.interval);
    }, that.state.ball.x.interval);
  }

  return that
};
util.inherits(Game, events.EventEmitter);

var sendGame = function(ws, game, interval) {
  interval = interval || 100;
  var intervalId = setInterval(function() {
//    console.log('Sending Game')
    ws.send(JSON.stringify({game: game.get(), messageType: 'game'}));
  }, interval);
  ws.on('close', function() {
    console.log('Clearing Game Broadcast!');
    clearInterval(intervalId);
  });
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

var updateCoords = function(game, data) {
//  console.log('Got Coords!');
  if (data.paddle==='left') {
    game.addLeftData((90 - data.position.x)/90);
  } else if (data.paddle==='right') {
    game.addRightData((90 - data.position.x)/90);
  }
};

var updateScores = function(ws, game) {

};
wss.on('connection', function(ws) {
  var client;
  var open = true;
  console.log('Connection Made!')
  ws.on('message', function(data){
    data = JSON.parse(data);
    if (data.messageType==='coords') {
      updateCoords(CurrentGame, data);
    } else if (data.messageType==='register') {
      client = registerClient(ws, data);
    }
    sendGame(ws, CurrentGame, 100);
  });

  CurrentGame.on('goal', function(paddle){
    console.log('goal');
    // this crashes when client disconnects
    if (open) {
      ws.send(JSON.stringify({game: CurrentGame.get(), messageType: 'goal', paddle: paddle}));
    }
  });
  CurrentGame.on('start', function(game){
    console.log('start');
    // this crashes when client disconnects
    if (open) {
      ws.send(JSON.stringify({game: game, messageType: 'goal'}));
    }
  });
  CurrentGame.on('safe', function(paddle){
    if (open) {
      ws.send(JSON.stringify({game: CurrentGame.get(), messageType: 'safe', paddle: paddle}));
    }
    
  });

  ws.on('close', function() {
    open = false;
    if (client) {
      unregisterClient(client);
    }
  });
});

var CurrentGame = new Game();
setTimeout(function(){
  CurrentGame.start();
}, 2000)

/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
