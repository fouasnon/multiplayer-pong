'use strict';

var registerSocket = function(clientType, $scope, $location) {
  var host = $location.host();
  var port = $location.port()
  if (port) {
    host += ':'+ port
  }
  var ws = new WebSocket('ws://'+host);
  var clientId = parseInt(Math.random()*1000000000);
  ws.onopen = function() {
    ws.send(JSON.stringify({clientId: clientId, clientType: clientType, messageType: 'register'}));
  };
  ws.onmessage = function(data, flags) {
    data = JSON.parse(data.data);
    switch(data.messageType) {
    case 'registration':
      $scope.registration = data;
    }
  };
  ws.sendJSON = function(data) {
    ws.send(JSON.stringify(data));
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
      console.log('send')
      if ($scope.registration) {
        var msg = angular.copy($scope.registration);
        console.log(msg)
        msg.messageType = 'coords';
        msg.position = {x: Math.abs(x)};
        ws.sendJSON(msg);
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
        console.log('Got Message:' + data.messageType);
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
          $scope.excited = true;
          $timeout(function(){
            $scope.excitedClimax = true;
          }, 500)
          $timeout(function(){
            $scope.excited = false;
            $scope.excitedClimax = false;
          }, 1500)
          goalSound();
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


