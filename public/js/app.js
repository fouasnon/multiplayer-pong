'use strict';

// Declare app level module which depends on filters, and services

var isMobile = function () {
   return (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/iPad/i)) || (navigator.userAgent.match(/android/i));
};

angular.module('multiplayerPong', [
  'ngRoute',
  'multiplayerPong.controllers',
  'multiplayerPong.filters',
  'multiplayerPong.services',
  'multiplayerPong.directives',
  'ngTouch'
]).
  config(function ($routeProvider, $locationProvider) {
    $routeProvider.
      when('/controller', {
        templateUrl: 'partials/mobile',
        controller: 'MobileCtrl'
      }).
      when('/board', {
        templateUrl: 'partials/board',
        controller: 'BoardCtrl'
      }).
      when('/admin', {
        templateUrl: 'partials/admin',
        controller: 'adminCtrl'
      }).
      otherwise({
        redirectTo: function(params, path, search) {
          if (isMobile()) {
              return '/controller';
            } else {
              return '/board';
            }
        }
      });
    $locationProvider.html5Mode(true);
  });