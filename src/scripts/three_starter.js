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

const light = new THREE.DirectionalLight(0xfff0dd, 5);
light.color = new THREE.Color(1.0, 0.95, 0.9)
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




const godRayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
        tColor: { value: null },
        tDepth: { value: null },
        lightPos: { value: new THREE.Vector2(0.5, 0.7) },
        cameraNear: { value: 1 },
        cameraFar: { value: 1000 },
        density: { value: 0.85 },    // Уменьшено для мягкости
        decay: { value: 0.97 },      // Увеличено для более длинных лучей
        weight: { value: 0.15 },     // Оптимально для мягкости
        exposure: { value: 0.5 },    // Значительно уменьшено
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform vec2 lightPos;
        uniform vec2 resolution;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform float density;
        uniform float decay;
        uniform float weight;
        uniform float exposure;
        
        varying vec2 vUv;
        
        #include <packing>
        
        const int NUM_SAMPLES = 350; // Увеличено для сглаживания
        
        float readDepth(sampler2D depthSampler, vec2 coord) {
            float fragCoordZ = texture2D(depthSampler, coord).x;
            float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
            return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
        }
        
        // Функция плавного перехода
        float smoothEdge(float depth, float threshold) {
            float edge = 0.01; // Ширина перехода
            return smoothstep(threshold - edge, threshold + edge, depth);
        }
        
        void main() {
            vec4 color = texture2D(tColor, vUv);
            
            // Вектор от пикселя к свету
            vec2 toLight = lightPos - vUv;
            float distToLight = length(toLight);
            vec2 dirToLight = toLight / distToLight;
            
            // Размер шага с учетом разрешения
            float stepSize = distToLight / float(NUM_SAMPLES);
            vec2 delta = dirToLight * stepSize;
            
            vec2 currentPos = vUv;
            float illuminationDecay = 1.0;
            vec3 accumulatedLight = vec3(0.0);
            
            // Плавное ray marching
            for(int i = 0; i < NUM_SAMPLES; i++) {
                currentPos += delta;
                
                // Проверка выхода за границы экрана
                if (currentPos.x < 0.0 || currentPos.x > 1.0 || currentPos.y < 0.0 || currentPos.y > 1.0) {
                    break;
                }
                
                // Чтение глубины с плавным переходом
                float depth = readDepth(tDepth, currentPos);
                float visibility = smoothEdge(depth, 0.99); // Плавный переход
                
                // Если точка видима (фон)
                if (visibility > 0.0) {
                    vec4 sampleColor = texture2D(tColor, currentPos);
                    
                    // Учет расстояния для затухания
                    float distanceFactor = 1.0 - (float(i) / float(NUM_SAMPLES));
                    
                    // Накопление света с плавным затуханием
                    accumulatedLight += sampleColor.rgb * illuminationDecay * weight * visibility * distanceFactor;
                }
                
                // Экспоненциальное затухание
                illuminationDecay *= decay;
            }
            
            // Смешивание с оригинальным цветом
            color.rgb += accumulatedLight * exposure * density;
            
            // Тонирование в теплый цвет
            vec3 warmColor = vec3(1.0, 0.9, 0.7);
            color.rgb *= mix(vec3(1.0), warmColor, accumulatedLight.r * 0.5);
            
            gl_FragColor = color;
        }
    `
});

const depthVisualizationMaterial = new THREE.ShaderMaterial({
	uniforms: {
        tDepth: { value: null },
        cameraNear: { value: 10 },
        cameraFar: { value: 1000 }
    },
	vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDepth;
        uniform float cameraNear;
        uniform float cameraFar;
        varying vec2 vUv;
        
        #include <packing>
        
        float linearizeDepth(float depth) {
            float viewZ = perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
            return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
        }
        
        void main() {
            float depth = texture2D(tDepth, vUv).x;
            float linearDepth = linearizeDepth(depth);
            gl_FragColor = vec4(vec3(linearDepth), 1.0);
        }
    `
})



const depthQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    depthVisualizationMaterial
);
const depthVisualizationScene = new THREE.Scene();
depthVisualizationScene.add(depthQuad);


// Создаем плоскость для полностраничного эффекта
const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    godRayMaterial
);
const godRayScene = new THREE.Scene();
godRayScene.add(quad);

// Рендер-таргет
const depthTarget  = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
depthTarget .depthTexture = new THREE.DepthTexture();
depthTarget .depthTexture.type = THREE.UnsignedShortType; // или UnsignedIntType
depthTarget .texture.format = THREE.RGBAFormat;

// 1. Создаем текстуру для рендеринга цвета и глубины
const colorTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    { 
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
    }
);

function updateLightPosition() {
    const lightPos = light.position.clone();
    lightPos.project(activeCamera);
    
    // Преобразуем из [-1,1] в [0,1]
    godRayMaterial.uniforms.lightPos.value.set(
        (lightPos.x + 1) / 2,
        (lightPos.y + 1) / 2
    );
}


let changeRenderTarget = true

document.addEventListener("keydown", e => {
	if(e.code == "KeyU") changeRenderTarget = !changeRenderTarget
})


const godRayFolder = gui.addFolder('God Rays');
godRayFolder.add(godRayMaterial.uniforms.density, 'value', 0.0, 1.0).name('Density');
godRayFolder.add(godRayMaterial.uniforms.exposure, 'value', 0.1, 5.0).name('Exposure');
godRayFolder.add(godRayMaterial.uniforms.weight, 'value', 0.0, 1.0).name('Weight');
godRayFolder.add(godRayMaterial.uniforms.decay, 'value', 0.0, 0.99).name('Decay');
console.log(light)
godRayFolder.add(light, 'intensity', 0.0, 10).name('intensity');

const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Вспомогательная функция для сбора статистики
    function renderWithStats(scene, camera, target = null) {
        
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        
        return {
            calls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles
        };
    }

function animate() {
	testuTime++

	// Создаем объект для сбора статистики за кадр
    const frameStats = {
        calls: 0,
        triangles: 0,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures
    };

	var t = performance.now()
	var delta = t - lastTick

	if(activeCamera){
		godRayMaterial.uniforms.cameraNear.value = activeCamera.near;
    	godRayMaterial.uniforms.cameraFar.value = activeCamera.far;
	}

	

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

	// Рендерим основную сцену в цветовой буфер

	// 1. Сохраняем предыдущую статистику
    const prevCalls = renderer.info.render.calls;
    const prevTriangles = renderer.info.render.triangles;

     // 1. Рендерим основную сцену в цветовой буфер с измерением статистики
    if (!changeRenderTarget) {
        const colorStats = renderWithStats(scene, activeCamera, colorTarget);
        frameStats.calls += colorStats.calls;
        frameStats.triangles += colorStats.triangles;
    }

    // 2. Рендерим глубину с измерением статистики
    if (!changeRenderTarget) {
        const depthStats = renderWithStats(scene, activeCamera, depthTarget);
        frameStats.calls += depthStats.calls;
        frameStats.triangles += depthStats.triangles;
    }

    // 3. Обновляем позицию света
    const lightScreenPos = light.position.clone();
    lightScreenPos.project(activeCamera);
    godRayMaterial.uniforms.lightPos.value.set(
        (lightScreenPos.x + 1) / 2,
        (lightScreenPos.y + 1) / 2
    );

    // 4. Рендерим эффект god rays с измерением статистики
    if (!changeRenderTarget) {
        godRayMaterial.uniforms.tDepth.value = depthTarget.texture;
        godRayMaterial.uniforms.tColor.value = colorTarget.texture;
        
        const godRayStats = renderWithStats(godRayScene, orthoCamera, null);
        frameStats.calls += godRayStats.calls;
        frameStats.triangles += godRayStats.triangles;
    }

    // 5. Рендерим основную сцену (если включен режим)
    if (changeRenderTarget) {
        const mainStats = renderWithStats(scene, activeCamera, null);
        frameStats.calls += mainStats.calls;
        frameStats.triangles += mainStats.triangles;
    }

    // 6. Рендерим визуализацию глубины
    depthVisualizationMaterial.uniforms.tDepth.value = depthTarget.depthTexture;
    const depthVizStats = renderWithStats(depthVisualizationScene, activeCamera, null);
    frameStats.calls += depthVizStats.calls;
    frameStats.triangles += depthVizStats.triangles;

    // 7. Рендерим сцену для травы
    renderer.setRenderTarget(renderTarget);
    renderer.render(textureScene, textureCamera);
    renderer.setRenderTarget(null);
    
    // 8. Обновляем статистику
    stats.renderCalls = frameStats.calls;
    stats.triangles = frameStats.triangles;
    stats.geometries = renderer.info.memory.geometries;
    stats.textures = renderer.info.memory.textures;

	if(servObj.grassMaterial){
		servObj.grassMaterial.uniforms.uTime.value = testuTime
	}

	scene.children.map(child => {
		if(child.name == "test") child.rotation.y += 0.01
	})
	//annRenderer.render(scene, activeCamera);

	if (servObj.characterController) {
		servObj.characterController.update(deltaTime, scene);
	}

	stats1.end()

	depthVisualizationMaterial.uniforms.tDepth.value = depthTarget.depthTexture;
// 	depthVisualizationMaterial.uniforms.cameraNear.value = activeCamera.near;
// depthVisualizationMaterial.uniforms.cameraFar.value = activeCamera.far;	

	

	lastTick = t
}

