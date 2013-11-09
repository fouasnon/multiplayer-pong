'use strict';

/* Filters */

angular.module('multiplayerPong.filters', []).
  filter('interpolate', function (version) {
    return function (text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  });
