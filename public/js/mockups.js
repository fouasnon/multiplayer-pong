$(document).ready(function () {

var hitLoop = function () {
      $(".ball").toggleClass("hit");
      window.setTimeout(hitLoop, 1000);
  };



});