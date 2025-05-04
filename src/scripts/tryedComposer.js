import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
//import { RenderPass, EffectComposer, OutlinePass } from "three-outlinepass"

//import "./OutlinePass.js"
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { CustomOutlinePass } from "./CustomOutlinePass.js";

// composer = new THREE.EffectComposer( renderer );

// var renderPass = new RenderPass( scene, camera );
// composer.addPass( renderPass );

//scene.fog = new THREE.Fog( 0xcccccc, 1, 1500 );


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


//composer.renderer.render();



