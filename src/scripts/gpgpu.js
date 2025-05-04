//import { GPUComputationRenderer } from 'gpucomputationrender-three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

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



	//       const gpgpu1 = {}
		// gpgpu1.size = Math.ceil(Math.sqrt(geometry1.attributes.position.count))
		// console.log({sssss: gpgpu1.size})
		// gpgpu1.computation = new GPUComputationRenderer(gpgpu1.size, gpgpu1.size, renderer)

		// const myFilter2 = gpgpu1.computation.createShaderMaterial( landF, { theTexture: { value: null } } );


		

		// gpgpu1.computation.init()