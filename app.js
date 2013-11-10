
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
var coinToss = function() {
  return Math.random() > .5 ? -1 : 1;
}

var Game = function(startingInterval) {
  var that = this;
  var updateIntervalId;
  var updateBoundaryTimeoutId;
  var updateScoreTimeoutId;
  var startingInterval = startingInterval || 3000;
  var updateScore = function(interval){
    console.log('Score Update');
    var bt = that.state.ball.y.position*400;  // 400=ball container
    var bb = bt + 100; // 100=ball height
    // check if it's left or right ball

    var xDirection = (that.state.ball.x.velocity < 0) ? -1 : 1;
    var yDirection = (that.state.ball.y.velocity < 0) ? -1 : 1;

    if (xDirection > 0) {
      // going right
      var pt = that.state.right.y*340; // 340=paddle container
      var pb = pt + 160;  //160=padde height
      var offensivePaddle = 'left'; // this is who gets the point for
      var defensivePaddle = 'right'; // this is who gets the point for
    } else {
      // going left
      var pt = that.state.left.y*340;
      var pb = pt + 160;
      var offensivePaddle = 'right'; 
      var defensivePaddle = 'left'; // this is who gets the point for
    }
    
    console.log('offense: '+ offensivePaddle);
    console.log('defense: '+ defensivePaddle);
    console.log('bb'+ bb);
    console.log('pt'+ pt);
    console.log('bt'+ bt);
    console.log('pb'+ pb);

    if ((bt >= pt && bt <= pb) || (bb <= pb && bb >= pt)) {
      console.log('safe');
      
      // Velocity and intervals
      var damper = 1.12;
      if (interval > 500) {
        that.state.ball.x.velocity = -xDirection*Math.abs(that.state.ball.x.velocity)*damper;
      } else {
        that.state.ball.x.velocity = -xDirection/500;
      }
      that.state.ball.x.interval = Math.abs(1/that.state.ball.x.velocity);
      that.state.ball.y.velocity = coinToss()*that.state.ball.y.velocity/(1+that.state.ball.y.velocity*coinToss()*100*Math.random());
      that.state.ball.y.interval = Math.abs(1/that.state.ball.y.velocity);

      that.emit('safe', {game: that.state, paddle: defensivePaddle});
    } else {
      // Velocity and intervals
      that.state.ball.x.velocity = -xDirection/startingInterval;
      that.state.ball.x.interval = startingInterval;
      that.state.ball.y.velocity = -yDirection/startingInterval;
      that.state.ball.y.interval = startingInterval;
      
      // Update Score
      that.state.team[offensivePaddle].score += 1
      that.emit('goal', {game: that.state, paddle: offensivePaddle});
    }

    console.log('XXX:' +that.state.ball.x.position);
    console.log('XXXV:' +that.state.ball.x.velocity);
    console.log('yvel:' +that.state.ball.y.velocity);
    // use current velocity here since it was changed above.
    if (that.state.ball.y.velocity < 0) {
      // going up!
      var timeToBoundaryCollision = -that.state.ball.y.position/that.state.ball.y.velocity;
    } else {
      var timeToBoundaryCollision = (1-that.state.ball.y.position)/that.state.ball.y.velocity;
    }
    if (timeToBoundaryCollision < that.state.ball.x.interval && that.state.ball.y.velocity!==0) {
      updateBoundaryTimeoutId = setTimeout(function(){
        that.state.ball.y.velocity = -that.state.ball.y.velocity;
        that.state.ball.y.interval = Math.abs(1/that.state.ball.y.velocity);
        that.emit('boundary', {game: that.state});
      }, timeToBoundaryCollision);
    }

    that.state.rounds += 1;

    updateScoreTimeoutId = setTimeout(
      function(){
        updateScore(that.state.ball.x.interval);
      }, that.state.ball.x.interval);
  };
  var update = function() {
    var nl = socketClients.left.length;
    var nr = socketClients.right.length;
    var nlx = that.state.left.yTransforms.length;
    var nrx = that.state.right.yTransforms.length;

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
    // if (yBallPos < 0) {
    //   yBallPos = Math.abs(yBallPos);
    // } else if (yBallPos > 1) {
    //   yBallPos = 1 - yBallPos % 1;
    // }
    that.state.ball.y.position = yBallPos;

    
    // This is where we check for a goal.

    var xBallPos = that.state.ball.x.position + that.state.ball.x.velocity*timeDelta;
    // console.log('XXXA:' +that.state.ball.x.position);
    // if (xBallPos < 0) {
    //   xBallPos = Math.abs(xBallPos);
    // } else if (xBallPos > 1) {
    //   xBallPos = 1 - xBallPos % 1;
    // }
    that.state.ball.x.position = xBallPos;

    // leave this at the end
    that.state.updated_at = new Date();
  };
    // The Game Model
  that.state = {
    playing: false,
    rounds: 0,
    left: {
      y: 0,
      yTransforms: []
    },
    right: {
      y: 0,
      yTransforms: []
    },
    ball: {
      x: {
        interval: startingInterval,
        position: 0,
        velocity: 1/startingInterval
      },
      y: {
        interval: startingInterval,
        position: 0,
        velocity: 1/startingInterval
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
    return that.state;
  };

  that.addRightData = function(pos){
    that.state.right.yTransforms.push(pos);
  };

  that.addLeftData = function(pos){
    that.state.left.yTransforms.push(pos);
  };

  that.start = function(){
    console.log('Game Start!');
    that.state.updated_at = new Date();
    that.state.created_at = new Date();
    that.state.playing = true;
    that.state.ball.x.interval = startingInterval;
    that.state.ball.y.interval = startingInterval;

    that.emit('start', that.state);

    updateScoreTimeoutId = setTimeout(function(){
      updateScore(that.state.ball.x.interval);
    }, that.state.ball.x.interval);

    // Refresh Rate
    updateIntervalId = setInterval(function(){
      update();
    }, 100);
  };

  that.end = function(){
    console.log('Game End!');
    clearInterval(updateIntervalId);
    clearTimeout(updateBoundaryTimeoutId);
    clearTimeout(updateScoreTimeoutId);
  };


  return that
};
util.inherits(Game, events.EventEmitter);

var sendGame = function(ws, game, interval) {
  interval = interval || 100;
  var intervalId = setInterval(function() {
    //    console.log('Sending Game')
    if (game.state.playing) {
      ws.send(JSON.stringify({game: game.get(), messageType: 'game'}));
    }
  }, interval);

  ws.on('close', function() {
    console.log('Clearing Game Broadcast!');
    clearInterval(intervalId);
  });
};

var registerClient = function(ws, data) {
  data.messageType = 'registration';
  if (CurrentGame.state.playing===true) {
    data.game = CurrentGame.get();
  }
  if (data.clientType==='controller') {
    console.log('Registered New Controller!');
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
    ws.send(JSON.stringify(data));
    // Let the board start the game if it hasn't started yet;

    if (CurrentGame.state.playing===false) {
      ws.on('message', function(data){
        data = JSON.parse(data);
        if (data.messageType==='start') {
          CurrentGame.start(3000);
        }
      });
    }
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
    if (socketClients.boards.length===0) {
      CurrentGame.end();
      CurrentGame = new Game(3000);
    }
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
      sendGame(ws, CurrentGame, 50);
    }
  });
  CurrentGame.on('goal', function(data){
    console.log('goal');
    // this crashes when client disconnects
    if (open) {
      ws.send(JSON.stringify({game: data.game, messageType: 'goal', paddle: data.paddle}));
    }
  });
  CurrentGame.on('start', function(game){
    console.log('start');
    // this crashes when client disconnects
    if (open) {
      ws.send(JSON.stringify({game: game, messageType: 'newGame'}));
    }
  });
  CurrentGame.on('safe', function(data){
    console.log('safe');
    // this crashes when client disconnects
    if (open) {
      ws.send(JSON.stringify({game: data.game, messageType: 'safe', paddle: data.paddle}));
    }
  });
  CurrentGame.on('boundary', function(data){
    console.log('boundary');
    // this crashes when client disconnects
    if (open) {
      ws.send(JSON.stringify({game: data.game, messageType: 'boundary'}));
    }
  });
  ws.on('close', function() {
    open = false;
    if (client) {
      unregisterClient(client);
    }
  });
});

var CurrentGame = new Game(3000);

/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
