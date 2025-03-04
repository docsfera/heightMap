import { Vector2, Raycaster } from "three";

const raycaster = new Raycaster();

const pointer = new Vector2();

const objects = [];

let camera;

export function initRaycaster(scene, cam) {
	objects.forEach((oName, i) => (objects[i] = scene.getObjectByName(oName)));
	camera = cam;

	container3D.addEventListener("pointermove", onPointerMove);
	container3D.addEventListener("click", onClick);
}

function onPointerMove(event) {
	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

	const intersects = getIntersects();

	servObj.onHover3D.forEach((callback) => callback(intersects));
}

function onClick() {
	const intersects = getIntersects();

	servObj.onClick3D.forEach((callback) => callback(intersects));
}

function getIntersects() {
	raycaster.setFromCamera(pointer, camera);
	const intersects = raycaster.intersectObjects(objects);
	return intersects.length > 0 && intersects;
}
