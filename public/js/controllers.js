'use strict';

var registerSocket = function(clientType, $scope, $location) {
  var host = $location.host();
  var port = $location.port()
  if (port) {
    host += ':'+ port
  }
  $scope.reconnecting = true;
  var ws = new WebSocket('ws://'+host);
  var clientId = parseInt(Math.random()*1000000000);

  ws.onopen = function() {
    $scope.reconnecting = false;
    ws.send(JSON.stringify({clientId: clientId, clientType: clientType, messageType: 'register'}));
  };
  ws.onmessage = function(data, flags) {
    data = JSON.parse(data.data);
    switch(data.messageType) {
    case 'registration':
      $scope.registration = data;
    }
  };
  ws.sendJSON = function(data, registration) {
    if (registration && $scope.registration) {
      data.clientId = $scope.registration.clientId;
      data.clientType = $scope.registration.clientType;
      if ($scope.registration.paddle) {
        data.paddle = $scope.registration.paddle;
      }
    }
    ws.send(JSON.stringify(data));
  };
  ws.onclose = function(){
    $scope.reconnecting = true;
    setTimeout(function(){ ws = registerSocket(clientType, $scope, $location) }, 1000);
  };
  return ws;
};

/* Controllers */
angular.module('multiplayerPong.controllers', [])

/* Mobile Controller */
  .controller('MobileCtrl', function ($scope, $timeout, $window, $location, $route) {
    if (!isMobile()) {
      $location.path('/board');
      return;
    } 
    var ws = registerSocket('controller', $scope, $location);
    //       $scope.paddle = data.paddle

    var sendCoords = function(x){
      if ($scope.registration) {
        ws.sendJSON({messageType: 'coords', position: {x: Math.abs(x)}}, true);
      }
    };

    $window.addEventListener("deviceorientation", function(event) {
      $scope.$apply(function(){
        // process event.alpha, event.beta and event.gamma
        $scope.x = event.beta;  // In degree in the range [-90,90]
        $scope.y = event.gamma; // In degree in the range [-90,90]
        $scope.z = event.alpha; // In degree in the range [-90,90]
        if (Math.random() > .5) {
          sendCoords(event.beta);
        }
        $scope.gutterBallPosition = (90-Math.abs(event.beta))/90;
        $scope.controllerColor = (Math.abs(event.beta))/90/100;
      });
    }, true);
  })

/* Mobile Controller */
  .controller('BoardCtrl', function ($scope, $timeout, $location) {
    if (isMobile()) {
      $location.path('/controller');
      return;
    } 
    var ws = registerSocket('board', $scope, $location);

    ws.onmessage = function(data, flags) {
      $scope.$apply(function(){
        data = JSON.parse(data.data);
        if (data.messageType!=="game") {
          console.log(data);
          console.log($scope.registration);
        }
        if (data.messageType==='registration') {
          // Let them start the game after registration;
          if (data.game) {
            $scope.initX = data.game.ball.x.position;
            $scope.initY = data.game.ball.y.position;
          }
          $scope.registration = data;
            $scope.playGame = function(){
              ws.sendJSON({clientId: $scope.registration.clientId, clientType:'board', messageType: 'start'});
            };
        }
        else if (data.messageType==='game') {

          $scope.game = data.game;
          $scope.leftPosition = data.game.left.y;
          $scope.rightPosition = data.game.right.y;
        }
        else if (data.messageType==='goal') {
          goalSound();
          $scope.excited = true;
          $timeout(function(){
            $scope.excitedClimax = true;
          }, 500)
          $timeout(function(){
            $scope.excited = false;
            $scope.excitedClimax = false;
          }, 1500)
          $scope.explodeBall = true;
          $scope.message = data.paddle + ' Score!'
          $scope.score = data.game;
          $scope.game = data.game;
        }
        else if (data.messageType==='safe') {
          hitSound();
          $scope.paddleGlow = data.paddle+'-glow';
          $timeout(function(){
            $scope.paddleGlow = '';
          }, 200)
          $scope.message = data.paddle + ' Safe!'
          $scope.score = data.game;
          $scope.game = data.game;
        }
        else if (data.messageType==='boundary') {
          wallHitSound();
          $scope.score = data.game;
          $scope.game = data.game;
        }
        else if (data.messageType==='newGame') {
          $scope.initX = data.game.ball.x.position;
          $scope.initY = data.game.ball.y.position;
          $scope.game = data.game;
          $scope.score = data.game;
        }
      });
    };
  }).
  controller('adminCtrl', function ($scope, $timeout, $location) {
    var ws = registerSocket('admin', $scope, $location);
    $scope.restartGame = function(){
      ws.sendJSON({clientId: $scope.registration.clientId, clientType:'board', messageType: 'start'});
    };
  });
