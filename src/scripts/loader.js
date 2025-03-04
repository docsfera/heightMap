import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { materials } from "./materials.js";
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const textureLoader = new THREE.TextureLoader();
const rgbeLoader = new RGBELoader();
const exrLoader = new EXRLoader();

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(getRootHref() + '/draco/gltf/');
dracoLoader.preload();
gltfLoader.setDRACOLoader( dracoLoader );

export const loader = {
	textureLoader: textureLoader,
	gltfLoader: gltfLoader,
	rgbeLoader: rgbeLoader,
	exrLoader: exrLoader,
	loadGLTF: loadGLTF,
	loadTextures: loadTextures,
	loadedTextures: [],
}

function loadGLTF(path, onLoad) {
	gltfLoader.load(path, (gltf) => {
		gltf.scene.traverse((obj) => {
			if (obj.material) materials.setMaterial(obj);
		});

		if (onLoad) onLoad(gltf);
	});
}

function loadTextures(folderPath, textureNames = [], onLoad) {
	let loadedCount = 0;
	let textures = [];
	textureNames.forEach((fileName) => {
		if (fileName.includes(".hdr") || fileName.includes(".exr")) {
			const imgLoader = fileName.includes(".hdr") ? rgbeLoader : exrLoader;
			imgLoader.load(`${folderPath}/${fileName}`, (texture) => {
				texture.name = fileName;
				texture.mapping = THREE.EquirectangularReflectionMapping;
				textures.push(texture);
				loader.loadedTextures.push(texture);
				loadedCount++;
				if (onLoad && loadedCount == textureNames.length) onLoad(textures);
			});	
		} else {
			textureLoader.load(`${folderPath}/${fileName}`, (texture) => {
				texture.name = fileName;
				// texture.wrapS = THREE.MirroredRepeatWrapping;
				// texture.wrapT = THREE.MirroredRepeatWrapping;
				texture.anisotropy = 4;
				// texture.premultiplyAlpha = true;
				texture.flipY = false;
				texture.colorSpace = THREE.SRGBColorSpace;

				textures.push(texture);
				loader.loadedTextures.push(texture);
				loadedCount++;
				if (onLoad && loadedCount == textureNames.length) onLoad(textures);
			});
		}
	});
}

function getRootHref(href=window.location.href) {
    let loc = window.location;
    let indx = href.indexOf('index');
    let root = href.includes('testing') ? href.slice(0, href.indexOf('testing')) : 
                    href.includes('thing') ? href.slice(0, href.indexOf('thing')):
                    href.slice(0, indx == -1 ? href.length : indx);
    return root.replace(loc.search, '').replace(loc.hash, '');
}