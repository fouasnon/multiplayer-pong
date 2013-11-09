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
      templateUrl: 'partials/partial1',
      controller: 'MobileCtrl'
    }).
    when('/view2', {
      templateUrl: 'partials/partial2',
      controller: 'MyCtrl2'
    }).
    otherwise({
      redirectTo: '/view1'
    });

  $locationProvider.html5Mode(true);
});
