import * as THREE from "three";
import { loader } from "./loader.js";
import {GhibliShader} from "./GhibliShader.js"

let oblakoMass = []
servObj.oblakoMass = oblakoMass
let oblakoPhiMass = []
servObj.oblakoPhiMass = oblakoPhiMass

export const loadModels = () => {
	const scene = window.servObj.scene
	scene.getObjectByName("suzanne").visible = true
scene.getObjectByName("curve").visible = false
scene.getObjectByName("cube").visible = false
scene.getObjectByName("sphere").visible = false
scene.getObjectByName("slim_cube").visible = false
scene.getObjectByName("floor").visible = false


// loader.loadGLTF("./3d/untitled.gltf", async (gltf) => {
// 	const table = gltf.scene
// 	console.log({table})
// 	scene.add(table)
// 	table.name = "table"
// 	table.traverse(_ => {
// 		if(_.material && _.material.name == "Outline") _.material.color = new THREE.Color(0,0,0)
// 	})
// 	table.position.y = 19.5
// 	table.scale.set(5,5,5)
// })

// loader.loadGLTF("./3d/rocks.gltf", async (gltf) => {
// 	const rocks = gltf.scene
// 	console.log({rocks})
// 	scene.add(rocks)
// 	// rocks.traverse(_ => {
// 	// 	if(_.material && _.material.name == "Outline") _.material.color = new THREE.Color(0,0,0)
// 	// })
// 	rocks.position.y = 15.5
// 	rocks.position.x = 35
// 	rocks.scale.set(3,3,3)
// })
// loader.loadGLTF("./3d/chair.gltf", async (gltf) => {
// 	const chair = gltf.scene
// 	console.log({chair})
// 	scene.add(chair)
// 	chair.traverse(_ => {
// 		if(_.material && _.material.name == "Outline") _.material.color = new THREE.Color(0,0,0)
// 	})
// 	chair.position.y = 19
// 	chair.position.x = 6
// 	chair.scale.set(6,6,6)
// })
// loader.loadGLTF("./3d/wf.gltf", async (gltf) => {
// 	const wf = gltf.scene
// 	console.log({wf})
// 	scene.add(wf)
// 	wf.position.y = 15.5
// 	wf.position.x = -14
// 	wf.position.z = -14
// 	//wf.scale.set(0.015,0.015,0.015)
// 	wf.scale.set(0.03,0.03,0.03)

// 	const copy = wf.clone()
// 	copy.position.x = -14
// 	copy.position.z = -14
// 	copy.rotation.y = Math.PI / 3
// 	scene.add(copy)

// 	// for (let i = 0; i < 400; i++) {
// 	// 	const copy = wf.clone()
// 	// 	copy.position.x = (Math.random() - 0.5) * 200
// 	// 	copy.position.z = (Math.random() - 0.5) * 200
// 	// 	scene.add(copy)
// 	// }
// })

// loader.loadGLTF("./3d/wf2.gltf", async (gltf) => {
// 	const wf2 = gltf.scene
// 	console.log({wf2})
// 	scene.add(wf2)
// 	wf2.position.y = 15.5
// 	wf2.position.x = -8
// 	wf2.position.z = -14
// 	//wf.scale.set(0.015,0.015,0.015)
// 	wf2.scale.set(5,5,5)
// })

// loader.loadGLTF("./3d/pers.gltf", async (gltf) => {
// 	const wf2 = gltf.scene
// 	console.log({wf2})
// 	scene.add(wf2)
// 	wf2.name = "pers"
// 	wf2.position.y = 15.5
// 	wf2.position.x = -8
// 	wf2.position.z = 0

// 	wf2.rotation.y = Math.PI / 2
// 	//wf.scale.set(0.015,0.015,0.015)
// 	wf2.scale.set(5,5,5)
// })

loader.loadGLTF("./3d/trees.glb", async (gltf) => { // pers
	const pers = gltf.scene
	//scene.add(pers)

	pers.getObjectByName("Foliage").material = new THREE.ShaderMaterial(GhibliShader)
	pers.position.y = 15.5
	pers.position.x = 100
	pers.position.z = -40

	for (let i=-25; i < 25; i++) {
		const n = pers.clone()
		//n.children[0].material = n.children[0].material.clone()
		n.position.set(100 - Math.random() * 5, 15.5 + Math.random() * 2, -i * 4)

		const ss = 1 + Math.random()
		n.scale.set(ss, ss, ss)
		//scene.add(n)
	}
	for (let i=-25; i < 25; i++) {
		const n = pers.clone()
		n.position.set( -i * 4 , 15.5 + Math.random() * 2, -100 + Math.random() * 5)

		const ss = 1 + Math.random()
		n.scale.set(ss, ss, ss)

		//scene.add(n)
	}

	const oblako = pers.clone()
	oblako.children[0].material = pers.children[0].material.clone()

	oblako.children[0].material.uniforms.colorMap.value = [
        new THREE.Color("#ffffff"),
        new THREE.Color("#f2f2f2"),
        new THREE.Color("#fcfcfc"),
        new THREE.Color("#f2f2f2"),
    ]
    oblako.scale.set(3, 1.5, 1.5)
    oblako.name = "oblako"


    for (let i=0; i < 25; i++) {
		const o = oblako.clone()
		//scene.add(o)

		const s = 1 + Math.random()
		o.scale.set(s,s,s)

		oblakoMass.push(o)
		oblakoPhiMass.push([200 + Math.random() * 100, Math.PI/2 - 0.25, Math.PI * (0.5 -Math.random()) *2]) // random, th,ph
	}



    //scene.add(oblako)

    // const o1 = oblako.clone()

    // o1.position.set(170, 35, -70)
    // o1.scale.set(3, 1.5, 7)
    // scene.add(o1)




	})
}

