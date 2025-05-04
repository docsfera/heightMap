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
import Stats from 'stats-js'

import CustomShaderMaterial from 'three-custom-shader-material/vanilla';


import shaderV from './shaders/river/vertex.glsl'
import shaderF from './shaders/river/fragment.glsl'
import waterV from './shaders/water/vertex.glsl'
import waterF from './shaders/water/fragment.glsl'
import landF from './shaders/gpgpu/landF.glsl'
import landV from './shaders/gpgpu/landV.glsl'
import vv from './shaders/gpgpu/vv.glsl'
import gpgpuParticlesShader from './shaders/gpgpu/particles.glsl'


import grassV from './shaders/grass/vertex.glsl'
import grassF from './shaders/grass/fragment.glsl'


// import { Pass } from "three/examples/jsm/postprocessing/Pass.js";
// import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
// import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
// import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
// import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";


import SimpleFPControls from "three-simple-fp-controls"
import {switchFPSCamera} from"./switchFPSCamera.js"


import {loadModels} from "./loadModels.js"

const container3D = document.querySelector(".d3d-container");
const foreground = document.querySelector(".foreground");


let controls

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

	if(!isfps){
		onResize(scene.activeRenderer, activeCamera, container3D)
		onResize(annRenderer, activeCamera, container3D)
	}
	
}
scene.activeRenderer = renderer
scene.renderer = renderer
scene.composer = null


let mapPlane, riverPlane, riverMaterial

let positionRenderTarget , positionScene, positionCamera, positionMesh

const textureLoader = new THREE.TextureLoader()
//const displacement = textureLoader.load('./3d/map2.jpg')
const displacement = textureLoader.load('./3d/lod.png')
const map = textureLoader.load('./3d/tex2.jpg')
map.wrapS = THREE.RepeatWrapping;
map.wrapT = THREE.RepeatWrapping;
map.repeat.set(10, 10); // Масштаб текстуры
//const sand = textureLoader.load('./3d/sand.png')
const sand = textureLoader.load('./3d/animesand.jpg')
sand.wrapS = THREE.RepeatWrapping;
sand.wrapT = THREE.RepeatWrapping;
sand.repeat.set(10, 10); // Масштаб текстуры
sand.needsUpdate = true
const mask = textureLoader.load('./3d/mask.png')

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

const wh = 200



export const sceneLoadPromise = new Promise(function (resolve, reject) {
	loader.loadGLTF("./3d/three_starter.glb", async (gltf) => {
		scene.add(gltf.scene)
		scene.animations = gltf.animations

		console.log(scene, renderer)

		loadModels()

		//Init block
		proceduralEnvironmentHandler.init(scene, renderer) // нет тени из-заэ того
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

// const light = new THREE.DirectionalLight(0xfff0dd, 1);
// light.position.set(10, 20, 10);
// light.castShadow = true;
// scene.add(light);

// Заполняющий свет
scene.add(new THREE.AmbientLight(0x80a0ff, 0.4))

////////////////// MAP GEOMETRY ////////////

const mapPlaneGeometry = new THREE.PlaneGeometry(mapPlaneWidth, mapPlaneHeight, mapPlaneSegments, mapPlaneSegments)
const mapPlaneMaterial = new THREE.MeshStandardMaterial({ 
    //color: "#68ac89",//"#339966",
    map:sand,
    //wireframe: true,
    displacementMap: displacement,
    displacementScale: mapPlaneDisplacementScale,
    //displacementBias: 1
})

mapPlaneMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.pathMask = { value: mask }
    shader.uniforms.pathTexture = { value: map }
    
    shader.vertexShader = shader.vertexShader.replace(
       "#include <common>",
        `
            #include <common>
            varying vec2 vUv;
            varying vec2 vTerrainUV; // UV для маски
            uniform sampler2D pathMask;
        `
    )
    
    shader.vertexShader = shader.vertexShader.replace(
        "#include <uv_vertex>",
        `
        	vUv = uv;
            // UV для маски (повторение как у основной текстуры)
            vTerrainUV = uv * 50.0;
            #include <uv_vertex>
        `
    )

    // Фрагментный шейдер
    shader.fragmentShader = `
        varying vec2 vUv;
        varying vec2 vTerrainUV;
        uniform sampler2D pathMask;
        uniform sampler2D pathTexture;
    ` + shader.fragmentShader

    shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
        // Основной цвет текстуры
        vec4 baseColor = texture2D(map, vUv * 20.0); // 20!!! sand wrap is 50!! be careful
        
        // Цвет тропинки
        vec4 pathColor = texture2D(pathTexture, vTerrainUV);
        
        // Значение маски (инвертируем для тропинки)
        float maskValue = texture2D(pathMask, vec2(vUv.x, 1.0 - vUv.y)).g;
        
        // Смешивание с плавным переходом
        //float mixFactor = smoothstep(0.3, 0.7, 1.0 - maskValue);
        float mixFactor = step(0.7, 1.0 - maskValue);
        vec4 finalColor = mix(baseColor + vec4(1.0, 1.0, 0.0, 1.0), pathColor + vec4(0.0, 1.0, 0.0, 1.0), mixFactor);
        //vec4 finalColor = mix(vec4(0.2, 0.2, 0.2, 1.0), vec4(1.0, 0.0, 0.0, 1.0), mixFactor);
        
        diffuseColor *= finalColor;
        `
    )
    
    mapPlaneMaterial.userData.shader = shader
}



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
	grassGeometry.setAttribute('iscale', new THREE.InstancedBufferAttribute(new Float32Array([0.01,0.01,0.01]), 3, false, 1))
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

	let grassMaterial = new THREE.MeshBasicMaterial({color: "green", side: THREE.DoubleSide})

	grassMaterial.onBeforeCompile = (shader) => {
    // Добавляем uniform для маски
    shader.uniforms.pathMask = { value: mask };
    
    shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
            #include <common>
            varying vec2 vUv;
            varying vec3 vpos;
            varying vec2 vTerrainUV; // UV для маски
            uniform sampler2D pathMask;

            attribute vec3 iscale;
        `
    )
    
    shader.vertexShader = shader.vertexShader.replace(
        "#include <uv_vertex>",
        `
            vUv = uv;
            vpos = position * iscale;
            vpos.x = 0.0;
            vpos.y = 0.0;
            vpos.z = 0.0;
            
         

            // vec4 mask = texture2D(pathMask, vTerrainUV);
            // if (mask.r >  0.01 && mask.r < 0.2){
            // 	vpos.x = 0.0;
            // 	vpos.y = 0.0;
            // 	vpos.z = 0.0;
            // }

            // Рассчитываем UV маски на основе мировых координат
            vec4 worldPosition = modelMatrix * instanceMatrix * vec4(vpos, 1.0);
            vTerrainUV = (worldPosition.xz + vec2(100.0)) / 200.0; // Для плоскости 200x200 ////////////////////////////////////////// 200!!!!! TODO
            
            #include <uv_vertex>
        `
    )
    
    shader.fragmentShader = `
        varying vec2 vUv;
        varying vec3 vpos;
        varying vec2 vTerrainUV;
        uniform sampler2D pathMask;
    ` + shader.fragmentShader

    shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
            // Читаем маску
            vec4 mask = texture2D(pathMask, vTerrainUV);
            if (mask.r > 0.5) discard; // Отбрасываем пиксели, где маска темная
            
            // Оригинальный цвет травы
            vec3 baseColor = vec3(0.2, 0.6, 0.3);
            vec3 tipColor = vec3(0.4, 0.9, 0.5);
            vec3 clr = mix(baseColor, tipColor, vUv.y);
            
            diffuseColor = vec4(clr , 1.0);
            //if (mask.r >  0.01 && mask.r < 0.2) discard; //diffuseColor = vec4(0.0, 0.0, 1.0 , 1.0);
            //discard;
        `
    )
    
    grassMaterial.userData.shader = shader
}

	grassMaterial = new THREE.ShaderMaterial({
		vertexShader: grassV,
		fragmentShader: grassF,
		side: THREE.DoubleSide,
		uniforms: {
			pathMask: { value: mask },
			uTime: { value: 0.0 }
		},
	})


	servObj.grassMaterial = grassMaterial

	const grasses = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount)

	grassGeometry.attributes.iscale.needsUpdate = true

	console.warn(grassGeometry.attributes)
	console.warn(grassGeometry.attributes)
	console.warn(grassGeometry.attributes)

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

	activeCamera.controls.setLookAt(-55.474687739807365, 27.167925110735894, 41.81928096736683, 10.814844136319213, 18.044455466157817, 3.187493220094487);

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



var stats1 = new Stats();
document.body.appendChild(stats1.dom)





let lastTick


document.addEventListener("keydown", e => {
	if(e.code == "KeyP"){
		switchFPSCamera()
	}
})

let testuTime = 0

document.addEventListener("keydown", e => {
	if(e.code == "KeyC"){
		console.log(activeCamera.fov)
		console.log(activeCamera.aspect)
	}
})





function animate() {
	testuTime++

	var t = performance.now();
  var delta = t - lastTick;

	//oblakoPhi += 0.1

	//if(scene.getObjectByName("oblako")) scene.getObjectByName("oblako").position.setFromSphericalCoords(200, Math.PI/2 - 0.15, oblakoPhi)

	servObj.oblakoMass.map((oblako, i) => {
		servObj.oblakoPhiMass[i][2] += 0.001
		oblako.position.setFromSphericalCoords(servObj.oblakoPhiMass[i][0], servObj.oblakoPhiMass[i][1], servObj.oblakoPhiMass[i][2] )
	})	

	stats1.begin();
  
	const deltaTime = clock.getDelta();

	requestAnimationFrame(animate);

	

	
     //controls.update();
    if(activeCamera.update) activeCamera.update(deltaTime);

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






	if(servObj.grassMaterial){
		servObj.grassMaterial.uniforms.uTime.value = testuTime
	}
	


	// Рендерим позиции в текстуру
    

	//annRenderer.render(scene, activeCamera);


	stats.renderCalls = renderer.info.render.calls;
	stats.triangles = renderer.info.render.triangles;
	stats.geometries = renderer.info.memory.geometries;
	stats.textures = renderer.info.memory.textures;

	// Рендеринг...
  stats1.end();

   lastTick = t;
    // скрыть перекрываемые  аннотации при движении (используется raycaster, сильно тормозит приложение)
    // hideInvisibleAnns(activeCamera, servObj && servObj.annotations)
}

