$(document).ready(function () {

	var hitLoop = function () {
      $(".ball").toggleClass("going-right");
      $(".ball").toggleClass("going-down");
      window.setTimeout(hitLoop, 2000);
  	};

 // hitLoop();


	var goal = function () {
	  $(".goal").toggle();
	  $(".goal h1").addclass('visible');
	};

	var goalReset = function () {
		$(".goal").addClass("explode");
		window.setTimeout(function(){
			$('.goal').remove();
		}, 300);
	};

	$(document).on('click', ".goal",
	function () {
		$(".goal").addClass("explode");
		window.setTimeout(function(){
			$('.goal').remove();
		}, 300);
	});

	//help menu
	$(document).on('click', ".help",
	function () {
		$(".help").toggleClass("open");	
		$(".help-icon").toggle();
	});

});



/*


var goalReset = function () {
	$(".goal").addClass('explode');
	window.setTimeout(function(){
		$('.goal').remove();
	}, 300);
};

var goal = function () {
  $(".goal").toggle();
  $(".goal").addClass('visible');
  $(".goal h1").addClass('visible');
  window.setTimeout(goalReset(), 3000);
};


*/