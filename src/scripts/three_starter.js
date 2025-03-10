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

import { InstancedMesh2 } from '@three.ez/instanced-mesh';

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


class InstancedFloat16BufferAttribute extends THREE.InstancedBufferAttribute {

	constructor( array, itemSize, normalized, meshPerAttribute = 1 ) {

		super( new Uint16Array( array ), itemSize, normalized, meshPerAttribute );

		this.isFloat16BufferAttribute = true;
	}
};

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
            displacementScale: 30,
            onBeforeCompile: (shader1) => {console.log({shader1})}
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
	        onBeforeCompile: (shader) => {console.log({shader})}
	    });

	    flatMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, //Red
            
        });

	    flatMaterial = new THREE.ShaderMaterial({
	    	uniforms: THREE.UniformsUtils.merge( [
				THREE.UniformsLib[ 'fog' ], {
					uTime: {value: 0.0}
				}
      		]),
	    	vertexShader: waterV,
	    	fragmentShader: waterF,
	        fog: true,
	    });

	   

	    plane = new THREE.Mesh(geometry, baseMaterial);
	    flatPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 2, 2), flatMaterial)

        plane.rotation.x = -Math.PI / 2
        flatPlane.rotation.x = -Math.PI / 2

        plane.position.y = 0.1
        flatPlane.position.y = 2

        // scene.add(plane)
        // scene.add(flatPlane)

        ////// GRASSS ///////

//         const GRASS_WIDTH = 0.1;
// 		const GRASS_HEIGHT = 1.5;
// 		const GRASS_SEGMENTS = 6;
// 		const GRASS_PATCH_SIZE = 10;
// 		const NUM_GRASS = 1000;

// 		class SimpleGrass {
// 		  constructor() {
// 		    this.group = new THREE.Group();
// 		    this.geometry = this.createGrassGeometry();
// 		    //this.material = new shaders.GameMaterial('GRASS');
// 		    this.material = new THREE.MeshStandardMaterial({color: "#ff0000", wireframe: true});
// 		    this.mesh = new THREE.Mesh(this.geometry, this.material);
// 		    this.mesh.name = "grass"
		    
// 		    this.configureMaterial();
// 		    this.group.add(this.mesh);
// 		  }

// 		  createGrassGeometry() {
// 		    const geometry = new THREE.InstancedBufferGeometry();
// 		    const offsets = [];

// 		    // Генерация случайных позиций
// 		    for (let i = 0; i < NUM_GRASS; i++) {
// 		      offsets.push(
// 		        // math.rand_range(-GRASS_PATCH_SIZE, GRASS_PATCH_SIZE),
// 		        // math.rand_range(-GRASS_PATCH_SIZE, GRASS_PATCH_SIZE),
// 		        // 0
// 		       (Math.random() * GRASS_PATCH_SIZE * 2 - GRASS_PATCH_SIZE ),
// 		       (Math.random() * GRASS_PATCH_SIZE * 2 - GRASS_PATCH_SIZE ),
//                 0
// 		      );
// 		    }

// 		    // Настройка атрибутов
// 		    geometry.setAttribute(
// 		      'position',
// 		      new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3)
// 		    );

// 		    // Простая геометрия стебля травы
// 		    const vertices = new Float32Array([
// 		      0, 0, 0,
// 		      GRASS_WIDTH, 0, 0,
// 		      0, GRASS_HEIGHT, 0
// 		    ]);

// 		    geometry.setAttribute('vertPosition', new THREE.BufferAttribute(vertices, 3));
// 		    geometry.setIndex([0, 1, 2]);

// 		    return geometry;
// 		  }

// 		  configureMaterial() {
// 		    // this.material.setVec2('grassSize', new THREE.Vector2(GRASS_WIDTH, GRASS_HEIGHT));
// 		    // this.material.alphaTest = 0.5;
// 		    this.material.side = THREE.DoubleSide;
// 		  }

// 		  addToScene(scene) {
// 		    scene.add(this.group);
// 		  }
// 		}

// 		const grass = new SimpleGrass();
// grass.addToScene(scene);


		const grassGeometry = new THREE.PlaneGeometry(50, 50, 150, 150);
		const grassMaterial = new THREE.MeshStandardMaterial({
		  color: new THREE.Color(0.05, 0.2, 0.01),
		  //wireframe: true
		})

		const grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);

		// Поворачиваем плоскость ДО вычисления позиций
		grassMesh.rotation.x = -Math.PI / 2;

		// Обновляем матрицу преобразований плоскости
		grassMesh.updateMatrixWorld(true);

		// Получаем мировые координаты вершин
		const positions = grassGeometry.attributes.position.array;
		const worldPosition = new THREE.Vector3();


		const testPos = []

		for (let i = 0; i < positions.length; i += 3) {
			testPos.push(new THREE.Vector3(positions[i], positions[i+1], positions[i+2]))
		}

		console.log({testPos})




		const grassShaderMat = new THREE.ShaderMaterial({ 

		    	vertexShader: `
		    		#include <fog_pars_vertex>
		    		attribute mat4 instanceMatrix; // Добавляем объявление атрибута
		    		varying vec2 vUv;
			    	void main(){

			    		vUv = uv;
			    		//gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			    		gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);

			    		#include <begin_vertex>
						#include <project_vertex>
						#include <fog_vertex>
			    	}
		    	`,
		    	fragmentShader: `
		    		#include <fog_pars_fragment>
		    		varying vec2 vUv;
			    	void main(){

			    		// vec3 baseColor = vec3(0.05, 0.2, 0.01);
			    		// vec3 tipColor = vec3(0.5, 0.5, 0.1);


			    		// vec3 clr = mix(baseColor, tipColor, vUv.x);

			    		// gl_FragColor = vec4(clr, 1.0);

			    		 gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

			    		#include <fog_fragment>
			    	}
		    	`,
		    	uniforms: THREE.UniformsUtils.merge( [
				THREE.UniformsLib[ 'fog' ], {
					uTime: {value: 0.0}
				}
      		]),
		    	side: THREE.DoubleSide,
		    	//fog: true,

		    })

		  // UV-координаты для текстур
		const uvs = new Float32Array([
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
			]);

			// Индексы для всех треугольников
			const indices = new Uint16Array([
			    0, 1, 2,   // Первый треугольник
			    3, 4, 5,   // Второй треугольник
			    6, 7, 8,   // Третий треугольник
			    9, 10, 11, // Четвертый треугольник
			    12, 13, 14 // Пятый треугольник
			]);


		//const rand = Math.random()

		 const faceHeight = 0.4
		  const grassAngleSide = 1
		  const grassAngle = 0.1 * grassAngleSide

		  const pa = new Float32Array([
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

		  const pat = new THREE.BufferAttribute(pa, 3)
		const geom = new THREE.BufferGeometry()

		geom.setAttribute('position', new THREE.BufferAttribute(pa, 3));
		geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
		geom.setIndex(new THREE.BufferAttribute(indices, 1));

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

		const count = 150*150

		console.log({geom})

		const redoMAterial = new THREE.MeshStandardMaterial({color: "green", side: THREE.DoubleSide})

		redoMAterial.onBeforeCompile = (shader) => {
		  	// 	shader.vertexShader = `
			  //   varying vec2 vUv; // Объявляем varying в вершинном шейдере
			  // ` + shader.vertexShader;

			  shader.vertexShader = shader.vertexShader.replace(
			    "#include <common>",
			    `
			    #include <common>
			    varying vec2 vUv; // Добавляем после include <common>
			    `
			  );

			  // 2. Передаем UV-координаты из атрибута в varying
			  shader.vertexShader = shader.vertexShader.replace(
			    "#include <uv_vertex>",
			    `
			    vUv = uv; // Сохраняем UV во varying переменную
			    #include <uv_vertex>
			    `
			  );

			  // 3. Добавляем varying во фрагментный шейдер
			  shader.fragmentShader = `
			    varying vec2 vUv; // Объявляем во фрагментном шейдере
			  ` + shader.fragmentShader;

			  // 4. Теперь можно использовать vUv во фрагментном шейдере
			  shader.fragmentShader = shader.fragmentShader.replace(
			    "#include <color_fragment>",
			    `
			    vec3 gradient = mix(vec3(1,0,0), vec3(0,0,1), vUv.x);
			    diffuseColor = vec4(1.0, 1.0 ,0.0, 1.0);
			    `
			  );

		  // Обновляем шейдер материала
		  redoMAterial.userData.shader = shader;
		};

		const grasses = new InstancedMesh2(geom, redoMAterial);
		//const grasses = new InstancedMesh2(geom, grassShaderMat);

		grasses.addInstances(40000, (obj, index) => {
		  // obj.position.x = 10 * (Math.random() * 2 - 1);
		  // obj.position.z = 10 * (Math.random() * 2 - 1);

		  const ps = testPos[Math.round(Math.random() * count)]
		  obj.position.x = ps.x + Math.random() * 0.8
		  obj.position.z = ps.y + Math.random() * 0.8

		  //obj.rotateY = Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5)

		  const quaternion = new THREE.Quaternion();
		  quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ),  Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5));
		  obj.quaternion = quaternion

		  //console.log(obj)
		  obj.updateMatrix();
		  grasses.setMatrixAt(index, obj.matrix)
		});

		grasses.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
		grasses.instanceMatrix.needsUpdate = true

		console.log(grasses.instanceMatrix.array)

		scene.add(grasses)
		scene.add(grassMesh);


		/////////////////////

		scene.getObjectByName("suzanne").visible = false
		scene.getObjectByName("curve").visible = false
		scene.getObjectByName("cube").visible = false
		scene.getObjectByName("sphere").visible = false
		scene.getObjectByName("slim_cube").visible = false
		scene.getObjectByName("floor").visible = false


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

