'use strict';

/* Controllers */

angular.module('multiplayerPong.controllers', []).
  controller('MobileCtrl', function ($scope, $timeout, $window, $location) {
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
    }
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


        // $scope.xCoords.push(event.beta);
        // if ($scope.xCoords.length > 10) {
        //   var sortedXCoords = $scope.xCoords.sort();
        //   $scope.medianXCoord = sortedXCoords[sortedXCoords.length/2];
        //   $scope.xCoords = [];
        // }
      });

    }, true);

    
  }).
  controller('BoardCtrl', function ($scope, $timeout, $location) {
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
      data = JSON.parse(data.data);

      switch(data.messageType) {
      case "board":
        $scope.$apply(function(){
          $scope.game = data;
          $scope.leftPosition = data.paddles.left.x;
          $scope.rightPosition = data.paddles.right.x;
        });

      }
    };
  });
