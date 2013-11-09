'use strict';

// Declare app level module which depends on filters, and services

angular.module('multiplayerPong', [
  'multiplayerPong.controllers',
  'multiplayerPong.filters',
  'multiplayerPong.services',
  'multiplayerPong.directives'
]).
  config(function ($routeProvider, $locationProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'partials/mobile',
        controller: 'MobileCtrl'
      }).
      when('/board', {
        templateUrl: 'partials/board',
        controller: 'BoardCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
  });
