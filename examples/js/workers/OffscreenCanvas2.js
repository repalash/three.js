self.importScripts( '../../../build/three.js' );
self.importScripts( '../loaders/GLTFLoader2.js' );

THREE.TextureLoader.prototype.load = function ( url, onLoad, onProgress, onError ) {

	var texture = new THREE.Texture();

	var loader = new THREE.ImageBitmapLoader( this.manager );
	loader.setCrossOrigin( this.crossOrigin );
	loader.setPath( this.path );

	loader.load( url, function ( image ) {

		texture.image = image;

		// JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
		var isJPEG = url.search( /\.jpe?g$/i ) > 0 || url.search( /^data\:image\/jpeg/ ) === 0;

		texture.format = isJPEG ? THREE.RGBFormat : THREE.RGBAFormat;
		texture.needsUpdate = true;

		if ( onLoad !== undefined ) {

			onLoad( texture );

		}

	}, onProgress, onError );

	return texture;

};

THREE.CubeTextureLoader.prototype.load = function ( urls, onLoad, onProgress, onError ) {

	var texture = new THREE.CubeTexture();

	var loader = new THREE.ImageBitmapLoader( this.manager );
	loader.setCrossOrigin( this.crossOrigin );
	loader.setPath( this.path );

	var loaded = 0;

	function loadTexture( i ) {

		loader.load( urls[ i ], function ( image ) {

			texture.images[ i ] = image;

			loaded ++;

			if ( loaded === 6 ) {

				texture.needsUpdate = true;

				if ( onLoad ) onLoad( texture );

			}

		}, undefined, onError );

	}

	for ( var i = 0; i < urls.length; ++ i ) {

		loadTexture( i );

	}

	return texture;

};


self.onmessage = function ( message ) {

	var data = message.data;
	init( data.drawingSurface, data.width, data.height, data.pixelRatio );

};

var camera, scene, renderer, mesh, clock;

function init( offscreen, width, height, pixelRatio ) {

	clock = new THREE.Clock();

	camera = new THREE.PerspectiveCamera( 70, width / height, 0.001, 2000 );
	camera.position.z = 0.03;

	scene = new THREE.Scene();

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var directionalLight = new THREE.DirectionalLight( 0xFFFFFF );
	directionalLight.position.set( 0, 0, 1 );
	scene.add( directionalLight );

	var path = '../../textures/cube/Park2/';
	var format = '.jpg';
	var urls = [
		path + 'posx' + format, path + 'negx' + format,
		path + 'posy' + format, path + 'negy' + format,
		path + 'posz' + format, path + 'negz' + format
	];

	var envMap = new THREE.CubeTextureLoader().load( urls, undefined, undefined, console.log );
	envMap.format = THREE.RGBFormat;

	scene.background = envMap;

	var loader = new THREE.GLTFLoader();

	loader.load( '../../models/gltf/BoomBox/glTF/BoomBox.gltf', function ( gltf ) {

		mesh = gltf.scene;

		gltf.scene.traverse( function ( object ) {

			if ( object.material !== undefined ) {

				object.material.envMap = envMap;
				object.material.needsUpdate = true;

			}

		} );

		scene.add( gltf.scene );

		animate();

	} );

	renderer = new THREE.WebGLRenderer( { antialias: true, canvas: offscreen } );
	renderer.setPixelRatio( pixelRatio );
	renderer.setSize( width, height, false );
	renderer.gammaOutput = true;
	renderer.physicallyCorrectLights = true;

}

function animate() {

	var delta = clock.getDelta();

	mesh.rotation.y += delta * 0.5;

	renderer.render( scene, camera );

	if ( self.requestAnimationFrame ) {

		self.requestAnimationFrame( animate );

	} else if ( renderer.context.commit ) {

		// Deprecated

		renderer.context.commit().then( animate );

	}

}
