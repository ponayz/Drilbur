var arDrone = require('ar-drone');
var client = arDrone.createClient();
//var control = arDrone.createUdpControl();

/*var ref = {};
var pcmd = {};

setTimeout(function() {
	console.log('takeoff');

	ref.emergency = false;
	ref.fly = true;
},1000);

setTimeout(function() {
	pcmd.up = 0.4;
}, 4000);

setTimeout(function() {
	console.log('turn Clockwise');
	pcmd.clockwise = 0.8;
	//pcmd.front = 0.5;
	//pcmd.left = 0.5;
}, 5000);

setTimeout(function() {
	console.log('Landing ...');

	ref.fly = false;
	pcmd = {};
}, 8000);


setInterval(function() {
	control.ref(ref);
	control.pcmd(pcmd);
	control.flush();
}, 30);*/



//var PaVEParser = require('../video/PaVEParser'); 
//var output = require('fs').createWriteStream('./vid.h264');

//var video = client.getVideoStream();
//var parser = new PaVEParser();

/*parser
  .on('data', function(data) {
    output.write(data.payload);
  })
  .on('end', function() {
    output.end();
  });

video.pipe(parser);*/

//client.createREPL();

client.takeoff();

//client.animateLeds('blinkGreenRed',50,15);

client
	.after(5000, function() {
		this.up(0.4);
	})
	.after(3000,function() {
		this.stop();
	})
//	.after(2000, function() {
//		this.front(0.3);
//	})
//	.after(1000, function () {
		//this.up(0.5);
		//this.counterClockwise(0.5);

		//this.on('navdata',console.log);

//	})

	.after(6000,function() {
		this.stop();
		this.land();
	});