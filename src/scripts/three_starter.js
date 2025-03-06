import './debug_gui.js';
import * as THREE from "three";
import { loader } from "./loader.js";
import { onResize } from "./resize.js";
import { initRaycaster } from "./raycaster.js";
import { makeCSS2Dannotaition, initCSS2DRenderer, hideInvisibleAnns } from "./annotations.js";
import { animations } from "./animations.js";
import { materials } from "./materials.js";
import { sceneHandler } from "./scene.js";
import { clippingPlanes } from "./clipping_planes.js";
import * as Camera from "./Camera.js";
import { EffectComposer, RenderPass } from "postprocessing";
import { EffectPass } from "postprocessing";
import { N8AOPostPass } from "n8ao";
import { proceduralEnvironmentHandler } from './procedural_envmap.js';

import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import shaderV from './shaders/river/vertex.glsl'
import shaderF from './shaders/river/fragment.glsl'
import waterV from './shaders/water/vertex.glsl'
import waterF from './shaders/water/fragment.glsl'

const container3D = document.querySelector(".d3d-container");
const foreground = document.querySelector(".foreground");

let composer, renderPass, n8aopass;
const renderer = new THREE.WebGLRenderer({
	antialias: true,
	outputColorSpace: THREE.SRGBColorSpace,
    stencil: true,
});
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
const canvas = renderer.domElement;
container3D.appendChild(canvas);
renderer.setSize(container3D.offsetWidth, container3D.offsetHeight);
renderer.localClippingEnabled = true;

window.container3D = container3D;
window.container3D.foreground = foreground;
container3D.foreground.style.opacity = 1;
window.container3D.canvas = canvas;

const annRenderer = initCSS2DRenderer(container3D);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);
scene.fog = new THREE.Fog(new THREE.Color(0xFFFFFF), 30, 90);
const bgFolder = gui.addFolder('Background');
bgFolder.addColor(scene, 'background').onFinishChange((event) => console.log(event.getHexString()));
bgFolder.addColor(scene.fog, 'color').onFinishChange((event) => console.log(event.getHexString()));
bgFolder.add(scene.fog, 'near');
bgFolder.add(scene.fog, 'far');


let activeCamera;
scene.setActiveCamera = (camera) => {
	activeCamera = camera;
	renderPass.camera = activeCamera;
	n8aopass.camera = activeCamera;

	onResize(scene.activeRenderer, activeCamera, container3D);
	onResize(annRenderer, activeCamera, container3D);
};
scene.activeRenderer = renderer;
scene.renderer = renderer;
scene.composer = null;

//scene.fog = new THREE.Fog( 0xcccccc, 1, 1500 );


let plane, flatPlane, material, flatMaterial

export const sceneLoadPromise = new Promise(function (resolve, reject) {
	loader.loadGLTF("./3d/three_starter.glb", async (gltf) => {
		scene.add(gltf.scene);
		scene.animations = gltf.animations;

		console.log(scene, renderer);


		//////////////////



		// const geometry = new THREE.PlaneGeometry();
		// const material = new THREE.MeshStandardMaterial({color: "#ff0000"});


		// const mesh = new THREE.Mesh(geometry, material)

		// scene.add(mesh)

		const width = 200;
        const height = 200;
        const segments = 1024;

        const loader = new THREE.TextureLoader();
        const displacement = loader.load('./3d/map2.jpg');

        const map = loader.load('./3d/tex.png');

        const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, //Red
            map:map,
            //wireframe: true,
            displacementMap: displacement,
            displacementScale: 30
        });

       

        


        const uniforms = {
        	uDisplacementMap: { value: displacement },
            uDisplacementScale: { value: 1.0 },
            uTime: { value: 0.0 },
        }

        material = new CustomShaderMaterial({
	        baseMaterial: baseMaterial,
	        vertexShader: shaderV,
	        fragmentShader: shaderF,
	        uniforms: uniforms,
	    });

	    flatMaterial = new CustomShaderMaterial({
	        baseMaterial: new THREE.MeshStandardMaterial({color: "#A5CDDB", fog: true}),
	        vertexShader: waterV,
	        fragmentShader: waterF,
	        uniforms: {uTime: { value: 0.0 }},
	    });

	    plane = new THREE.Mesh(geometry, material);
	    flatPlane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 2, 2), flatMaterial)

	    //flatPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 2, 2), flatMaterial)

        scene.add(flatPlane)

        
        plane.rotation.x = -Math.PI / 2;
        flatPlane.rotation.x = -Math.PI / 2;

        //flatPlane.position.x = 200

        plane.position.y = 0.1
        flatPlane.position.y = 5
        scene.add(plane);


		/////////////////////

		
		//Init block
		proceduralEnvironmentHandler.init(scene, renderer);
		animations.initHandler(scene);
		activeCamera = new Camera.Perspective(canvas);
		initRaycaster(scene, activeCamera);
		clippingPlanes.init(scene);
		
		onResize(renderer, activeCamera, container3D);
		onResize(annRenderer, activeCamera, container3D);

		window.addEventListener("resize", () => onResize(scene.activeRenderer, activeCamera, container3D));
		window.addEventListener("resize", () => onResize(annRenderer, activeCamera, container3D));
		
		composer = new EffectComposer( renderer, {multisampling: 8, stencilBuffer: true} );
		renderPass = new RenderPass( scene, activeCamera )
		n8aopass = new N8AOPostPass(
			scene,
			activeCamera,
			container3D.offsetWidth, 
			container3D.offsetHeight
		);
		const aoFolder = gui.addFolder('AO');
		n8aopass.configuration.aoRadius = 2.0; 						aoFolder.add(n8aopass.configuration, 'aoRadius');
		n8aopass.configuration.distanceFalloff = 1.0; 				aoFolder.add(n8aopass.configuration, 'distanceFalloff');
		n8aopass.configuration.intensity = 4.0; 					aoFolder.add(n8aopass.configuration, 'intensity');
		n8aopass.configuration.halfRes = false; 					aoFolder.add(n8aopass.configuration, 'halfRes');
		n8aopass.configuration.accumulate = false; 					aoFolder.add(n8aopass.configuration, 'accumulate');
		n8aopass.configuration.color = new THREE.Color(0x000000); 	aoFolder.addColor(n8aopass.configuration, 'color').onFinishChange((event) => console.log(event.getHexString()));
		n8aopass.setQualityMode("Low"); 
	
		composer.addPass(renderPass);
		composer.addPass(n8aopass);
		scene.composer = composer;
		gui.add(scene, 'activeRenderer', {renderer: scene.renderer, composer: scene.composer});
		
		sceneHandler.init(scene);
		
		resolve();
		
		animate();
		animations.fadeIn();
	});
});

const clock = new THREE.Clock();
function animate() {
	const deltaTime = clock.getDelta();

	requestAnimationFrame(animate);

	activeCamera.update(deltaTime);

	animations.update(deltaTime);

	clippingPlanes.update();

	materials.updatableMaterials.forEach(mat => mat.animationUpdate(deltaTime))

	material.uniforms.uTime.value += 0.01;
	flatMaterial.uniforms.uTime.value += 0.01;

	// renderer.render(scene, activeCamera);
	// composer.render();
	scene.activeRenderer.render(scene, activeCamera)

	annRenderer.render(scene, activeCamera);
    // скрыть перекрываемые  аннотации при движении (используется raycaster, сильно тормозит приложение)
    // hideInvisibleAnns(activeCamera, servObj && servObj.annotations)
}

