import './debug_gui.js';
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
//THREE.PlaneBufferGeometry = THREE.PlaneGeometry
import { loader } from "./loader.js";
import { onResize } from "./resize.js";
import { initRaycaster } from "./raycaster.js";
import { makeCSS2Dannotaition, initCSS2DRenderer, hideInvisibleAnns } from "./annotations.js";
import { animations } from "./animations.js";
import { materials } from "./materials.js";
import { sceneHandler } from "./scene.js";
import { clippingPlanes } from "./clipping_planes.js";
import * as Camera from "./Camera.js";
//import { EffectComposer, RenderPass } from "postprocessing";
import { EffectPass } from "postprocessing";
import { N8AOPostPass } from "n8ao";
import { proceduralEnvironmentHandler } from './procedural_envmap.js';

import Stats from 'stats-js'

//import { RenderPass, EffectComposer, OutlinePass } from "three-outlinepass"
//import "./OutlinePass.js"

import { InstancedMesh2 } from '@three.ez/instanced-mesh';
//import { GPUComputationRenderer } from 'gpucomputationrender-three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import shaderV from './shaders/river/vertex.glsl'
import shaderF from './shaders/river/fragment.glsl'
import waterV from './shaders/water/vertex.glsl'
import waterF from './shaders/water/fragment.glsl'
import landF from './shaders/gpgpu/landF.glsl'
import landV from './shaders/gpgpu/landV.glsl'
import vv from './shaders/gpgpu/vv.glsl'
import gpgpuParticlesShader from './shaders/gpgpu/particles.glsl'


import { Pass } from "three/examples/jsm/postprocessing/Pass.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

import { CustomOutlinePass } from "./CustomOutlinePass.js";
import FindSurfaces from "./FindSurfaces.js";

const container3D = document.querySelector(".d3d-container");
const foreground = document.querySelector(".foreground");

let composer
let controls
//let composer, renderPass, n8aopass;
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
scene.background = new THREE.Color(0xa0d8ef); // Небесно-голубой
scene.fog = new THREE.Fog(0xa0d8ef, 0.02);
const bgFolder = gui.addFolder('Background');
bgFolder.addColor(scene, 'background').onFinishChange((event) => console.log(event.getHexString()));
bgFolder.addColor(scene.fog, 'color').onFinishChange((event) => console.log(event.getHexString()));
bgFolder.add(scene.fog, 'near');
bgFolder.add(scene.fog, 'far');


let activeCamera;
scene.setActiveCamera = (camera) => {
	activeCamera = camera;
	// renderPass.camera = activeCamera;
	// n8aopass.camera = activeCamera;

	onResize(scene.activeRenderer, activeCamera, container3D);
	onResize(annRenderer, activeCamera, container3D);
};
scene.activeRenderer = renderer;
scene.renderer = renderer;
scene.composer = null;

// composer = new THREE.EffectComposer( renderer );

// var renderPass = new RenderPass( scene, camera );
// composer.addPass( renderPass );

//scene.fog = new THREE.Fog( 0xcccccc, 1, 1500 );


let mapPlane, riverPlane, riverMaterial

let positionRenderTarget , positionScene, positionCamera, positionMesh


class InstancedFloat16BufferAttribute extends THREE.InstancedBufferAttribute {

	constructor( array, itemSize, normalized, meshPerAttribute = 1 ) {

		super( new Uint16Array( array ), itemSize, normalized, meshPerAttribute );

		this.isFloat16BufferAttribute = true;
	}
};

const textureLoader = new THREE.TextureLoader()
//const displacement = textureLoader.load('./3d/map2.jpg')
const displacement = textureLoader.load('./3d/lod.png')
const map = textureLoader.load('./3d/tex2.jpg')

const mapPlaneWidth = 200
const mapPlaneHeight = 200
const mapPlaneSegments = 400
const mapPlaneDisplacementScale = 20
const riverPlaneSegments = 2

const fragColorPlaneWidth = 200
const fragColorPlaneHeight = 200
const fragColorPlaneSegments = 1000//mapPlaneSegments//mapPlaneSegments

const fragColorPlaneDisplacementScale = 30
const textureScaleZ = 0.4//0.6

const grassCount = 400000

export const sceneLoadPromise = new Promise(function (resolve, reject) {
	loader.loadGLTF("./3d/three_starter.glb", async (gltf) => {
		scene.add(gltf.scene);
		scene.animations = gltf.animations;

		console.log(scene, renderer);


		

        /// UPDATE VERTEX HEIGHT ////

  //       const positionMaterial = new CustomShaderMaterial({
  //       	baseMaterial: mapPlaneMaterial,
		//     vertexShader: `
		//         varying vec4 vWorldPosition;
		//         void main() {
		//             // Сохраняем мировую позицию вершины
		//             vWorldPosition = modelMatrix * vec4(position, 1.0);
		//             gl_Position = projectionMatrix * viewMatrix * vWorldPosition;
		//         }
		//     `,
		//     fragmentShader: `
		//         varying vec4 vWorldPosition;
		//         void main() {
		//             // Записываем позицию в RGBA-текстуру (нормализованную)
		//             gl_FragColor = vec4(vWorldPosition.xyz / 100.0, 1.0); 
		//         }
		//     `
		// })

		// positionRenderTarget  = new THREE.WebGLRenderTarget(1024, 1024, {
		//     type: THREE.FloatType,
		//     format: THREE.RGBAFormat
		// })

		// //Создаем сцену и камеру для рендера позиций
		// positionScene = new THREE.Scene()
		// positionCamera = new THREE.PerspectiveCamera( 45, 1.2, 1, 1000 )//activeCamera.clone(); // Используем ту же камеру
		// positionMesh = mapPlane.clone() // Копируем меш
		// positionMesh.material = positionMaterial
		// positionScene.add(positionMesh)


        // const mapPlaneVertexPositions = mapPlaneGeometry.attributes.position.array;

        // console.log({mapPlaneVertexPositions})

  //       for (let i = 0; i < mapPlaneVertexPositions.length; i += 3) {
		// 	const geometry = new THREE.BoxGeometry( 1, 1, 1 )
		// 	const material = new THREE.MeshBasicMaterial({color: 0x00ff00})
		// 	const cube = new THREE.Mesh(geometry, material)
		// 	//scene.add( cube );
		// 	cube.position.x = mapPlaneVertexPositions[i]
		// 	cube.position.z = mapPlaneVertexPositions[i+1]
		// 	cube.position.y = mapPlaneVertexPositions[i+2]
		// }


		/////////////////////

		scene.getObjectByName("suzanne").visible = true
		scene.getObjectByName("curve").visible = false
		scene.getObjectByName("cube").visible = false
		scene.getObjectByName("sphere").visible = false
		scene.getObjectByName("slim_cube").visible = false
		scene.getObjectByName("floor").visible = false


		





		/////////////////////

		
		//Init block
		proceduralEnvironmentHandler.init(scene, renderer); // нет тени из-заэ того
		animations.initHandler(scene);
		activeCamera = new Camera.Perspective(canvas);
		controls = new OrbitControls(activeCamera, renderer.domElement)
		initRaycaster(scene, activeCamera);
		clippingPlanes.init(scene);
		
		onResize(renderer, activeCamera, container3D);
		onResize(annRenderer, activeCamera, container3D);

		window.addEventListener("resize", () => onResize(scene.activeRenderer, activeCamera, container3D));
		window.addEventListener("resize", () => onResize(annRenderer, activeCamera, container3D));
		
		
		// renderPass = new RenderPass( scene, activeCamera )
		// n8aopass = new N8AOPostPass(
		// 	scene,
		// 	activeCamera,
		// 	container3D.offsetWidth, 
		// 	container3D.offsetHeight
		// );
		// const aoFolder = gui.addFolder('AO');
		// n8aopass.configuration.aoRadius = 2.0; 						aoFolder.add(n8aopass.configuration, 'aoRadius');
		// n8aopass.configuration.distanceFalloff = 1.0; 				aoFolder.add(n8aopass.configuration, 'distanceFalloff');
		// n8aopass.configuration.intensity = 4.0; 					aoFolder.add(n8aopass.configuration, 'intensity');
		// n8aopass.configuration.halfRes = false; 					aoFolder.add(n8aopass.configuration, 'halfRes');
		// n8aopass.configuration.accumulate = false; 					aoFolder.add(n8aopass.configuration, 'accumulate');
		// n8aopass.configuration.color = new THREE.Color(0x000000); 	aoFolder.addColor(n8aopass.configuration, 'color').onFinishChange((event) => console.log(event.getHexString()));
		// n8aopass.setQualityMode("Low"); 
	
		// composer.addPass(renderPass);
		// composer.addPass(n8aopass);
		// scene.composer = composer;
		// gui.add(scene, 'activeRenderer', {renderer: scene.renderer, composer: scene.composer});



		//////// COMPOSER /////////
		// Initial render pass.

		const testCube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({color: "blue"}))
		scene.add(testCube)
		testCube.position.z = 4
		testCube.position.y = 20

		const depthTexture = new THREE.DepthTexture();
		const renderTarget1 = new THREE.WebGLRenderTarget(
		  window.innerWidth,
		  window.innerHeight,
		  {
		    depthTexture: depthTexture,
		    depthBuffer: true,
		  }
		);

		composer = new EffectComposer(renderer, renderTarget1);
		activeCamera.position.z = 5
		const pass = new RenderPass(scene, activeCamera);
		pass.camera = activeCamera
		composer.addPass(pass);

		console.log({activeCamera})

		// Outline pass.
		const customOutline = new OutlinePass(
		  new THREE.Vector2(window.innerWidth, window.innerHeight),
		  scene,
		  activeCamera
		);
		composer.addPass(customOutline);

		// Antialias pass.
		const effectFXAA = new ShaderPass(FXAAShader);
		effectFXAA.uniforms["resolution"].value.set(
		  1 / window.innerWidth,
		  1 / window.innerHeight
		);
		composer.addPass(effectFXAA);

		// const surfaceFinder = new FindSurfaces();

		// surfaceFinder.surfaceId = 0;

		

		// const colorsTypedArray = surfaceFinder.getSurfaceIdAttribute(testCube);
		// console.log({colorsTypedArray})
	 // //      scene.getObjectByName("suzanne").geometry.setAttribute(
	 // //        "color",
	 // //        new THREE.BufferAttribute(colorsTypedArray, 4)
	 // //      );

	 // //     customOutline.updateMaxSurfaceId(surfaceFinder.surfaceId + 1);

		// testCube.geometry.setAttribute(
	 //        "color",
	 //        new THREE.BufferAttribute(colorsTypedArray, 4)
	 //    )

	 //    customOutline.updateMaxSurfaceId(1)

	 //    console.log({g: testCube.geometry})

	 //    // customOutline.selectedObjects = [testCube]
	 //    // pass.selectedObjects = [testCube]

	 //    console.log({customOutline})


	 customOutline.selectedObjects = [testCube]

	 // 	testCube.layers.set(1);
		// // Настройте камеру и пасс для рендера этого слоя:
		// activeCamera.layers.set(1);
		// customOutline.renderToScreen = true;






	     ////////////////////////////////////////////
		
		sceneHandler.init(scene)
		
		resolve()
		
		animate()
		animations.fadeIn()
	});
});

const clock = new THREE.Clock();

const light = new THREE.DirectionalLight(0xfff0dd, 9);
light.position.set(10, 20, 10);
light.castShadow = true;
scene.add(light);

// Заполняющий свет
scene.add(new THREE.AmbientLight(0x80a0ff, 0.4));

// renderer.toneMapping = THREE.ReinhardToneMapping;
// renderer.toneMappingExposure = 1.2;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;


////////////////// MAP GEOMETRY ////////////

		

        

        const mapPlaneGeometry = new THREE.PlaneGeometry(mapPlaneWidth, mapPlaneHeight, mapPlaneSegments, mapPlaneSegments)
        const mapPlaneMaterial = new THREE.MeshStandardMaterial({ 
            //color: "#ffffff",//"#339966",
            map:map,
            //wireframe: true,
            displacementMap: displacement,
            displacementScale: mapPlaneDisplacementScale,
            //displacementBias: 1
        })

        // const uniforms = {
        // 	uDisplacementMap: { value: displacement },
        //     uDisplacementScale: { value: 1.0 },
        //     uTime: { value: 0.0 },
        // }

     //    mapPlaneMaterial = new CustomShaderMaterial({
	    //     baseMaterial: baseMaterial,
	    //     vertexShader: shaderV,
	    //     fragmentShader: shaderF,
	    //     uniforms: uniforms,
	    //     onBeforeCompile: (shader) => {console.log({shader})}
	    // });

	    // riverMaterial = new THREE.MeshStandardMaterial({ 
     //        color: 0x00ffff, //Red
     //    })

	    riverMaterial = new THREE.ShaderMaterial({
	    	uniforms: THREE.UniformsUtils.merge( [
				THREE.UniformsLib[ 'fog' ], {
					uTime: {value: 0.0}
				}
      		]),
	    	vertexShader: waterV,
	    	fragmentShader: waterF,
	        fog: true,
	    })

	    mapPlane = new THREE.Mesh(mapPlaneGeometry, mapPlaneMaterial)
	    riverPlane = new THREE.Mesh(new THREE.PlaneGeometry(mapPlaneWidth, mapPlaneHeight, riverPlaneSegments, riverPlaneSegments), riverMaterial)

        mapPlane.rotation.x = -Math.PI / 2
        riverPlane.rotation.x = -Math.PI / 2

        mapPlane.position.y = 0.1
        riverPlane.position.y = 2

        scene.add(mapPlane)
        scene.add(riverPlane)

///////// GPGPU ///////////////

		// const baseGeometry = {}
		// baseGeometry.instance = new THREE.SphereGeometry(3)
		// baseGeometry.count = baseGeometry.instance.attributes.position.count

		// const particles = {}
		// particles.material = new THREE.PointsMaterial( { color: 0x888888 } )
		// particles.points = new THREE.Points(baseGeometry.instance, particles.material)
		// scene.add(particles.points)

		// const gpgpu = {}
		// gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count))
		// console.log(gpgpu.size)
		// gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

		// const baseParticlesTexture = gpgpu.computation.createTexture()
		
		



		// for(let i = 0; i < baseGeometry.count; i++)
		// {
		//     const i3 = i * 3
		//     const i4 = i * 4

		//     // Position based on geometry
		//     baseParticlesTexture.image.data[i4 + 0] = baseGeometry.instance.attributes.position.array[i3 + 0]
		//     baseParticlesTexture.image.data[i4 + 1] = baseGeometry.instance.attributes.position.array[i3 + 1]
		//     baseParticlesTexture.image.data[i4 + 2] = baseGeometry.instance.attributes.position.array[i3 + 2]
		//     baseParticlesTexture.image.data[i4 + 3] = 0
		// }

		// // AFTER FILLING baseParticlesTexture !!!!!!!!

		// gpgpu.particlesVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticlesShader, baseParticlesTexture)
		// gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [ gpgpu.particlesVariable ])
		// gpgpu.computation.init()

		// gpgpu.debug = new THREE.Mesh(
		//     new THREE.PlaneGeometry(3, 3),
		//     new THREE.MeshBasicMaterial({ map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture })
		// )
		// gpgpu.debug.position.x = 3
		// scene.add(gpgpu.debug)


	////////////////////////////////////





//////////////// FRAGCOLOR PLANE ////////////////////




const fragColorPlaneGeometry = new THREE.PlaneGeometry(fragColorPlaneWidth, fragColorPlaneHeight, fragColorPlaneSegments, fragColorPlaneSegments)

// const fragColorPlaneBaseMaterial = new THREE.MeshStandardMaterial({ 
//     color: 0xffffff,
//     displacementMap: displacement,
//     displacementScale: fragColorPlaneDisplacementScale,
//     //wireframe: true
// })

const fragColorPlaneMaterialUniforms = {
    uDisplacementMap: { value: displacement },
    uDisplacementScale: { value: 50.0 },
    uTime: { value: 0.0 },
}

// const fragColorPlaneMaterial = new CustomShaderMaterial({
// 	baseMaterial: fragColorPlaneBaseMaterial,
// 	vertexShader: landV,
// 	fragmentShader: landF,
// 	uniforms: uniforms1,
// })

const fragColorPlaneMaterial = new THREE.ShaderMaterial({
	vertexShader: landV,
	fragmentShader: landF,
	uniforms: fragColorPlaneMaterialUniforms,
})

const fragColorPlane = new THREE.Mesh(fragColorPlaneGeometry, fragColorPlaneMaterial)
fragColorPlane.rotation.x = -Math.PI / 2
fragColorPlane.position.y = 0.1
//scene.add(fragColorPlane) // plane with fragcolor


  //       const gpgpu1 = {}
		// gpgpu1.size = Math.ceil(Math.sqrt(geometry1.attributes.position.count))
		// console.log({sssss: gpgpu1.size})
		// gpgpu1.computation = new GPUComputationRenderer(gpgpu1.size, gpgpu1.size, renderer)

		// const myFilter2 = gpgpu1.computation.createShaderMaterial( landF, { theTexture: { value: null } } );


		

		// gpgpu1.computation.init()

// 		console.log({inputTexture})





///////////////




// Параметры:
const tt = 1000
const renderTargetWidth = tt
const renderTargetHeight = tt

const planePositionsSize = 5

const options = {
	type: THREE.FloatType
  // format: THREE.RGBAFormat,    // Формат данных
  // type: THREE.FloatType,       // Тип данных (для HDR)
  // minFilter: THREE.LinearFilter,
  // magFilter: THREE.LinearFilter,
  // stencilBuffer: false
};

// Создаем отдельную сцену и камеру для рендера в текстуру
const textureScene = new THREE.Scene()
const wh = 200
const textureCamera = new THREE.OrthographicCamera( wh / - 2, wh / 2, wh / 2, wh / - 2, 1, 1000 )

const fragColorPlaneClone = fragColorPlane.clone()
fragColorPlaneClone.rotation.z = -Math.PI / 2
textureScene.add(fragColorPlaneClone)

// Позиционируем камеру
textureCamera.position.y = 100
textureCamera.lookAt(0,0,0)

const renderTarget = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, options)

// Создаем материал с полученной текстурой
const planePositionsMaterial = new THREE.MeshBasicMaterial({
  map: renderTarget.texture
});

// Применяем к объекту в основной сцене
const planePositions = new THREE.Mesh(
  new THREE.PlaneGeometry(planePositionsSize, planePositionsSize),
  planePositionsMaterial
);
planePositions.position.z = -0.1
scene.add(planePositions) // renderTarget Plnae

console.log({tex: renderTarget.texture})

/////////////// READ FROM TEXTURE ///////////////////

const pixels = new Float32Array(tt * tt * 4)

setTimeout(() => {

    renderer.readRenderTargetPixels(
        renderTarget,
        0, 0, tt, tt,
        pixels
    );
    const indicesArr = [] 

    // Конвертируем обратно в мировые координаты
    const vertexPositions = [];
    const verticesArr = [];
    let j = 0
    for (let i = 0; i < pixels.length; i += 4) {
        const x = pixels[i];
        const y = pixels[i + 1] ;
        const z = pixels[i + 2]  * textureScaleZ;
        if (z > 5) { // x !== 0 || y !== 0 || z !== 0 Фильтруем пустые пиксели
            vertexPositions.push(new THREE.Vector3(x, y, z));
            indicesArr.push(j, j+1, j+2)
            verticesArr.push(x, y, z)
            j+=3
        }
    }

    console.log('Позиции вершин:', vertexPositions);

    const planeByTextureVertices = new Float32Array(verticesArr)
	const planeByTextureIndicesArr = []

	for (let y = tt - 2; y >= 0; y--) {
		for (let x = tt - 2; x >= 0; x--) {
		    // Вычисляем индексы вершин для текущего квада
		    const a = (y + 1) * tt + x + 1  // Право-низ
		    const b = (y + 1) * tt + x      // Лево-низ
		    const c = y * tt + x + 1        // Право-верх
		    const d = y * tt + x            // Лево-верх

		    // Первый треугольник (правый нижний треугольник квада)
		    planeByTextureIndicesArr.push(a, b, c)
		    // Второй треугольник (левый верхний треугольник квада)
		    planeByTextureIndicesArr.push(c, b, d)
		}
	}
	const planeByTextureIndices = new Uint16Array(planeByTextureIndicesArr)

	const planeByTextureGeometry = new THREE.BufferGeometry()
	planeByTextureGeometry.setAttribute('position', new THREE.BufferAttribute(planeByTextureVertices, 3))
	planeByTextureGeometry.setIndex(new THREE.BufferAttribute(planeByTextureIndices, 1))


	/////////// GRASSS ///////////
		
	

	const planeByTextureMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color(0.05, 0.2, 0.01),
		wireframe: true
	})

	const planeByTexture = new THREE.Mesh(planeByTextureGeometry, planeByTextureMaterial)
	planeByTexture.rotation.x = -Math.PI / 2
	planeByTexture.updateMatrixWorld(true)

	//scene.add(planeByTexture)

	// Получаем мировые координаты вершин
	//const planeByTexturePositions = planeByTextureGeometry.attributes.position.array

	const worldPosition = new THREE.Vector3()

	/*const testPos = []

	for (let i = 0; i < positions.length; i += 3) {
		testPos.push(new THREE.Vector3(positions[i], positions[i+1], positions[i+2]))
	}*/

	// const grassShaderMat = new THREE.ShaderMaterial({ 
	// 	vertexShader: `
	// 	    #include <fog_pars_vertex>
	// 	    attribute mat4 instanceMatrix; // Добавляем объявление атрибута
	// 	    varying vec2 vUv;
	// 		void main(){
	// 			vUv = uv;
	// 		    //gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	// 		    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);

	// 		    #include <begin_vertex>
	// 			#include <project_vertex>
	// 			#include <fog_vertex>
	// 		}
	// 	`,
	// 	fragmentShader: `
	// 	    #include <fog_pars_fragment>
	// 	    varying vec2 vUv;
	// 		void main(){
	// 			gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	// 			#include <fog_fragment>
	// 		}
	// 	`,
	// 	uniforms: THREE.UniformsUtils.merge( [
	// 	THREE.UniformsLib[ 'fog' ], {
	// 		uTime: {value: 0.0}
	// 	}
 //      	]),
	// 	side: THREE.DoubleSide,
	// 	//fog: true,
	// })

	// UV-координаты для текстур
	const grassUvs = new Float32Array([
		// Первый треугольник
		0, 0,    // vertex 0
		1, 0.33, // vertex 1
		1, 0,    // vertex 2
		// Второй треугольник
		0, 0,    // vertex 3
		1, 0.33, // vertex 4
		0, 0.33, // vertex 5
		// Третий треугольник
		0, 0.33, // vertex 6
		1, 0.66, // vertex 7
		1, 0.33, // vertex 8
		// Четвертый треугольник
		0, 0.33, // vertex 9
		1, 0.66, // vertex 10
		0, 0.66, // vertex 11
		// Пятый треугольник
		0, 0.66, // vertex 12
		0.5, 1,  // vertex 13
		1, 0.66, // vertex 14
	])

	// Индексы для всех треугольников
	const grassIndices = new Uint16Array([
		0, 1, 2,   // Первый треугольник
		3, 4, 5,   // Второй треугольник
		6, 7, 8,   // Третий треугольник
		9, 10, 11, // Четвертый треугольник
		12, 13, 14 // Пятый треугольник
	])

	//const rand = Math.random()

	const faceHeight = 0.4
	const grassAngleSide = 1
	const grassAngle = 0.1 * grassAngleSide

	const grassVertexsArray = new Float32Array([
		-0.1, faceHeight * 0, 0,
		0.0, faceHeight * 1, 0,
		0.0, faceHeight * 0, 0,

		-0.1, faceHeight * 0, 0,
		0.0, faceHeight * 1, 0,
		-0.1, faceHeight * 1, 0,

		-0.1, faceHeight * 1, 0,
		0.0, faceHeight * 2, grassAngle,
		0.0, faceHeight * 1, 0,

		-0.1, faceHeight * 1, 0,
		0.0, faceHeight * 2, grassAngle,
		-0.1, faceHeight * 2, grassAngle,

		-0.1, faceHeight * 2, grassAngle,
		-0.05, faceHeight * 3, grassAngle * 3,
		0.0, faceHeight * 2, grassAngle,
	])

	//const grassVertexsPosition = new THREE.BufferAttribute(grassVertexsArray, 3)
	const grassGeometry = new THREE.BufferGeometry()
	grassGeometry.setAttribute('position', new THREE.BufferAttribute(grassVertexsArray, 3))
	grassGeometry.setAttribute('uv', new THREE.BufferAttribute(grassUvs, 2))
	grassGeometry.setIndex(new THREE.BufferAttribute(grassIndices, 1))

	console.log({grassGeometry})

	const grassUvsLow = new Float32Array([
		// Первый треугольник
		0, 0,    // vertex 0
		1, 0.33, // vertex 1
		1, 0,    // vertex 2
		// Второй треугольник
		0, 0,    // vertex 3
		1, 0.33, // vertex 4
		0, 0.33, // vertex 5
		// Третий треугольник
		0, 0.33, // vertex 6
		1, 0.66, // vertex 7
		1, 0.33, // vertex 8
		// Четвертый треугольник
		0, 0.33, // vertex 9
		1, 0.66, // vertex 10
		0, 0.66, // vertex 11
		// Пятый треугольник
		0, 0.66, // vertex 12
		0.5, 1,  // vertex 13
		1, 0.66, // vertex 14
	])



		// for (let i = 0; i < positions.length; i += 3) {

		//   // Преобразуем локальные координаты в мировые
		//   worldPosition.set(
		//     positions[i],
		//     positions[i + 1],
		//     positions[i + 2]
		//   );
		  
		//   grassMesh.localToWorld(worldPosition);
		  
		 

		
		

		//   const cube = new THREE.Mesh(geom, grassShaderMat) 
		//   scene.add(cube)

		//   cube.position.copy(worldPosition)

		//   cube.position.x = cube.position.x + Math.random() * 0.8
		//   cube.position.z = cube.position.z + Math.random() * 0.8

		//   cube.rotation.y = Math.PI / 2 * (Math.random() - 0.5)// * (Math.round(Math.random()) * 2 - 1)

		//   cube.rotation.y = Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5)

		// }

	//const count = grassCount * grassCount

	const grassMaterial = new THREE.MeshBasicMaterial({color: "green", side: THREE.DoubleSide})

	grassMaterial.onBeforeCompile = (shader) => {
		shader.vertexShader = shader.vertexShader.replace(
			"#include <common>",
			`
			    #include <common>
			    varying vec2 vUv; // Добавляем после include <common>
			`
		)
		// 2. Передаем UV-координаты из атрибута в varying
		shader.vertexShader = shader.vertexShader.replace(
			"#include <uv_vertex>",
			`
			    vUv = uv; // Сохраняем UV во varying переменную
			    #include <uv_vertex>
			`
		)
		// 3. Добавляем varying во фрагментный шейдер
		shader.fragmentShader = `
			varying vec2 vUv; // Объявляем во фрагментном шейдере
		` + shader.fragmentShader

		// 4. Теперь можно использовать vUv во фрагментном шейдере
		shader.fragmentShader = shader.fragmentShader.replace(
			"#include <color_fragment>",
			`
			vec3 baseColor = vec3(0.2, 0.6, 0.3);
			vec3 tipColor = vec3(0.4, 0.9, 0.5);
			float gradient = smoothstep(0.3, 0.8, vUv.y);
			vec3 clr = mix(baseColor, tipColor, vUv.y);
			vec3 clr2 = mix(baseColor, tipColor, vUv.x);

			diffuseColor = vec4(clr , 1.0);
			//diffuseColor = vec4(1.0, 0.0, 0.0,1.0);
		`
		)
		// Обновляем шейдер материала
		grassMaterial.userData.shader = shader
	}

	//const grasses = new InstancedMesh2(grassGeometry, grassMaterial)
	const grasses = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount)

	const planeByTextureVerticesVectors = []
	const planeByTextureVertexsPositions = planeByTextureGeometry.attributes.position.array

	for (let i = 0; i < planeByTextureVertexsPositions.length; i += 3) {
		planeByTextureVerticesVectors.push(new THREE.Vector3(planeByTextureVertexsPositions[i], planeByTextureVertexsPositions[i+1], planeByTextureVertexsPositions[i+2]))
	}

	console.warn(planeByTextureVerticesVectors)

	let lostedGrass = 0
	const prevRandoms = new Set();
	

	const dummy = new THREE.Object3D();

	for (let i = 0; i < grassCount; i++) {
		let random
	    do {
	        random = Math.floor(Math.random() * planeByTextureVerticesVectors.length)
	    } while (prevRandoms.has(random))

	    prevRandoms.add(random)

		const randomVertexVector = planeByTextureVerticesVectors[random]

		dummy.position.set(randomVertexVector.x + Math.random() * 0.8 , randomVertexVector.z, randomVertexVector.y + Math.random() * 0.8 );
		dummy.rotation.y = Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5)
		dummy.updateMatrix();
		grasses.setMatrixAt(i, dummy.matrix)
	}

	// grasses.addInstances(grassCount, (obj, index) => {
	// 	// obj.position.x = 10 * (Math.random() * 2 - 1);
	// 	// obj.position.z = 10 * (Math.random() * 2 - 1);

	// 	//const random = getUnicRandom(getRandomVector())
	// 	let random
	//     do {
	//         random = Math.floor(Math.random() * planeByTextureVerticesVectors.length)
	//     } while (prevRandoms.has(random))

	//     prevRandoms.add(random)

	// 	//if(prevRandoms.includes(random)) lostedGrass++

	// 	//prevRandoms.push(random)

	// 	//console.log(planeByTextureVerticesVectors.length, random)



	// 	const randomVertexVector = planeByTextureVerticesVectors[random]

	// 	//console.log({ps})
	// 	//if(randomVertexVector ){ // && randomVertexVector.z > 3
	// 		obj.position.x = randomVertexVector.x + Math.random() * 0.8 
	// 	 	obj.position.z = randomVertexVector.y + Math.random() * 0.8 
	// 		obj.position.y = randomVertexVector.z
	// 		// obj.scale.y = 10
	// 		// obj.scale.x = 10
	// 		// obj.scale.z = 10

	// 		//obj.rotateY = Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5)

	// 	 	const quaternion = new THREE.Quaternion()
	// 		quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ),  Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5))
	// 		obj.quaternion = quaternion
	// 		obj.updateMatrix()
	// 		grasses.setMatrixAt(index, obj.matrix)
	// 	//}
	// })

	// grasses.addLOD(new THREE.BoxGeometry(1,1,1), grassMaterial, 10); // high
	// grasses.addLOD(grassGeometry, grassMaterial, 100);

	console.log({lostedGrass})

	console.log({grassCount})
	console.log({pvert: planeByTextureVerticesVectors.length})


	console.log(grasses)

	grasses.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
	grasses.instanceMatrix.needsUpdate = true

	console.log(grasses.instanceMatrix.array)

	grasses.scale.z = -1
	scene.add(grasses)

	gui.add(grasses.position, 'x').min(-20).max(20)
	gui.add(grasses.position, 'z').min(-20).max(20)
	
}, 1000)

const stats = {
	renderCalls: 0,
	triangles: 0,
	geometries: 0,
	textures: 0,
	color: "#ffffff"
}

gui.add(stats, 'renderCalls').name('Render Calls').listen()
gui.add(stats, 'triangles').name('Triangles').listen()
gui.add(stats, 'geometries').name('Geometries').listen()
gui.add(stats, 'textures').name('Textures').listen()
gui.addColor(stats, 'color').name('landColor').onChange((value) => {
    mapPlaneMaterial.color.set(value)
})



var stats1 = new Stats();
document.body.appendChild(stats1.dom)




function animate() {
	stats1.begin();
  
	const deltaTime = clock.getDelta();

	requestAnimationFrame(animate);

	

	//composer.renderer.render();
     //controls.update();
     activeCamera.update(deltaTime);

	// Очищаем предыдущую статистику
  	renderer.info.reset();

	

	// Добавить обновление матриц камеры
  activeCamera.updateProjectionMatrix();
  activeCamera.updateMatrixWorld(true);

	animations.update(deltaTime);

	clippingPlanes.update();

	materials.updatableMaterials.forEach(mat => mat.animationUpdate(deltaTime))

	//material.uniforms.uTime.value += 0.01;
	riverMaterial.uniforms.uTime.value += 0.01;


	renderer.setRenderTarget(renderTarget);
	renderer.render(textureScene, textureCamera)
	renderer.setRenderTarget(null);
	renderer.render(scene, activeCamera)
	renderer.setRenderTarget(null);
	//composer.render();







	


	// Рендерим позиции в текстуру
    

	//annRenderer.render(scene, activeCamera);


	stats.renderCalls = renderer.info.render.calls;
	stats.triangles = renderer.info.render.triangles;
	stats.geometries = renderer.info.memory.geometries;
	stats.textures = renderer.info.memory.textures;

	// Рендеринг...
  stats1.end();
    // скрыть перекрываемые  аннотации при движении (используется raycaster, сильно тормозит приложение)
    // hideInvisibleAnns(activeCamera, servObj && servObj.annotations)
}

