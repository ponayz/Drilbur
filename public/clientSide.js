
var client = {};

client.fayeClient;
client.width;
client.height;
client.frame;
client.controller;
client.takingOff = 0;//to detect weather or not the user really wants to land or take off
client.landing = 0;

client.configFaye = function() {
	this.fayeClient = new Faye.Client('/faye',{
		timeout : 120
	});	
};

client.configLeap = function() {
	
	this.controller = new Leap.Controller({ enableGestures: true });
};

client.leapToScene = function( leapPos ) {
	var iBox = this.frame.interactionBox;

	var left = iBox.center[0] - iBox.size[0]/2;
	var top = iBox.center[1] + iBox.size[1]/2;

	var x = leapPos[0] - left;
	var y = leapPos[1] - top;

	x /= iBox.size[0];
	y /= iBox.size[1];

	x *= this.width;
	y *= this.height;

	return [ x , -y ];
};

client.onCircle = function( gesture ) {

	var pos = this.leapToScene( gesture.center );
	var r = gesture.radius;
	
	var clockwise = false;

 	if( gesture.normal[2]  <= 0 ){
    	clockwise = true;
  	}

	if( clockwise ){
		
		if( this.takingOff >= 5 ){
			console.log("takeoff");
			this.takingOff = 0;
			
			var action = {};
			action.action = "takeoff";
			var channel = "/UpDown";	
					
			return this.postOnFaye( action, channel );
		}else{
			this.takingOff++;
			return;
		}
	
	}else{
		
		if( this.landing >= 5 ){
			console.log( "land" );
			this.landing = 0;

			var action = {};
			action.action = "land";
			var channel = "/UpDown";
			return this.postOnFaye( action, channel );
		}
		else{
			this.landing++;
			return;
		}
	}

};

client.postOnFaye = function( action, channel ) {	
	return this.fayeClient.publish( channel+'' , action );
};

client.getFrame = function() {

	var _this = this;
	this.controller.on( 'frame' , function( data ){
  
		_this.frame = data;

		for( var i =  0; i < _this.frame.gestures.length; i++ ){
			
			var gesture  = _this.frame.gestures[i];
			var type = gesture.type;
	          
			switch( type ){

				case "circle":
					_this.onCircle( gesture );
					break;
				  
				case "swipe":
					_this.onSwipe( gesture );
					break;
	  		}
	  	}

  		if( _this.frame.hands.length >= 1 ){
  			var firstHand = _this.frame.hands[0];
  			var shakingMvt = 0.30;
  			var shakingFront = 0.40;

  			if( firstHand.palmNormal[0] > shakingMvt ){
  				//going left
  				document.getElementById('leftRight').innerHTML = 'left';
  				return _this.flyThisWay( 'left', firstHand.palmNormal[0] );
  				//add the shaking thing so we have a speed between 0 and 1 
  				//because the drone api take a speed in this range.
  			}else if( firstHand.palmNormal[0] < -shakingMvt ){
  				//going right
  				document.getElementById('leftRight').innerHTML = 'right';
  				return _this.flyThisWay( 'right', -firstHand.palmNormal[0] );
  				
  			}

  			if( firstHand.palmNormal[2] > shakingFront ){
  			 	//going forward
  				document.getElementById('frontBack').innerHTML = 'front';  			 	
  				return _this.flyThisWay( 'front', firstHand.palmNormal[2] );
  				
	        }else if( firstHand.palmNormal[2] < -shakingFront ){
	        	//going backward
  				document.getElementById('frontBack').innerHTML = 'back';  			 	
  				return _this.flyThisWay( 'back', -firstHand.palmNormal[2] );
  			}

  			document.getElementById('frontBack').innerHTML = 'stable'; 
  			document.getElementById('leftRight').innerHTML = 'stable'; 
  			return _this.flyThisWay( 'stable' );
  				  

  			/*if( firstHand.translation( _this.controller.frame( 50 ) )[1] > 100 ){
  				//going up
  				//@TODO CALCULATE SPEED! 
  				_this.flyThisWay( 'up', 0.3 );

  			}else if( firstHand.translation( _this.controller.frame( 50 ) )[1] < -100 ){
  				//going down
  				//@TODO CALCULATE SPEED! 
  				_this.flyThisWay( 'down', 0.3 );

  			}else{
  				//staying like a boss
  				_this.flyThisWay( 'stable', 0 );
  			}*/
  			/*var moy = 0;
  			
  			for (var i = 0; i < 50; i++) {
  				moy += firstHand.translation( _this.controller.frame( i ) )[1];	
  			}

  			moy /= 50;
  			
  			if ( moy > 100 ){
  				document.getElementById('upDown').innerHTML = 'up';
  				_this.flyThisWay( 'up', 0.3 );
  			}else if( moy < -100 ){
  				document.getElementById('upDown').innerHTML = 'Down';
  				_this.flyThisWay( 'down', 0.3);
  			}else{
  				document.getElementById('upDown').innerHTML = 'stable';
  				_this.flyThisWay( 'stable', 0 );
  			}*/
		}
	});
};

client.flyThisWay = function(direction,speed) {

	if( direction ){
		var action = {};
		var channel = '/Fly';
		action.speed = speed;
		action.action = direction;
		return this.postOnFaye( action, channel );
	}
	return;
};

client.navdataRead = function() {
	
	this.fayeClient.subscribe( '/navdata' , this.showData );

};

client.showData =  function( data ) {

	//console.log( data );
	document.getElementById('Battery').innerHTML =  data.demo.batteryPercentage;

};

client.run = function() {
	this.configFaye();
	this.configLeap();
	this.navdataRead();
	this.controller.connect();
	this.getFrame();
};

client.run();