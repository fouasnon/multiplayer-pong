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
  controller('MyCtrl2', function ($scope) {
    // write Ctrl here

  });
