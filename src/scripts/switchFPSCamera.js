import * as THREE from "three";
import SimpleFPControls from "three-simple-fp-controls"
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export const switchFPSCamera = () => {
	// const nc = new THREE.PerspectiveCamera(45, 1.2, 1, 1000)

	const camera = new THREE.PerspectiveCamera(20.2622342588375 * 2.2, 2.0146904512067154, 1, 1000);
	camera.position.set(5.881788858184642, 24.23607208170734, -0.02700429975817531)
	// const controls = new SimpleFPControls(camera);
	// controls.movementSpeed = 30;
	// camera.controls = controls
	// //servObj.scene.add(controls.getObject());
	// servObj.scene.setActiveCamera(camera)
	// servObj.scene.activeCamera = camera

	// servObj.fps = controls
	// console.log("--")
	// console.log(controls)


	const controls = new PointerLockControls(camera, servObj.scene.activeRenderer.domElement);
	controls.pointerSpeed = 0.5
	//camera.controls = controls
	servObj.scene.setActiveCamera(camera, true)

	document.addEventListener('keydown', () => {
	    controls.lock();
	});
	document.addEventListener('keyup', () => {
	    controls.unlock();
	});

}