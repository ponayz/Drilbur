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

new faye.NodeAdapter({
	mount: '/faye',
	timeout: 45}).attach(server);

server.listen(8000);

var listener = new faye.Client("http://localhost:8000/faye");

listener.subscribe('/UpDown', function(data) {
	if(data.action == "takeoff"){
		console.log('taking off!');
		client.takeoff();
	}else if(data.action == "land" ){
		console.log('landing');
		client.stop();
		client.land();
	}
});

client.createPngStream().on("data", function(frame) {
    setTimeout( listener.publish('/Img', frame), 30); //delay de 15ms pour simuler le 60fps a test...
}); 

  //petit souci pour les images, on a pas un path du coups chaud a metre dans une balise img classique a voir
//img.src = 'data:image/jpeg;base64,' + btoa('your-binary-data');