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
          elm.css('top', newVal*340+'px');
        });
      }
    };
  }).
  directive('ball', function ($timeout) {
    return {
      restrict: 'A',
      scope: {
        initX: '=',
        initY: '=',
        interval: '=',
        explode: '=',
        vx: '=',
        vy: '=',
        score: '='
      },
      link: function(scope, elm, attrs) {
        scope.$watch('x', function(newVal){
//          console.log('x: '+newVal);
//          elm.css('left', newVal*100+'%');
        });
        scope.$watch('score', function(newVal, oldVal){
          if (newVal) {
          console.log('dinterval: '+newVal.ball.x.interval);
          elm.css('-webkit-transition', newVal.ball.x.interval+'ms linear');

          if (newVal.ball.x.velocity > 0) {
            elm.addClass('going-right');
          } else {
            elm.removeClass('going-right');
          }



          }
        });
        scope.$watch('vx', function(newVal){
//          console.log('vx: '+newVal);
        });
        scope.$watch('y', function(newVal){
//          console.log(newVal);

        });
        scope.$watch('vy', function(newVal){
//          console.log(newVal);
        });
      }
    };
  }).
  directive('moveGutterBall', function (version) {
    return {
      restrict: 'A',
      scope: {
        position: '='
      },
      link: function(scope, elm, attrs) {
        scope.$watch('position', function(newVal){
          elm.css('top', newVal*100+'%');
          elm.css('margin-top', -100*newVal+'px');
        });
      }
    };
  }).
  directive('controllerColor', function (version) {
    return {
      restrict: 'A',
      scope: {
        bgTint: '='
      },
      link: function(scope, elm, attrs) {
        scope.$watch('bgTint', function(newVal){
          elm.css('opacity', newVal*100);
        });
      }
    };
  }).
  directive('explode', function(){
    return function(scope, elm, attrs) {
        elm.bind('click', function(e){
            e.preventDefault();
            elm.addClass('explode');
            setTimeout(function(){
                scope.$apply(function(){
                  scope.$eval(attrs.remove);
                elm.remove();
                });
            }, 300);
        });
    };
}).
  directive('fadeOut', function(){
    return function(scope, elm, attrs) {
        elm.bind('click', function(e){
            e.preventDefault();
            elm.addClass('fade-out');
            setTimeout(function(){
                scope.$apply(function(){
                  scope.$eval(attrs.remove);
                elm.remove();
                });
            }, 600);
        });
    };
});
