'use strict';

/* Directives */

angular.module('multiplayerPong.directives', []).
  directive('appVersion', function (version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }).
  directive('movePaddle', function (version) {
    return {
      restrict: 'A',
      scope: {
        position: '='
      },
      link: function(scope, elm, attrs) {
        scope.$watch('position', function(newVal){
          elm.css('top', newVal*100+'%');
          elm.css('margin-top', -140*newVal+'px');
        });
      }
    };
  });
