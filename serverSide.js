
var express = require( 'express' );
var faye = require( 'faye' );
var path = require( 'path' );
var arDrone = require( 'ar-drone' );
var http = require( 'http' );
var stream = require( 'dronestream' );

var Serv = function(port) {

	this.app = express();
	this.client;
	this.listener;
	port ? this.portOf = port : this.portOf = 8000;
}

Serv.prototype = {

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

	createClient:
		function(tab) {
			this.client = arDrone.createClient();
			
			this.listener = new faye.Client( "http://localhost:" + this.portOf + "/faye" );

			if( tab instanceof Array ){

				if( tab.indexOf( 'UpDown' ) > -1 ){
					var _this = this;
					this.listener.subscribe( '/UpDown', function( data ) {						
						
						if( data.action == "takeoff" ){	

							console.log( 'taking off!' );
							return _this.client.takeoff();
						} else if( data.action == "land" ){

							console.log('landing');
							return _this.client.land();
						}
					});					
				}			
			}
		},

	run :
		function(tab) {
			this.configServer();
			this.runServer();
			this.createClient(tab);
		}

};

var tab = new Array();
tab.push( 'UpDown' ); //tab qui contient les channels qu'on veut ecouter.

var datServ = new Serv( 8000 );
datServ.run( tab );