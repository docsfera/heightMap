import './debug_gui.js';
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { loader } from "./loader.js";
import { onResize } from "./resize.js";
import { initRaycaster } from "./raycaster.js";
import { makeCSS2Dannotaition, initCSS2DRenderer, hideInvisibleAnns } from "./annotations.js";
import { animations } from "./animations.js";
import { materials } from "./materials.js";
import { sceneHandler } from "./scene.js";
import { clippingPlanes } from "./clipping_planes.js";
import * as Camera from "./Camera.js";

import { proceduralEnvironmentHandler } from './procedural_envmap.js';
import { EffectComposer, RenderPass } from 'postprocessing';
import { GodraysPass } from 'three-good-godrays';
import Stats from 'stats-js'

import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

// import { Pass } from "three/examples/jsm/postprocessing/Pass.js";
// import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
// import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
// import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
// import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

import SimpleFPControls from "three-simple-fp-controls"
import {switchFPSCamera} from"./switchFPSCamera.js"

import {loadModels} from "./loadModels.js"

import {addMapPlane, addRiverPlane} from "./engine/mapPlane.js"
import {getFragColorPlane, getCameraFragColorPlane, getSceneFragColorPlane, getRenderTarget} from "./engine/displacementPlane.js"
import {getGrass} from "./engine/grass.js"


import MovingController from './engine/MovingController.js';

const container3D = document.querySelector(".d3d-container")
const foreground = document.querySelector(".foreground")

let controls

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	outputColorSpace: THREE.SRGBColorSpace,
    stencil: true,
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;

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

const scene = new THREE.Scene()
servObj.scene = scene
scene.background = new THREE.Color(0xa0d8ef) // Небесно-голубой
scene.fog = new THREE.Fog(0xa0d8ef, 0.02)
const bgFolder = gui.addFolder('Background')
bgFolder.addColor(scene, 'background').onFinishChange((event) => console.log(event.getHexString()))
bgFolder.addColor(scene.fog, 'color').onFinishChange((event) => console.log(event.getHexString()))
bgFolder.add(scene.fog, 'near')
bgFolder.add(scene.fog, 'far')




let activeCamera
scene.setActiveCamera = (camera, isfps = false) => {
	activeCamera = camera
	servObj.activeCamera = activeCamera

	//if(activeCamera.controls) activeCamera.controls.enabled = false

	if(!isfps){
		onResize(scene.activeRenderer, activeCamera, container3D)
		onResize(annRenderer, activeCamera, container3D)
	}
	
}
scene.activeRenderer = renderer
scene.renderer = renderer

const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });

const renderPass = new RenderPass(scene, activeCamera);
renderPass.renderToScreen = false;
composer.addPass(renderPass);

scene.composer = composer


let positionRenderTarget , positionScene, positionCamera, positionMesh

const textureLoader = new THREE.TextureLoader()
const displacement = textureLoader.load('./3d/hh.png') //map7
const mask = textureLoader.load('./3d/mask.png')
const riverPlane = addRiverPlane(scene)

export const sceneLoadPromise = new Promise(function (resolve, reject) {
	loader.loadGLTF("./3d/three_starter.glb", async (gltf) => {
		scene.add(gltf.scene)
		scene.animations = gltf.animations

		console.log(scene, renderer)

		loadModels()

		//Init block
		//proceduralEnvironmentHandler.init(scene, renderer) // нет тени из-заэ того
		animations.initHandler(scene)
		activeCamera = new Camera.Perspective(canvas)
		controls = new OrbitControls(activeCamera, renderer.domElement)
		initRaycaster(scene, activeCamera)
		clippingPlanes.init(scene)
		
		onResize(renderer, activeCamera, container3D)
		onResize(annRenderer, activeCamera, container3D)

		window.addEventListener("resize", () => onResize(scene.activeRenderer, activeCamera, container3D))
		window.addEventListener("resize", () => onResize(annRenderer, activeCamera, container3D))
		
		sceneHandler.init(scene)
		
		resolve()
		
		animate()
		animations.fadeIn()
	})
})

const clock = new THREE.Clock()

const light = new THREE.DirectionalLight(0xfff0dd, 10);
light.position.set(50, 100, 50);
light.castShadow = true;
light.shadow.mapSize.width = 6666
light.shadow.mapSize.height = 6666
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500000000;
light.shadow.camera.left = -300;
light.shadow.camera.right = 300;
light.shadow.camera.top = 300;
light.shadow.camera.bottom = -300;

console.log("_")
console.log(light.shadow.camera)
scene.add(light);

servObj.light = light

const cube = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshStandardMaterial({color: "red"}))
cube.position.set(-49.5, 18, -10)
cube.castShadow = true
cube.receiveShadow = true
scene.add(cube)

const plane = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 100, 100), new THREE.MeshStandardMaterial({color: "gray", side: THREE.DoubleSide}))
plane.position.set(-49.5, 14, 0)
plane.rotation.x = -Math.PI / 2
plane.receiveShadow = true
scene.add(plane)


const lightHelper = new THREE.DirectionalLightHelper(light);
const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
scene.add(lightHelper);
scene.add(shadowHelper);



// Заполняющий свет
//scene.add(new THREE.AmbientLight(0x80a0ff, 0.4))

////////////////// MAP GEOMETRY ////////////

addMapPlane(displacement, mask, scene)

//////////////// FRAGCOLOR PLANE ////////////////////

// Создаем отдельную сцену и камеру для рендера в текстуру
const tt = 1000
const pixels = new Float32Array(tt * tt * 4)
const textureCamera = getCameraFragColorPlane()
const textureScene = getSceneFragColorPlane(displacement)
const renderTarget = getRenderTarget(scene, tt)

setTimeout(() => {
	activeCamera.controls.setLookAt(-55.474687739807365, 27.167925110735894, 41.81928096736683, 10.814844136319213, 18.044455466157817, 3.187493220094487)

    renderer.readRenderTargetPixels(
        renderTarget,
        0, 0, tt, tt,
        pixels
    )

	const grasses = getGrass(mask, pixels, tt, scene)
	scene.add(grasses.grasses)
	scene.add(grasses.grassesLOD)

	gui.add(grasses.position, 'x').min(-20).max(20)
	gui.add(grasses.position, 'z').min(-20).max(20)
}, 1000)

const stats = {
	renderCalls: 0,
	triangles: 0,
	geometries: 0,
	textures: 0,
	color: "#68ac89"
}

const shader = {
	stColor1: "#7ed3b9",
	stColor2: "#6ab9a2",
	stColor3: "#539d87",
	stColor4: "#307e75",
}

gui.add(stats, 'renderCalls').name('Render Calls').listen()
gui.add(stats, 'triangles').name('Triangles').listen()
gui.add(stats, 'geometries').name('Geometries').listen()
gui.add(stats, 'textures').name('Textures').listen()

const upColor = () => {
	scene.getObjectByName("Foliage").material.uniforms.colorMap.value = [
        new THREE.Color(shader.stColor1),
        new THREE.Color(shader.stColor2),
        new THREE.Color(shader.stColor3),
        new THREE.Color(shader.stColor4),
      ]
}

gui.addColor(shader, 'stColor1').onChange((value) => {
    upColor()
})
gui.addColor(shader, 'stColor2').onChange((value) => {
    upColor()
})
gui.addColor(shader, 'stColor3').onChange((value) => {
    upColor()
})
gui.addColor(shader, 'stColor4').onChange((value) => {
    upColor()
})

var stats1 = new Stats()
document.body.appendChild(stats1.dom)

let testuTime = 0
let lastTick


document.addEventListener("keydown", e => {
	if(e.code == "KeyP"){
		switchFPSCamera()
	}
	if(e.code == "KeyC"){
		console.log(activeCamera.fov)
		console.log(activeCamera.aspect)
	}
})

// setTimeout(() => {
// 	console.log("1")
// 	scene.traverse(obj => {
// 		if (obj instanceof THREE.Mesh) {
// 			obj.castShadow = true;
// 			obj.receiveShadow = true;
// 		}
// 		});
// }, 7000)

function animate() {
	testuTime++

	var t = performance.now()
	var delta = t - lastTick

	//oblakoPhi += 0.1

	//if(scene.getObjectByName("oblako")) scene.getObjectByName("oblako").position.setFromSphericalCoords(200, Math.PI/2 - 0.15, oblakoPhi)

	servObj.oblakoMass.map((oblako, i) => {
		servObj.oblakoPhiMass[i][2] += 0.001
		oblako.position.setFromSphericalCoords(servObj.oblakoPhiMass[i][0], servObj.oblakoPhiMass[i][1], servObj.oblakoPhiMass[i][2])
	})	

	stats1.begin()
  
	const deltaTime = clock.getDelta()

	requestAnimationFrame(animate)
	
    //controls.update();
    if(activeCamera.update) activeCamera.update(deltaTime)

	// Очищаем предыдущую статистику
  	renderer.info.reset()

	// Добавить обновление матриц камеры
	activeCamera.updateProjectionMatrix()
	activeCamera.updateMatrixWorld(true)

	animations.update(deltaTime)

	clippingPlanes.update()

	materials.updatableMaterials.forEach(mat => mat.animationUpdate(deltaTime))

	//material.uniforms.uTime.value += 0.01;

	riverPlane.material.uniforms.uTime.value += 0.01

	//if(servObj.light) light.shadow.camera.updateProjectionMatrix();

	renderer.setRenderTarget(renderTarget)
	renderer.render(textureScene, textureCamera)
	renderer.setRenderTarget(null)
	renderer.render(scene, activeCamera)
	// scene.composer.render()
	renderer.setRenderTarget(null)

	if(servObj.grassMaterial){
		servObj.grassMaterial.uniforms.uTime.value = testuTime
	}

	scene.children.map(child => {
		if(child.name == "test") child.rotation.y += 0.01
	})
	//annRenderer.render(scene, activeCamera);

	stats.renderCalls = renderer.info.render.calls
	stats.triangles = renderer.info.render.triangles
	stats.geometries = renderer.info.memory.geometries
	stats.textures = renderer.info.memory.textures

	if (servObj.characterController) {
		servObj.characterController.update(deltaTime, scene);
	}

	stats1.end()

	

	lastTick = t
}

