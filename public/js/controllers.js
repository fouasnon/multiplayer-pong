'use strict';

/* Controllers */

angular.module('multiplayerPong.controllers', []).
  controller('MobileCtrl', function ($scope, $timeout, Socket) {
    var socket = new Socket();
    $scope.name = 'Mobile';
    console.log(socket);

    // $timeout(function(){
    //   socket.send('Yo Dawg!');
    // }, 1000)

  }).
  controller('BoardCtrl', function ($scope) {
    $scope.name = 'Board';

  });
