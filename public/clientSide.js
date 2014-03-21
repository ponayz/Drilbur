/**
**TO CALIBRATE :
** shakingMvt
** variable du filtre passe bas de décolage et atterissage
** nombre de frame et la valeur de la translation pour le up et down
**/
//@todo decollage atterisage

var client = {};

/**
**set attribute of the client class.
**fayeClient : contains the context of faye package
**frame : contains the current frame sent by the leap motion
**controller : contains the controller of the leap motion
**takingOff, landing : used to perform a low-pass filter ( action performed each 10 mouvments ) 
**shakingMvt : delta that allow us to decide weather or not the mouvment detected was valid or not
**isFlying : boolean that allow us to know if the drone flys or not
**@TODO : remove the isFLying var and use the navdata instead 
**/

client.fayeClient;
client.frame;
client.controller;
client.turnClock = 1;
client.turnCounterClock = 1;
client.shakingMvt = 0;
client.isFlying = false;
client.altitude = 0;
client.emergency;

/**
**configure faye on client side timeout at 120ms
**set the shaking mouvment variable default at 0.20 
**/
client.configFaye = function( shake ) {
	this.fayeClient = new Faye.Client('/faye',{
		timeout : 120
	});

	shake ? this.shakingMvt = shake : this.shakingMvt = 0.20;	
};

/**
**get the leap context and configure it, enableGestures is enough there
**/
client.configLeap = function() {
	
	this.controller = new Leap.Controller({ enableGestures: true });
};

/**
**called on circle detection, if clockwise we send a takeoff signal
**set the isFlying var to true
**if counter-clockwise we send a land signal and set isFlying at false
**gesture : the gesture send by the leap
**/
client.onCircle = function( gesture ) {
	
	var clockwise = false;

 	if( gesture.normal[2]  <= 0 ){
    	clockwise = true;
  	}

	if( clockwise ){
		
		if( !this.isFlying ){
			var _this = this;
			setTimeout( function () {_this.isFlying = true;} , 1500); 

			return this.postOnFaye( { action : 'takeoff' }, '/UpDown' );

		}else if( this.isFlying && this.turnClock % 10 == 0  ){
			
			this.turnClock = 1;
			return this.flyThisWay( 'clockwise', 0.5 );

		}else{
			this.turnClock++;
			return;
		}
	
	}else{
		
		if( this.turnCounterClock % 10 == 0 && this.isFlying ){
	
			this.turnCounterClock = 1;

			return this.flyThisWay( 'counterClockwise', 0.5 );
		}
		else{
			this.turnCounterClock++;
			return;
		}
	}
};

/**
**handle the publish methode 
**action : an object that contains the name of the method and if needed the speed
**channel : channel we want to publish on
**/
client.postOnFaye = function( action, channel ) {

	return this.fayeClient.publish( channel+'' , action );
};

/**
**handle the mouvment on the left and right
**we want to return false so we can detect when to send a stop signal to the drone
**/
client.leftRight = function() {
	
	if( this.isFlying && this.frame.hands.length >= 1 ){
		
		var firstHand = this.frame.hands[0];
		
		if( firstHand.palmNormal[0] > this.shakingMvt ){
			//going left
			document.getElementById('leftRight').innerHTML = 'Gauche';
			return this.flyThisWay( 'left', firstHand.palmNormal[0] );
			//add the shaking thing so we have a speed between 0 and 1 
			//because the drone api take a speed in this range.
		}else if( firstHand.palmNormal[0] < -this.shakingMvt ){
			//going right
			document.getElementById('leftRight').innerHTML = 'Droite';
			return this.flyThisWay( 'right', -firstHand.palmNormal[0] );		
		}else{
			document.getElementById('leftRight').innerHTML = 'stable';
			return false;
		}
	}

	return false;
};

/**
**see leftRight
**/
client.forwardBackward = function() {

	if( this.isFlying && this.frame.hands.length >= 1 ){
		
		var firstHand = this.frame.hands[0];

		if( firstHand.palmNormal[2] > this.shakingMvt ){
		 	//going forward
			document.getElementById('frontBack').innerHTML = 'Avance';  			 	
			return this.flyThisWay( 'front', firstHand.palmNormal[2] );
			
		}else if( firstHand.palmNormal[2] < -this.shakingMvt ){
			//going backward
			document.getElementById('frontBack').innerHTML = 'Recule';  			 	
			return this.flyThisWay( 'back', -firstHand.palmNormal[2] );
		}else{
			document.getElementById('frontBack').innerHTML = 'stable';  			 	
			return false;
		}
	}

	return false;
};

/**
**see leftRight
**/
client.upDown = function() {
	
	if( this.isFlying && this.frame.hands.length >= 1 ){
		
		var firstHand = this.frame.hands[0];
		var normalize = firstHand.palmPosition[1]/600; //normalize the position
		var speed = Math.abs( 0.5 - normalize ) + 0.5; //calculate the speed between 0 and 0.9
		var velocity = firstHand.palmVelocity[1];
		var topFlying = 0.6;
		var botFlying = 0.4;
		var stepVelocity = 200;

		speed = speed > 1 ? 0.9 : speed;


		if( normalize >= topFlying || velocity >= stepVelocity ){
			//going up
			document.getElementById('upDown').innerHTML = 'Monte';
			return this.flyThisWay( 'up', speed );

		}else if( normalize <= botFlying || velocity <= -stepVelocity ){
			//going down
			document.getElementById('upDown').innerHTML = 'Descend';

			if( this.altitude <= 0.15 ){
				this.isFlying = false;
				this.postOnFaye( { action : 'stop' }, '/UpDown' );
				return this.postOnFaye( { action : 'land' }, 'UpDown' );
			}
			return this.flyThisWay( 'down', speed );

		}else{
			//stable
			document.getElementById('upDown').innerHTML = 'stable';
			return false;
		}
	}

	return false;

};

client.getMode = function(){

	var numOfHands = this.frame.hands.length;
	var numOfFingers = 0;

	if( numOfHands > 0 ){
		
		for(var i = 0; i<numOfHands; i++){
			numOfFingers += this.frame.hands[i].fingers.length;
		}

		if( numOfFingers > 5 ){
			return 1;
		}
	}

	return 0;
}

/**
**the main routine each time we get a frame from the leap motion we analyze it
**if we detect a circle then we try to make the drone take off or land.
**if the drone is actually flying we're listening to the user mouvment,
**if no mouvment has been detected we send a stop signal to the drone.
**/
client.getFrame = function() {

	var _this = this;

	this.controller.on( 'frame', function( data ) {
		_this.frame = data;
		if( _this.frame.hands.length > 0 ){

			for (var i = 0; i < data.gestures.length ; i++) {
				var type = data.gestures[i].type;
				if( type == "circle" ){
					return _this.onCircle( data.gestures[i] );
				}
			}

			if( _this.isFlying && _this.getMode() == 0 ){

				if( _this.upDown() != false || _this.forwardBackward() != false || _this.leftRight() != false ){
					document.getElementById('stab').innerHTML = '<div class="alert alert-success">EN MOUVEMENT</div>';
				}else{
					document.getElementById('stab').innerHTML = '<div class="alert alert-info">STABLE</div>';	
					return _this.postOnFaye( { action : 'stop' }, '/UpDown' );
				}
			}else if( _this.isFlying && _this.getMode() == 1 ){
				_this.getFigure();
			}

		} else if( _this.isFlying == true ) {
			_this.isFlying = false;
			var action = {};
			action.action = "land";
			var channel = "/UpDown";
			_this.postOnFaye( { action : 'stop' }, '/UpDown' );
			return _this.postOnFaye( action, channel );	
		}

	});
};

client.getFigure = function( tab ) {
	
}

/**
**handle the construction of the object that'll be send to the server through faye
**/
client.flyThisWay = function(direction,speed) {

	if( direction ){
		var action = {};
		var channel = '/Fly';
		action.speed = speed;
		action.action = direction;
		return this.postOnFaye( action, channel );
	}
};

/**
**get the navdata sent by the server wich are themselves sent by the drone
**/
client.navdataRead = function() {
	
	this.fayeClient.subscribe( '/navdata' , this.showData );
};

/**
**will handle the task of informing the user about the state of the drone
**/
client.showData =  function( data ) {

	//console.log( data );
	var _this = this;
	document.getElementById('Battery').innerHTML =  data.demo.batteryPercentage;
	
	if( data.droneState.emergencyLanding == 1 ){
		this.isFlying = false;     		
		document.getElementById('emergency').innerHTML = '<div class="alert alert-danger"> <strong> Drone choqué, appuillez sur entrée pour le retablir </strong></div>';
	}else{
		document.getElementById('emergency').innerHTML = ''; 
	}

	setTimeout( function () { _this.altitude = data.demo.altitude; }, 200 ); 
	document.getElementById('height').innerHTML =  data.demo.altitude;


};

/**
**calls the function and launch the project 
**/
client.run = function() {
	this.configFaye();
	this.configLeap();
	new NodecopterStream( document.getElementById( "droneStream" ) );
	this.navdataRead();
	this.controller.connect();
	this.getFrame();
};

$( document ).keydown( function( ev ) {
	if( ev.keyCode == 32 ){
		console.log("Landing triggered by keyboard");
		client.isFlying = false;
		client.postOnFaye( { action : 'stop' }, '/UpDown' );
		client.postOnFaye( { action : 'land' }, '/UpDown' );
	}else if( ev.keyCode == 13 ){
		console.log( "Recovering" ); 
		client.postOnFaye( { action : 'disableEmergency' }, '/UpDown' );
	}
});

client.run();