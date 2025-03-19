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

//import { RenderPass, EffectComposer, OutlinePass } from "three-outlinepass"

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
	renderPass.camera = activeCamera;
	n8aopass.camera = activeCamera;

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


let plane, flatPlane, material, flatMaterial

let positionRenderTarget , positionScene, positionCamera, positionMesh


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
        const segments = 400;

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
            //wireframe: true
        });

  //       displacement.needsUpdate = true;
		// displacement.onLoad = () => {
		//     // Получаем данные из displacementMap
		//     const canvas = document.createElement('canvas');
		//     const ctx = canvas.getContext('2d');
		//     canvas.width = displacement.image.width;
		//     canvas.height = displacement.image.height;
		//     ctx.drawImage(displacement.image, 0, 0);
		//     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

		//     // Обновляем позиции вершин
		//     const positions = geometry.attributes.position.array;
		    
		//     for (let i = 0; i < positions.length; i += 3) {
		//         // Нормализованные UV-координаты
		//         const u = (positions[i] / width + 0.5);
		//         const v = (positions[i + 2] / height + 0.5);
		        
		//         // Координаты в текстуре
		//         const x = Math.floor(u * (canvas.width - 1));
		//         const y = Math.floor(v * (canvas.height - 1));
		        
		//         // Получаем значение высоты (R-канал)
		//         const displacementValue = imageData[(y * canvas.width + x) * 4] / 255;
		        
		//         // Обновляем Y-координату
		//         positions[i + 1] = displacementValue * baseMaterial.displacementScale;
		//     }

		//     // Обновляем геометрию
		//     geometry.attributes.position.needsUpdate = true;
		//     geometry.computeVertexNormals();
		//     geometry.computeBoundingBox();
		//     geometry.computeBoundingSphere();


		// };

       //console.log({geometry})




		

        


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

        scene.add(plane)
        //scene.add(flatPlane)



        /// UPDATE VERTEX HEIGHT ////

        const positionMaterial = new CustomShaderMaterial({
        	baseMaterial: baseMaterial,
		    vertexShader: `
		        varying vec4 vWorldPosition;
		        void main() {
		            // Сохраняем мировую позицию вершины
		            vWorldPosition = modelMatrix * vec4(position, 1.0);
		            gl_Position = projectionMatrix * viewMatrix * vWorldPosition;
		        }
		    `,
		    fragmentShader: `
		        varying vec4 vWorldPosition;
		        void main() {
		            // Записываем позицию в RGBA-текстуру (нормализованную)
		            gl_FragColor = vec4(vWorldPosition.xyz / 100.0, 1.0); 
		        }
		    `
		});

		

		positionRenderTarget  = new THREE.WebGLRenderTarget(1024, 1024, {
		    type: THREE.FloatType,
		    format: THREE.RGBAFormat
		});

		
			//Создаем сцену и камеру для рендера позиций
		positionScene = new THREE.Scene();
		positionCamera = new THREE.PerspectiveCamera( 45, 1.2, 1, 1000 )//activeCamera.clone(); // Используем ту же камеру
		positionMesh = plane.clone(); // Копируем меш
		positionMesh.material = positionMaterial;
		positionScene.add(positionMesh);

	

        const pstt = geometry.attributes.position.array;

        console.log({pstt})

        for (let i = 0; i < pstt.length; i += 3) {
			const geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
			const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
			const cube = new THREE.Mesh( geometry, material ); 
			//scene.add( cube );
			cube.position.x = pstt[i]
			cube.position.z = pstt[i+1]
			cube.position.y = pstt[i+2]
		}



        scene.add(flatPlane)

       













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

const light = new THREE.DirectionalLight(0xfff0dd, 9);
light.position.set(10, 20, 10);
light.castShadow = true;
scene.add(light);

// Заполняющий свет
scene.add(new THREE.AmbientLight(0x80a0ff, 0.4));

renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const renderer2 = new THREE.WebGLRenderer();

console.log(scene.activeRenderer.render)
console.log(scene.activeRenderer.render.setRenderTarget)
console.log(annRenderer.render.setRenderTarget)
console.log(renderer2.setRenderTarget)



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


	const width1 = 200;
        const height1 = 200;
        const segments1 = 10;

        const loader1 = new THREE.TextureLoader();
        const displacement1 = loader1.load('./3d/map2.jpg');

        const map1 = loader1.load('./3d/tex.png');

        const geometry1 = new THREE.PlaneGeometry(width1, height1, segments1, segments1);
        const baseMaterial1 = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, //Red
            //map:map1,
            //wireframe: true,
            displacementMap: displacement1,
            displacementScale: 30,
            //wireframe: true
        });

        const uniforms1 = {
        	uDisplacementMap: { value: displacement1 },
            uDisplacementScale: { value: 50.0 },
            uTime: { value: 0.0 },
        }

        const material1 = new CustomShaderMaterial({
	        baseMaterial: baseMaterial1,
	        vertexShader: landV,
	        fragmentShader: landF,
	        uniforms: uniforms1,
	    });

	    const material2 = new THREE.ShaderMaterial({
	    	vertexShader: landV,
	        fragmentShader: landF,
	        uniforms: uniforms1,
	    })

	    const plane1 = new THREE.Mesh(geometry1, material2);
        plane1.rotation.x = -Math.PI / 2

        plane1.position.y = 0.1

        //scene.add(plane1) // plane with fragcolor

        //console.log(plane1)


  //       const gpgpu1 = {}
		// gpgpu1.size = Math.ceil(Math.sqrt(geometry1.attributes.position.count))
		// console.log({sssss: gpgpu1.size})
		// gpgpu1.computation = new GPUComputationRenderer(gpgpu1.size, gpgpu1.size, renderer)

		// const myFilter2 = gpgpu1.computation.createShaderMaterial( landF, { theTexture: { value: null } } );


		

		// gpgpu1.computation.init()

// 		console.log({inputTexture})





///////////////




// Параметры:
const tt = 700
const width2 = tt;
const height2 = tt;
const options = {
	type: THREE.FloatType
  // format: THREE.RGBAFormat,    // Формат данных
  // type: THREE.FloatType,       // Тип данных (для HDR)
  // minFilter: THREE.LinearFilter,
  // magFilter: THREE.LinearFilter,
  // stencilBuffer: false
};

// Создаем отдельную сцену и камеру для рендера в текстуру
const textureScene = new THREE.Scene();
const wh = 205
const textureCamera = new THREE.OrthographicCamera( wh / - 2, wh / 2, wh / 2, wh / - 2, 1, 1000 );

const mp =plane1.clone()
mp.rotation.z = -Math.PI / 2
//plane1.rotation.y = -Math.PI / 2
//textureScene.add(box);
textureScene.add(mp);

// Позиционируем камеру
textureCamera.position.y = 100;
textureCamera.lookAt(0,0,0)

const renderTarget = new THREE.WebGLRenderTarget(width2, height2, options);


// Создаем материал с полученной текстурой
const planeMaterial = new THREE.MeshBasicMaterial({
  map: renderTarget.texture
});

// Применяем к объекту в основной сцене
const plane11 = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 5),
  planeMaterial
);
plane11.position.z = -0.1
scene.add(plane11); // renderTarget Plnae




console.log({tex: renderTarget.texture})


//// Use the GPGPU to position particles 
// Geometry
// const particlesUvArray = new Float32Array(plane1.geometry.attributes.position.count * 2)

// particles.geometry = new THREE.BufferGeometry()
// particles.material = new THREE.ShaderMaterial({
//     vertexShader: `
//     	void main(){
//     		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     	}

//     `,
//     fragmentShader: `
//     	void main(){
//     		gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
//     	}

//     `,
//     uniforms:
//     {
//         // ...
//         uParticlesTexture: new THREE.Uniform()
//     }
// })


// const mySize = Math.ceil(Math.sqrt(plane1.geometry.attributes.position.count))

// for(let y = 0; y < mySize; y++)
// {
//     for(let x = 0; x < mySize; x++)
//     {
//         const i = (y * mySize + x)
//         const i2 = i * 2

//         // Particles UV
//         const uvX = (x + 0.5) / mySize
//         const uvY = (y + 0.5) / mySize

//         particlesUvArray[i2 + 0] = uvX;
//         particlesUvArray[i2 + 1] = uvY;
//     }
// }

// particles.geometry.setDrawRange(0, plane1.geometry.attributes.position.count)
// particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesUvArray, 2))
// // Points
// particles.points = new THREE.Points(particles.geometry, particles.material)
// scene.add(particles.points)



const pixels = new Float32Array(tt * tt * 4);
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
        const z = pixels[i + 2]  * 0.75;
        if (x !== 0 || y !== 0 || z !== 0) { // Фильтруем пустые пиксели
            vertexPositions.push(new THREE.Vector3(x, y, z));
            indicesArr.push(j, j+1, j+2)
            verticesArr.push(x, y, z)
            j+=3
        }
    }

    console.log('Позиции вершин:', vertexPositions);

    const vertices2 = new Float32Array(verticesArr);
 //    const indices = new Uint16Array(indicesArr);
	

 //    const geom4 = new THREE.BufferGeometry();
	// geom4.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	// geom4.setIndex(new THREE.BufferAttribute(indices, 1));

	const material4 = new THREE.MeshBasicMaterial({ 
	    color: 0x0000ff,
	    wireframe: true, // Для визуализации треугольников
	    side: THREE.DoubleSide
	});


	const indicesArr2 = [];

		for (let y = tt - 2; y >= 0; y--) {
  for (let x = tt - 2; x >= 0; x--) {
    // Вычисляем индексы вершин для текущего квада
    const a = (y + 1) * tt + x + 1;  // Право-низ
    const b = (y + 1) * tt + x;      // Лево-низ
    const c = y * tt + x + 1;        // Право-верх
    const d = y * tt + x;            // Лево-верх

    // Первый треугольник (правый нижний треугольник квада)
    indicesArr2.push(a, b, c);
    
    // Второй треугольник (левый верхний треугольник квада)
    indicesArr2.push(c, b, d);
  }
}
	const indices2 = new Uint16Array(indicesArr2);

	const geom5 = new THREE.BufferGeometry();
	geom5.setAttribute('position', new THREE.BufferAttribute(vertices2, 3));
	geom5.setIndex(new THREE.BufferAttribute(indices2, 1));

	// 6. Создаем меш и добавляем на сцену
	const mesh = new THREE.Mesh(geom5, material4);
	// const mesh = new THREE.Points(geom4, new THREE.PointsMaterial({
	//     color: 0xff0000,     
	//     size: 2,          
	//     transparent: true,    
	//     alphaTest: 0.5        
	// }));

	//scene.add(mesh);

	 ////// GRASSS ///////
		
		const grassCount = 900//200


		const grassGeometry = geom5
		//const grassGeometry = new THREE.PlaneGeometry(50, 50, grassCount, grassCount);
		const grassMaterial = new THREE.MeshStandardMaterial({
		  color: new THREE.Color(0.05, 0.2, 0.01),
		  wireframe: true
		})

		const grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);

		// Поворачиваем плоскость ДО вычисления позиций
		grassMesh.rotation.x = -Math.PI / 2;

		// Обновляем матрицу преобразований плоскости
		grassMesh.updateMatrixWorld(true);

		// Получаем мировые координаты вершин
		const positions = grassGeometry.attributes.position.array;
		const worldPosition = new THREE.Vector3();


		/*const testPos = []

		for (let i = 0; i < positions.length; i += 3) {
			testPos.push(new THREE.Vector3(positions[i], positions[i+1], positions[i+2]))
		}*/




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

		const count = grassCount*grassCount

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
			     vec3 baseColor = vec3(0.2, 0.6, 0.3);
			    vec3 tipColor = vec3(0.4, 0.9, 0.5);
			    float gradient = smoothstep(0.3, 0.8, vUv.y);

				//vec3 clr = mix(baseColor, tipColor, vUv.x);
				vec3 clr = mix(baseColor, tipColor, vUv.y);
				vec3 clr2 = mix(baseColor, tipColor, vUv.x);

			    diffuseColor = vec4(clr , 1.0);
			    `
			  );

		  // Обновляем шейдер материала
		  redoMAterial.userData.shader = shader;
		};

		const grasses = new InstancedMesh2(geom, redoMAterial);
		//const grasses = new InstancedMesh2(geom, grassShaderMat);


		const testPos = []

		const positionsss = geom5.attributes.position.array

		

		for (let i = 0; i < positionsss.length; i += 3) {
			testPos.push(new THREE.Vector3(positionsss[i], positionsss[i+1], positionsss[i+2]))
		}

		grasses.addInstances(count, (obj, index) => {
		  // obj.position.x = 10 * (Math.random() * 2 - 1);
		  // obj.position.z = 10 * (Math.random() * 2 - 1);

		  const r = Math.round(Math.random() * count)

		  //console.log({r})

		  const ps = testPos[r]

		  //console.log({ps})
		  if(ps && ps.z > 3){
		  	obj.position.x = ps.x + Math.random() * 0.8 * 6
		  obj.position.z = ps.y + Math.random() * 0.8 * 6
		  obj.position.y = ps.z

		  //obj.rotateY = Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5)

		  const quaternion = new THREE.Quaternion();
		  quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ),  Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5));
		  obj.quaternion = quaternion

		  //console.log(obj)
		  obj.updateMatrix();
		  grasses.setMatrixAt(index, obj.matrix)
		  }
		  
		});

		grasses.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
		grasses.instanceMatrix.needsUpdate = true

		console.log(grasses.instanceMatrix.array)

		scene.add(grasses)
		//scene.add(grassMesh);
		grasses.scale.z = -1

		gui.add(grasses.scale, 'z').max(1).min(-1).step(0.1)



}, 1000);






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



	// scene.activeRenderer.render.setRenderTarget(positionRenderTarget);
 //    scene.activeRenderer.render.render(positionScene, positionCamera);
 //    scene.activeRenderer.render.setRenderTarget(null);

 //gpgpu.computation.compute()
 //gpgpu1.computation.compute()
 //particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture

	//scene.activeRenderer.render(scene, activeCamera)
	renderer.setRenderTarget(renderTarget);
	renderer.render(textureScene, textureCamera)
	//particles.material.uniforms.uParticlesTexture.value = renderTarget.texture

	

	renderer.setRenderTarget(null);
	renderer.render(scene, activeCamera)

	// Рендерим позиции в текстуру
    

	annRenderer.render(scene, activeCamera);
    // скрыть перекрываемые  аннотации при движении (используется raycaster, сильно тормозит приложение)
    // hideInvisibleAnns(activeCamera, servObj && servObj.annotations)
}

