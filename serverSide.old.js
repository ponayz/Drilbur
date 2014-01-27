var express = require('express'),
	faye = require('faye'),
	path = require('path'),
	arDrone = require('ar-drone');

var app = express();
var client = arDrone.createClient();

app.configure(function() {
    app.set('port',8000);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    return app.use("/components", express.static(path.join(__dirname, 'components')));
});

var server = require("http").createServer(app);
require("dronestream").listen(server); 

new faye.NodeAdapter({
	mount: '/faye',
	timeout: 45}).attach(server);

server.listen(8000);

var listener = new faye.Client("http://localhost:8000/faye");

listener.subscribe('/UpDown', function(data) {
	if(data.action == "takeoff"){
		console.log('taking off!');
		return client.takeoff();
	}else if(data.action == "land" ){
		console.log('landing');
		return client.land();
	}
});

/*client.getPngStream()
	.on('error', console.log )
	.on("data", function(frame) {
		console.log('bitch');
		//setTimeout( listener.publish('/Img', frame), 20); //delay de 15ms pour simuler le 60fps a test...
	});*/

/*imageSendingPaused = false;
var currentImg;

client.getPngStream()
	.on('error',console.log)
	.on("data", function(data) {
	    currentImg = data;
	    console.log('tee');

	    if (imageSendingPaused) {
	      return;
	    }
	    //setTimeout(function() {
	    	console.log('hail');
	    	return listener.publish("/image", {img : 'vfesf'});
	    //},100);
	   // imageSendingPaused = true;
		return setTimeout((function() {
	    	return imageSendingPaused = false;
	    }), 100);
	  });

  app.get("/image/:id", function(req, res) {
    res.writeHead(200, {
      "Content-Type": "image/png"
    });
    return res.end(currentImg, "binary");
  }); */

  //petit souci pour les images, on a pas un path du coups chaud a metre dans une balise img classique a voir
//img.src = 'data:image/jpeg;base64,' + btoa('your-binary-data');