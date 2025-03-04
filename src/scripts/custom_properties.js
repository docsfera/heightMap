import * as THREE from "three";
import { loader } from "./loader";
import { materials } from "./materials";

const customProperties = {
};

export function applyCustomProperties(scene, keyInclusive, customProps = customProperties) {
	Object.keys(customProps).forEach((key) => {
		if (keyInclusive && !key.includes(keyInclusive)) return;
		const object = scene.getObjectByName(key);
		if (!object) return;
		propertiesRecursive(object, customProps[key]);
	});
}

function propertiesRecursive(obj, customProps) {
	Object.keys(customProps).forEach((key) => {
		if (key == "material") {
			if (customProps.material.isUnique) {
				obj.material = obj.material.clone();
				console.log(obj.material);
				
				materials.list.push(obj.material);
			}
			propertiesRecursive(obj.material, customProps.material);
			return;
		}
		if (key == "parent") {
			const parent = obj.parent.getObjectByName(customProps[key]);
			parent.attach(obj);
			return;
		}
		if (key.includes("map") || (key.includes("Map") && /Map$/.test(key))) {
			obj[key] = loader.loadedTextures.find(texture => texture.name === customProps[key]);
			return;
		}

		obj[key] = customProps[key];
	});
}
