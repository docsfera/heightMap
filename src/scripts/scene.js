//НАПИСАТЬ УНИВЕРСАЛЬНУЮ ПРОГРЕССИВНУЮ ЗАГРУЗКУ
import * as THREE from "three";
import * as Camera from "./Camera.js";
import { loader } from "./loader.js";
import { sceneLoadPromise } from "./three_starter.js";
// import { createPoints } from "./points.js";
// import { createFloatingPointsMaterial } from "./floating_points.js";
import { materials } from "./materials.js";

export const sceneHandler = {
    init: init,
}

let scene;

// loader.loadTextures('./textures', [ 'interior.exr' ], async (textures) => {
//     await sceneLoadPromise;
// 	// scene.environment = textures[0];
    
// 	const envFolder = gui.addFolder('Environment')
//     envFolder.add(scene, 'environment', textures);
//     envFolder.add(scene, 'environmentIntensity', 0, 10);
//     envFolder.addVector(scene.environmentRotation, 'environmentRotation');
// });

function init(incomingScene) {
    scene = incomingScene;
    //scene.background = new THREE.Color(0xFFFFFF);

    setUpCameraFromImported("camera", "camera_target");

	//TMP
	// scene.getObjectByName('suzanne').visible = false;
	// const floatingPointsMaterial = createFloatingPointsMaterial(scene.getObjectByName('curve').geometry)
	// createPoints(scene, 10000, floatingPointsMaterial);

	gui.addMaterial(materials.getMaterial('material'));
}

function setUpCameraFromImported(importedCameraName, importedCameraTargetName) {
	const importedCamera = scene.getObjectByName(importedCameraName);
	const importedCameraTarget = scene.getObjectByName(importedCameraTargetName);

	const camera = new Camera.Perspective(
		container3D.canvas,
		importedCamera.fov,
		importedCamera.aspect
	);
	camera.name = importedCamera.name;
	camera.controls.setLookAt(
		importedCamera.position.x,
		importedCamera.position.y,
		importedCamera.position.z,
		importedCameraTarget.position.x,
		importedCameraTarget.position.y,
		importedCameraTarget.position.z
	);

    scene.setActiveCamera(camera);
}