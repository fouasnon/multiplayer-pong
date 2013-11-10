// This way seems jenky but works perfect
var goalSound = function(){
var audio = document.createElement("audio");
	if (audio != null && audio.canPlayType && audio.canPlayType("audio/mp3")) {
	    audio.src = "mp3/goal.mp3";
	    audio.play();
	}
};

var hitSound = function(){
var audio = document.createElement("audio");
	if (audio != null && audio.canPlayType && audio.canPlayType("audio/mp3")) {
	    audio.src = "mp3/hit-sound.mp3";
	    audio.play();
	}
};

var wallHitSound = function(){
var audio = document.createElement("audio");
	if (audio != null && audio.canPlayType && audio.canPlayType("audio/mp3")) {
	    audio.src = "mp3/wall-hit.mp3";
	    audio.play();
	}
};

/*
// This way seems better but doesnt allow interrupts

var goalSoundFile = new Audio("mp3/goal.mp3");
var hitSoundFile = new Audio("mp3/hit-sound.mp3");
var wallHitSoundFile = new Audio("mp3/wall-hit.mp3");

var goalSound = function(){
	goalSoundFile.play();
};

var hitSound = function(){
	hitSoundFile.play();
};

var wallHitSound = function(){
	wallHitSoundFile.play();
};

*/

    

// sorry hannah
/*
$(document).on('click', ".start-button",
	function () {
		$(".start-button").addClass("explode");	
});

-- worked but broke color fading: --
//Mobile GOAL message
ws.onmessage = function(data, flags) {

  $scope.$apply(function(){
    data = JSON.parse(data.data);
    if (data.messageType==='goal') {
      $scope.excited = true;
      $timeout(function(){
        $scope.excitedClimax = true;
      }, 600)
      $timeout(function(){
        $scope.excited = false;
        $scope.excitedClimax = false;
      }, 1600)
    }
  });
};

*/
