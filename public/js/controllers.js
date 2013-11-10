'use strict';

/* Controllers */


angular.module('multiplayerPong.controllers', []).
  controller('MobileCtrl', function ($scope, $timeout, $window, $location) {
    if (!isMobile()) {
      $location.path('/board');
      return;
    } 
    var host = $location.host();
    var port = $location.port()
    if (port) {
      host += ':'+ port
    }
    var ws = new WebSocket('ws://'+host);

    $scope.clientId = parseInt(Math.random()*1000000000);

    ws.onopen = function() {
      ws.send(JSON.stringify({clientId: $scope.clientId, clientType: 'controller', messageType: 'register'}));
    };

    ws.onmessage = function(data, flags) {
      data = JSON.parse(data.data);
      switch(data.messageType) {
      case 'registration':
        $scope.paddle = data.paddle
        $scope.registration = data;
      }
    };

    var sendCoords = function(x){
      if ($scope.paddle) {
        ws.send(
          JSON.stringify({
            messageType: 'coords',
            paddle: $scope.paddle,
            clientId: $scope.cliendId,
            position: {
              x: Math.abs(x)
            }
          })
        );
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
  }).
  controller('BoardCtrl', function ($scope, $timeout, $location) {
    if (isMobile()) {
      $location.path('/controller');
      return;
    } 
    var host = $location.host();
    var port = $location.port()
    if (port) {
      host += ':'+ port
    }
    var ws = new WebSocket('ws://'+host);

    $scope.leftPosition = 0;
    $scope.rightPosition = 0;
    $scope.clientId = parseInt(Math.random()*1000000000);

    ws.onopen = function() {
      console.log('connected');
      ws.send(JSON.stringify({clientId: $scope.clientId, clientType:'board', messageType: 'register'}));
    };

    ws.onmessage = function(data, flags) {

      $scope.$apply(function(){
        data = JSON.parse(data.data);
        if (data.messageType==='registration') {
          // Let them start the game after registration;
          console.log('registered');
          $scope.registration = data;
          $scope.playGame = function(){
            ws.send(JSON.stringify({clientId: $scope.clientId, clientType:'board', messageType: 'start'}));
          };
        }
        else if (data.messageType==='game') {
          console.log('game');
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
          console.log('goal');
          goalSound();
          $scope.explodeBall = true;
          $scope.message = data.paddle + ' Score!'
          $scope.score = data.game;
          $scope.game = data.game;
        }
        else if (data.messageType==='safe') {
          console.log('safe');
          hitSound();
          $scope.message = data.paddle + ' Safe!'
          $scope.score = data.game;
          $scope.game = data.game;
        }
        else if (data.messageType==='boundary') {
          console.log('boundary');
          wallHitSound();
          $scope.score = data.game;
          $scope.game = data.game;
        }
        else if (data.messageType==='start') {
          console.log('start');
          $scope.message = 'Start';
          $scope.game = data.game;
          $scope.score = data.game;
        }

      });
    };
  }).
  controller('adminCtrl', function ($scope, $timeout, $location) {

  });
