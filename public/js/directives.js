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
        explode: '=',
        score: '='
      },
      link: function(scope, elm, attrs) {
        
        scope.$watch('score', function(newVal, oldVal){
          if (newVal) {
            console.log('xinterval: '+newVal.ball.x.interval);
            console.log('yinterval: '+newVal.ball.y.interval);
            elm.css('-webkit-transition-duration', newVal.ball.y.interval+'ms, '+newVal.ball.x.interval+'ms');

            if (newVal.ball.x.velocity > 0) {
              elm.addClass('going-right');
            } else {
              elm.removeClass('going-right');
            }
            
            if (newVal.ball.y.velocity > 0) {
              elm.addClass('going-down');
            } else {
              elm.removeClass('going-down');
            }
          }
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
