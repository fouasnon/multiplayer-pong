'use strict';

/* Controllers */

angular.module('multiplayerPong.controllers', []).
  controller('MobileCtrl', function ($scope, $timeout, $window) {
    var ws = new WebSocket('ws://galois.local:3000');
    $scope.name = 'Mobile';
    
    ws.onopen = function() {
      console.log('do i happen?');
      ws.send('hello world');
    };
    ws.onmessage = function(data, flags) {
      console.log(data);
    };


    $timeout(function(){
      ws.send('Yo Dawg!');
    }, 1000)
    $window.addEventListener("deviceorientation", function(event) {
      // process event.alpha, event.beta and event.gamma

      var sendCoords = function(){
        $scope.$apply(function(){
          $scope.x = event.beta;  // In degree in the range [-180,180]
          $scope.y = event.gamma; // In degree in the range [-90,90]
          $scope.z = event.alpha; // In degree in the range [-90,90]
          ws.send($scope.x);
        })
        $timeout(function(){
          sendCoords();
        }, 1000);
      }
      sendCoords();
//      console.log('x'+ x)
//      console.log('y'+ y)
//      console.log('z'+ z)


    }, true);
  }).
  controller('BoardCtrl', function ($scope) {
    $scope.name = 'Board';
  });
