/*
**package definition 
**Express, path, http : build the server.
**ar-drone, dronestream : interact with the drone.
**faye : dialog faster with client.
*/

var express = require( 'express' );
var faye = require( 'faye' );
var path = require( 'path' );
var arDrone = require( 'ar-drone' );
var http = require( 'http' );
var stream = require( 'dronestream' );
var util = require( 'util' );

/*
**initialize the variables : 
**app : to configure the server.
**client : for the drone.
**listener : to interact listen to the signal emited by the client(s).
**portOf : to configure the port of the localhost we're attaching the server.
*/
var Serv = function( port ) {

	this.app = express();
	this.client;
	this.listener;
	port ? this.portOf = port : this.portOf = 8000;
}

Serv.prototype = {

	/*
	**configuration of the server and his components.
	*/
	configServer : 
		function() {
			var _this = this;
			this.app.configure( function() {
			    _this.app.set( 'port', _this.portOf );
			    _this.app.use( _this.app.router );
			    _this.app.use( express.static( path.join( __dirname, 'public' ) ) );
			    return _this.app.use( "/components", express.static( path.join( __dirname, 'components' ) ) );
			} );
		},

	/*
	**configuring the package that handle the video,
	**the faye package, and attaching both on the server.
	**run the server as well.
	*/
	runServer :
		function() {
			
			var toListen = http.createServer( this.app );
			stream.listen( toListen ); 
			
			new faye.NodeAdapter( {
				mount: '/faye',
				timeout : 45
			} ).attach( toListen );

			console.log(this.portOf);
			toListen.listen( this.portOf );
		},

	/*
	**creating the client that will talks to the ar-drone.
	**creating channel to get the event sent by the server's client.
	**Fly : to get all the basics mouvement such as going forward, backward...
	**UpDown : handle the takeoff and land procedure.
	**navdata : this time the server send to the client the navigation data that the 
	**			drone send to the server.
	*/
	createClient:
		function() {
			this.client = arDrone.createClient();
			
			this.listener = new faye.Client( "http://localhost:" + this.portOf + "/faye" );

			var _this = this;

			this.listener.subscribe( '/Fly', function( data ) {
				if( typeof _this.client[ data.action ] == 'function'){
					console.log( 'flying : ' + data.action + " speed :" + data.speed);
					return _this.client[ data.action ]( data.speed );
				}else{ 
					return _this.client.stop();
				}
			});
				
			this.listener.subscribe( '/UpDown', function( data ) {						
				
				if( data.action == "takeoff" ){	

					console.log( 'taking off!' );
					return _this.client.takeoff();
				} else if( data.action == "land" ){

					console.log('landing');
					return _this.client.land();
				}
			});	

			this.client.on('navdata', function( data ) {
    			return _this.listener.publish( "/navdata", data );
  			});			
		},

	/*
	**function that call everything. 
	*/
	run :
		function() {
			this.configServer();
			this.runServer();
			this.createClient();
		}

};

//launch the serv.
var datServ = new Serv( 8000 ).run();