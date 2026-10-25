import { BufferGeometry, Float32BufferAttribute, Vector2, Vector3 } from 'three';
import { SVGLoader } from '../../../../examples/jsm/loaders/SVGLoader.js';

function createStroke( lineCap ) {

	const points = [ new Vector2( 0, 0 ), new Vector2( 10, 0 ) ];
	const style = SVGLoader.getStrokeStyle( 2, 'black', 'miter', lineCap, 4 );

	return SVGLoader.pointsToStroke( points, style );

}

function getSideWallLength( geometry ) {

	const position = geometry.getAttribute( 'position' );
	const sides = geometry.groups[ 1 ];

	let length = 0;

	for ( let i = sides.start; i < sides.start + sides.count; i += 6 ) {

		length += Math.hypot( position.getX( i + 1 ) - position.getX( i ), position.getY( i + 1 ) - position.getY( i ) );

	}

	return length;

}

export default QUnit.module( 'Addons', () => {

	QUnit.module( 'Loaders', () => {

		QUnit.module( 'SVGLoader', () => {

			QUnit.test( 'extrudeStroke', ( assert ) => {

				const geometry = SVGLoader.extrudeStroke( createStroke( 'butt' ), { depth: 3 } );

				// a 10 x 2 rectangle: 2 triangles for the back face, 2 for the front face, 4 side walls of 2 triangles

				assert.strictEqual( geometry.getAttribute( 'position' ).count, 36, 'vertex count' );
				assert.deepEqual( geometry.groups, [ { start: 0, count: 12, materialIndex: 0 }, { start: 12, count: 24, materialIndex: 1 } ], 'groups' );

				geometry.computeBoundingBox();
				assert.ok( geometry.boundingBox.min.equals( new Vector3( 0, - 1, 0 ) ) && geometry.boundingBox.max.equals( new Vector3( 10, 1, 3 ) ), 'extruded along +z' );

				const position = geometry.getAttribute( 'position' );
				const normal = geometry.getAttribute( 'normal' );
				const center = new Vector3( 5, 0, 1.5 );
				const point = new Vector3();
				const direction = new Vector3();
				let outwards = true;

				for ( let i = 0; i < position.count; i ++ ) {

					point.fromBufferAttribute( position, i );
					direction.fromBufferAttribute( normal, i );
					if ( direction.dot( point.sub( center ) ) <= 0 ) outwards = false;

				}

				assert.ok( outwards, 'all faces point outwards' );

			} );

			QUnit.test( 'extrudeStroke steps and uvs', ( assert ) => {

				const geometry = SVGLoader.extrudeStroke( createStroke( 'butt' ), { depth: 3, steps: 3 } );
				const uv = geometry.getAttribute( 'uv' );
				const sides = geometry.groups[ 1 ];

				assert.strictEqual( sides.count, 4 * 3 * 6, 'side walls are subdivided' );

				const vs = new Set();
				for ( let i = sides.start; i < sides.start + sides.count; i ++ ) vs.add( Math.round( uv.getY( i ) * 1e5 ) / 1e5 );
				assert.deepEqual( [ ...vs ].sort( ( a, b ) => a - b ), [ 0, 0.33333, 0.66667, 1 ], 'side wall v follows the depth' );

			} );

			QUnit.test( 'extrudeStroke builds side walls on the outline only', ( assert ) => {

				// the end edges under the round caps are not on the outline

				const round = SVGLoader.extrudeStroke( createStroke( 'round' ), { depth: 1 } );
				const capOutline = 12 * 2 * Math.sin( Math.PI / 24 ); // half circle of radius 1 with 12 arc divisions

				assert.ok( Math.abs( getSideWallLength( round ) - ( 20 + 2 * capOutline ) ) < 1e-4, 'round caps' );

				const square = SVGLoader.extrudeStroke( createStroke( 'square' ), { depth: 1 } );

				assert.ok( Math.abs( getSideWallLength( square ) - 28 ) < 1e-4, 'square caps' );

			} );

			QUnit.test( 'extrudeStroke with an indexed geometry', ( assert ) => {

				const geometry = new BufferGeometry();
				geometry.setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0 ], 3 ) );
				geometry.setIndex( [ 0, 1, 2, 0, 2, 3 ] );

				const extruded = SVGLoader.extrudeStroke( geometry );

				assert.strictEqual( extruded.getAttribute( 'position' ).count, 36, 'vertex count' );
				assert.strictEqual( extruded.getAttribute( 'uv' ), undefined, 'no uv attribute without uvs in the input' );

			} );

		} );

	} );

} );
