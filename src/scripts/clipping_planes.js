import * as THREE from "three";
export const clippingPlanes = {
    init: init,
	update: update,
    applyClippingPlanes: applyClippingPlanes,
}

let scene, planeObjects;

function init(incomingScene) {
    scene = incomingScene;
    planeObjects = [];
}

function applyClippingPlanes(clippingPlanes, materials, fillClipped = false) {
	if (!scene.clippingPlanes) scene.clippingPlanes = [];
	scene.clippingPlanes = [...scene.clippingPlanes, ...clippingPlanes];
	const clippingPlanesFolder = gui.addFolder('Clipping Planes');
	clippingPlanes.forEach( (cPlane, index) => {
		const cPlaneFolder = clippingPlanesFolder.addFolder('clipping_plane_' + index);
		cPlaneFolder.addVector(cPlane.normal, 'normal');
		cPlaneFolder.add(cPlane, 'constant');
	} );

	materials.forEach(material => {
		material.clippingPlanes = clippingPlanes;
		material.clipIntersection = true;
		// material.alphaToCoverage = true;
	});

	// planeObjects.forEach(po => {
	// 	if (!po.material.clippingPlanes) po.material.clippingPlanes = [];
	// 	po.material.clippingPlanes = [...po.material.clippingPlanes, ...clippingPlanes]
	// });
    
	if (!fillClipped) return
	scene.traverse(obj => { if (obj.material && materials.some(mat => mat === obj.material) && !obj.isInstancedMesh) SetUpClipPlaneRendering(obj, clippingPlanes, planeObjects) });
}

function SetUpClipPlaneRendering(object, clippingPlanes, planeObjects) {
	const planeGeom = new THREE.PlaneGeometry( 20, 20 );
	for ( let i = 0; i < clippingPlanes.length; i ++ ) {
		const poGroup = new THREE.Group();
		const plane = clippingPlanes[ i ];
		const stencilGroup = createPlaneStencilGroup( object.geometry, plane, i + 1 );
		// plane is clipped by the other clipping planes
		const planeMat =
			new THREE.MeshBasicMaterial( {
				color: 0x800000,
				// metalness: 1,
				// roughness: 1,
				// clippingPlanes: clippingPlanes.filter( p => p !== plane ),

				stencilWrite: true,
				stencilRef: 0,
				stencilFunc: THREE.NotEqualStencilFunc,
				stencilFail: THREE.ReplaceStencilOp,
				stencilZFail: THREE.ReplaceStencilOp,
				stencilZPass: THREE.ReplaceStencilOp,
			} );
		const po = new THREE.Mesh( planeGeom, planeMat );
		po.onAfterRender = function ( renderer ) {
			renderer.clearStencil();
		};
		po.clippingPlane = plane;
		// po.renderOrder = i + 1.1;   
          
		object.add( stencilGroup );
		poGroup.add( po );
		planeObjects.push( po );
		scene.add( poGroup );
}
}
function createPlaneStencilGroup( geometry, plane, renderOrder ) {
	const group = new THREE.Group();
	const baseMat = new THREE.MeshBasicMaterial();
	baseMat.depthWrite = false;
	baseMat.depthTest = false;
	baseMat.colorWrite = false;
	baseMat.stencilWrite = true;
	baseMat.stencilFunc = THREE.AlwaysStencilFunc;

	// back faces
	const mat0 = baseMat.clone();
	mat0.side = THREE.BackSide;
	mat0.clippingPlanes = [ plane ];
	mat0.stencilFail = THREE.IncrementWrapStencilOp;
	mat0.stencilZFail = THREE.IncrementWrapStencilOp;
	mat0.stencilZPass = THREE.IncrementWrapStencilOp;

	const mesh0 = new THREE.Mesh( geometry, mat0 );
	// mesh0.renderOrder = renderOrder;
	group.add( mesh0 );

	// front faces
	const mat1 = baseMat.clone();
	mat1.side = THREE.FrontSide;
	mat1.clippingPlanes = [ plane ];
	mat1.stencilFail = THREE.DecrementWrapStencilOp;
	mat1.stencilZFail = THREE.DecrementWrapStencilOp;
	mat1.stencilZPass = THREE.DecrementWrapStencilOp;

	const mesh1 = new THREE.Mesh( geometry, mat1 );
	// mesh1.renderOrder = renderOrder;

	group.add( mesh1 );

	return group;
}

function update() {
	//update clipped caps
	for ( let i = 0; i < planeObjects.length; i++ ) {
		const po = planeObjects[ i ];
		const plane = po.clippingPlane;
		
		plane.coplanarPoint( po.position );
		po.lookAt(
			po.position.x - plane.normal.x,
			po.position.y - plane.normal.y,
			po.position.z - plane.normal.z,
		);
	}
}