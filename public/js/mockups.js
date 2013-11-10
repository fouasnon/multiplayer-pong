$(document).ready(function () {

	var hitLoop = function () {
      $(".ball").toggleClass("going-right");
      $(".ball").toggleClass("going-down");
      window.setTimeout(hitLoop, 2000);
  	};

});


