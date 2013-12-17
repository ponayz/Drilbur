var fayeClient = new Faye.Client('/faye',{
	timeout : 120
});

/*client.subscribe('/messages', function(message) {
  alert('Got a message: ' + message.text);
});*/


var canvas = document.getElementById( 'canv' );
var c =  canvas.getContext( '2d' );
var width = canvas.width;
var height = canvas.height;
var frame;

var controller = new Leap.Controller({ enableGestures: true });

function leapToScene( leapPos ){

	var iBox = frame.interactionBox;

	var left = iBox.center[0] - iBox.size[0]/2;
	var top = iBox.center[1] + iBox.size[1]/2;

	var x = leapPos[0] - left;
	var y = leapPos[1] - top;

	x /= iBox.size[0];
	y /= iBox.size[1];

	x *= width;
	y *= height;

	return [ x , -y ];

}

function onCircle( gesture ){

	var pos = leapToScene( gesture.center );
	var r = gesture.radius;
	
	var clockwise = false;

 	if( gesture.normal[2]  <= 0 ){
    	clockwise = true;
  	}

	// Setting up the style for the stroke, and fill
	c.fillStyle   = "#39AECF";
	c.strokeStyle = "#FF5A40";
	c.lineWidth   = 5;

	// Creating the path for the finger circle
	c.beginPath();

	// Draw a full circle of radius 6 at the finger position
	c.arc(pos[0], pos[1], r, 0, Math.PI*2); 

	c.closePath();

	if( clockwise ){
		c.stroke();

		fayeClient.publish('/UpDown', {
			action : "takeoff"
		});
			
	}else{
		c.fill();

		fayeClient.publish('/UpDown', {
			action : "land"
		});
	}
}

function onSwipe( gesture ){

	var startPos = leapToScene( gesture.startPosition );

	var pos = leapToScene( gesture.position );

	// Setting up the style for the stroke
	c.strokeStyle = "#FFA040";
	c.lineWidth = 3;

	// Drawing the path
	c.beginPath();

	// Move to the start position
	c.moveTo( startPos[0] , startPos[1] );

	// Draw a line to current position
	c.lineTo( pos[0] , pos[1] );

	c.closePath();
	c.stroke();
}

controller.on( 'frame' , function( data ){
  
	frame = data;

	c.clearRect( 0 , 0 , width , height );

	for( var i =  0; i < frame.gestures.length; i++){
		
		var gesture  = frame.gestures[i];
		var type = gesture.type;
          
		switch( type ){

			case "circle":
				onCircle( gesture );
				break;
			  
			case "swipe":
				onSwipe( gesture );
				break;

			case "screenTap":
				//onScreenTap( gesture );
				break;

			case "keyTap":
				//onKeyTap( gesture );
				break;

  		}

    }
});

controller.connect();