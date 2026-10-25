import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { GLTFExporter } from '../../../../examples/jsm/exporters/GLTFExporter.js';

function delay() {

	return new Promise( ( resolve ) => setTimeout( resolve, 1 ) );

}

class AsyncHooksPlugin {

	constructor( writer ) {

		this.writer = writer;
		this.name = 'TEST_async_hooks';
		this.calls = [];

	}

	async beforeParse() {

		await delay();
		this.calls.push( 'beforeParse' );

	}

	async writeMesh( mesh, meshDef ) {

		await delay();
		meshDef.extras = { asyncWriteMesh: true };

	}

	async writeNode( object, nodeDef ) {

		await delay();
		nodeDef.extras = Object.assign( nodeDef.extras || {}, { asyncWriteNode: true } );

	}

	async afterParse() {

		await delay();
		this.writer.json.asset.extras = { asyncAfterParse: true, calls: this.calls };

	}

}

export default QUnit.module( 'Addons', () => {

	QUnit.module( 'Exporters', () => {

		QUnit.module( 'GLTFExporter', () => {

			QUnit.test( 'awaits async plugin hooks', async ( assert ) => {

				const scene = new Object3D();
				scene.add( new Mesh( new BoxGeometry(), new MeshStandardMaterial() ) );

				const exporter = new GLTFExporter();
				exporter.register( ( writer ) => new AsyncHooksPlugin( writer ) );

				const gltf = await exporter.parseAsync( scene, { binary: false } );

				assert.deepEqual( gltf.meshes[ 0 ].extras, { asyncWriteMesh: true }, 'writeMesh finished before the export resolved' );
				assert.ok( gltf.nodes.every( ( node ) => node.extras && node.extras.asyncWriteNode ), 'writeNode finished for every node' );
				assert.deepEqual( gltf.asset.extras, { asyncAfterParse: true, calls: [ 'beforeParse' ] }, 'beforeParse and afterParse finished' );

			} );

		} );

	} );

} );
