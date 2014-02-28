/**
**TO CALIBRATE :
** shakingMvt
** variable du filtre passe bas de décolage et atterissage
** nombre de frame et la valeur de la translation pour le up et down
**/

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
client.takingOff = 1;
client.landing = 1;
client.shakingMvt = 0;
client.isFlying = false;

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
		
		if( this.takingOff % 10 && !this.isFlying ){
			this.takingOff = 1;
			this.isFlying = true;
			
			var action = {};
			action.action = "takeoff";
			var channel = "/UpDown";	
					
			return this.postOnFaye( action, channel );
		}else{
			this.takingOff++;
			return;
		}
	
	}else{
		
		if( this.landing % 10 == 0 && this.isFlying ){
			this.isFlying = false;
			this.landing = 1;

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
			document.getElementById('leftRight').innerHTML = 'left';
			return this.flyThisWay( 'left', firstHand.palmNormal[0] );
			//add the shaking thing so we have a speed between 0 and 1 
			//because the drone api take a speed in this range.
		}else if( firstHand.palmNormal[0] < -this.shakingMvt ){
			//going right
			document.getElementById('leftRight').innerHTML = 'right';
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
			document.getElementById('frontBack').innerHTML = 'front';  			 	
			return this.flyThisWay( 'front', firstHand.palmNormal[2] );
			
		}else if( firstHand.palmNormal[2] < -this.shakingMvt ){
			//going backward
			document.getElementById('frontBack').innerHTML = 'back';  			 	
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
	
	/*if( this.isFlying && this.frame.hands.length >= 1 ){
		
		var firstHand = this.frame.hands[0];
		var normalize = firstHand.palmPosition[1]/600; //normalize the position
		var speed = Math.abs( 0.5 - normalize ); //calculate the speed between 0 and 0.5 

		if( normalize >= 0.6 ){
			//going up
			document.getElementById('upDown').innerHTML = 'up';
			return this.flyThisWay( 'up', speed );

		}else if( normalize <= 0.4 ){
			//going down
			document.getElementById('upDown').innerHTML = 'down';
			return this.flyThisWay( 'down', speed );
		
		}else{
			//retrun false cause we're stable..
			document.getElementById('upDown').innerHTML = 'stable';
			return false;
		}
	}

	return false;*/


	/*if( this.isFlying && this.frame.hands.length >=1 ){
		var firstHand = this.frame.hands[0];
		var velocity = firstHand.palmVelocity[1];
		var speed = 0.6;
		if( velocity >= 250 ){
			//going up 
			document.getElementById('upDown').innerHTML = 'up';
			return this.flyThisWay( 'up', speed );
		}else if( velocity <= -250 ){
			//going down
			document.getElementById('upDown').innerHTML = 'down';
			return this.flyThisWay( 'down', speed );
		}else{
			document.getElementById('upDown').innerHTML = 'stable';
			return false;
		}
	}
		hand1.translation( controller.frame(20) )[1]  < -65

	return false;*/

	if( this.isFlying && this.frame.hands.length >=1 ){

		var firstHand = this.frame.hands[0];
		var previousFrame = this.controller.frame(20);
		var translationVector = firstHand.translation( previousFrame ); 
		//@TODO : calculate speed
		var speed = 0.6; 

		if( translationVector[1] > 80 ){
			//going up
			document.getElementById('upDown').innerHTML = "up";
			return this.flyThisWay( 'up', speed );
		}else if( translationVector[1] < -80){
			//going down
			document.getElementById('upDown').innerHTML = "down";
			return this.flyThisWay( 'down', speed );
		}else{
			document.getElementById('upDown').innerHTML = "stable";
			return false;
		}
	}

	return false;
};

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

			if( _this.isFlying ){

				if( _this.upDown() != false || _this.forwardBackward() != false || _this.leftRight() != false ){
					document.getElementById('stab').innerHTML = 'MOVE!';
				}else{
					document.getElementById('stab').innerHTML = 'STABLE!';			
					return _this.flyThisWay( 'stable' );
				}
			}

		} else if( _this.isFlying == true ) {
			_this.isFlying = false;
			var action = {};
			action.action = "land";
			var channel = "/UpDown";
			return _this.postOnFaye( action, channel );	
		}

	});
};

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
	document.getElementById('Battery').innerHTML =  data.demo.batteryPercentage;
};

/**
**calls the function and launch the project 
**/
client.run = function() {
	this.configFaye();
	this.configLeap();
	//new NodecopterStream(document.getElementById("droneStream"));
	this.navdataRead();
	this.controller.connect();
	this.getFrame();
};


$( document ).keydown( function( ev ) {
	if( ev.keyCode == 32 ){
		console.log("Landing triggered by keyboard");
		var action = {};
		action.action = "land";
		var channel = "/UpDown";
		client.postOnFaye( action, channel );
	}
});

client.run();