import * as THREE from "three"
import grassV from '../shaders/grass/vertex.glsl'
import grassF from '../shaders/grass/fragment.glsl'

const textureScaleZ = 0.4//0.6

export const gg = (pixels, tt, scene) => {
    // Конвертируем обратно в мировые координаты
	const indicesArr = [] 
    const vertexPositions = [];
    const verticesArr = [];
    let j = 0
    for (let i = 0; i < pixels.length; i += 4) {
        const x = pixels[i];
        const y = pixels[i + 1];
        const z = pixels[i + 2]  * textureScaleZ;
        if (z > 5) { // x !== 0 || y !== 0 || z !== 0 Фильтруем пустые пиксели
            vertexPositions.push(new THREE.Vector3(x, y, z));
            indicesArr.push(j, j+1, j+2)
            verticesArr.push(x, y, z)
            j+=3
        }
    }
    //console.log('Позиции вершин:', vertexPositions);

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
		wireframe: true,
		side: THREE.DoubleSide
	})

	const planeByTexture = new THREE.Mesh(planeByTextureGeometry, planeByTextureMaterial)
	planeByTexture.rotation.x = -Math.PI / 2
	planeByTexture.updateMatrixWorld(true)
	//scene.add(planeByTexture)

	console.warn({planeByTexture})

	return planeByTexture
}

const ggLOD = (pixels, tt, scene) => {
	const indicesArrLOD = [] 
    const vertexPositionsLOD = [];
    const verticesArrLOD = [];
    let k = 0
    for (let i = 0; i < pixels.length; i += 4) {
        const x = pixels[i];
        const y = pixels[i + 1];
        const z = pixels[i + 2]  * textureScaleZ;
        if (z > 5) { // x !== 0 || y !== 0 || z !== 0 Фильтруем пустые пиксели
            vertexPositionsLOD.push(new THREE.Vector3(x, y, z));
            indicesArrLOD.push(k, k+1, k+2)
            verticesArrLOD.push(x, y, z)
            k+=3
        }
    }

	const planeByTextureVerticesLOD = new Float32Array(verticesArrLOD)
	const planeByTextureIndicesArrLOD = []

	for (let y = tt - 2; y >= 0; y--) {
		for (let x = tt - 2; x >= 0; x--) {
		    // Вычисляем индексы вершин для текущего квада
		    const a = (y + 1) * tt + x + 1  // Право-низ
		    const b = (y + 1) * tt + x      // Лево-низ
		    const c = y * tt + x + 1        // Право-верх
		    const d = y * tt + x            // Лево-верх

		    // Первый треугольник (правый нижний треугольник квада)
		    planeByTextureIndicesArrLOD.push(a, b, c)
		    // Второй треугольник (левый верхний треугольник квада)
		    planeByTextureIndicesArrLOD.push(c, b, d)
		}
	}
	const planeByTextureIndicesLOD = new Uint16Array(planeByTextureIndicesArrLOD)

	const planeByTextureGeometryLOD = new THREE.BufferGeometry()
	planeByTextureGeometryLOD.setAttribute('position', new THREE.BufferAttribute(planeByTextureVerticesLOD, 3))
	planeByTextureGeometryLOD.setIndex(new THREE.BufferAttribute(planeByTextureIndicesLOD, 1))


	/////////// GRASSS ///////////
		
	

	const planeByTextureMaterialLOD = new THREE.MeshStandardMaterial({
		color: new THREE.Color(0.05, 0.2, 0.01),
		wireframe: true,
		side: THREE.DoubleSide
	})

	const planeByTextureLOD = new THREE.Mesh(planeByTextureGeometryLOD, planeByTextureMaterialLOD)
	planeByTextureLOD.rotation.x = -Math.PI / 2
	planeByTextureLOD.updateMatrixWorld(true)

	return planeByTextureLOD
}

export const getGrass = (mask, pixels, tt, scene) => {
	const grassCount = 200000
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

	const grassGeometry = new THREE.BufferGeometry()
	grassGeometry.setAttribute('position', new THREE.BufferAttribute(grassVertexsArray, 3))
	grassGeometry.setAttribute('uv', new THREE.BufferAttribute(grassUvs, 2))
	//grassGeometry.setAttribute('iscale', new THREE.InstancedBufferAttribute(new Float32Array([0.01,0.01,0.01]), 3, false, 1))
	grassGeometry.setIndex(new THREE.BufferAttribute(grassIndices, 1))

	const grassUvsLOD = new Float32Array([0, 0, 1, 0.33, 1, 0])
	const grassIndicesLOD = new Uint16Array([0, 1, 2])
	const grassVertexsArrayLOD = new Float32Array([-0.1, 0, 0, 0.0,  1, 0, 0.0, 0, 0])

	const grassGeometryLOD = new THREE.BufferGeometry()
	grassGeometryLOD.setAttribute('position', new THREE.BufferAttribute(grassVertexsArrayLOD, 3))
	grassGeometryLOD.setAttribute('uv', new THREE.BufferAttribute(grassUvsLOD, 2))
	//grassGeometryLOD.setAttribute('iscale', new THREE.InstancedBufferAttribute(new Float32Array([0.01,0.01,0.01]), 3, false, 1))
	grassGeometryLOD.setIndex(new THREE.BufferAttribute(grassIndicesLOD, 1))

	let grassMaterial = new THREE.ShaderMaterial({
		vertexShader: grassV,
		fragmentShader: grassF,
		side: THREE.DoubleSide,
		uniforms: {
			pathMask: { value: mask },
			uTime: { value: 0.0 }
		},
	})
	servObj.grassMaterial = grassMaterial

	let mm = new THREE.MeshBasicMaterial({color: "red"})

	const planeByTexture = gg(pixels, tt, scene)
	//const planeByTextureLOD = ggLOD(pixels, tt, scene)

	const grasses = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount)
	const grassesLOD = new THREE.InstancedMesh(grassGeometryLOD, grassMaterial, grassCount * 10)

	//grassGeometry.attributes.iscale.needsUpdate = true

	const planeByTextureVerticesVectors = []
	const planeByTextureVertexsPositions = planeByTexture.geometry.attributes.position.array

	const planeByTextureVerticesVectorsLOD = []
	//const planeByTextureVertexsPositionsLOD = planeByTextureLOD.geometry.attributes.position.array

	//console.log(planeByTextureVertexsPositions)

	for (let i = 0; i < planeByTextureVertexsPositions.length; i += 3) {
		if(planeByTextureVertexsPositions[i+1] > -50 && planeByTextureVertexsPositions[i+1] < 50 && planeByTextureVertexsPositions[i] > -50 && planeByTextureVertexsPositions[i] < 50) {
			planeByTextureVerticesVectors.push(new THREE.Vector3(planeByTextureVertexsPositions[i], planeByTextureVertexsPositions[i+1], planeByTextureVertexsPositions[i+2]))
		}else{
			planeByTextureVerticesVectorsLOD.push(new THREE.Vector3(planeByTextureVertexsPositions[i], planeByTextureVertexsPositions[i+1], planeByTextureVertexsPositions[i+2]))
		}
	}
	console.log(planeByTextureVerticesVectors)
	console.log(planeByTextureVerticesVectorsLOD)
	// for (let i = 0; i < planeByTextureVertexsPositionsLOD.length; i += 3) {
	// 	planeByTextureVerticesVectorsLOD.push(new THREE.Vector3(planeByTextureVertexsPositionsLOD[i], planeByTextureVertexsPositionsLOD[i+1], planeByTextureVertexsPositionsLOD[i+2]))
	// }

	const prevRandoms = new Set();
	const dummy = new THREE.Object3D();

	const prevRandomsLOD = new Set();
	const dummyLOD = new THREE.Object3D();

	for (let i = 0; i < grassCount; i++) {
		let random
	    // do {
	    //     random = Math.floor(Math.random() * planeByTextureVerticesVectors.length)
	    // } while (prevRandoms.has(random))

			random = Math.floor(Math.random() * planeByTextureVerticesVectors.length)

	    prevRandoms.add(random)

		const randomVertexVector = planeByTextureVerticesVectors[random]

		dummy.position.set(randomVertexVector.x * 2 + Math.random() * 0.8 , randomVertexVector.z, randomVertexVector.y * 2 + Math.random() * 0.8 ); // расширяет траву (костыль)
		dummy.rotation.y = Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5)
		dummy.updateMatrix();
		grasses.setMatrixAt(i, dummy.matrix)
	}
	let u = 0
	let urand = 0
	for (let i = 0; i < grassCount * 10; i++) {
		let random
		
	    // do {
	    //     random = Math.floor(Math.random() * planeByTextureVerticesVectorsLOD.length)
		// 	u = u+1
			
	    // } while (prevRandomsLOD.has(random))

			random = Math.floor(Math.random() * planeByTextureVerticesVectorsLOD.length)
			if(prevRandomsLOD.has(random)) urand ++

			

	    prevRandomsLOD.add(random)

		const randomVertexVectorLOD = planeByTextureVerticesVectorsLOD[random]

		dummyLOD.position.set(randomVertexVectorLOD.x * 2 + Math.random() * 0.8 , randomVertexVectorLOD.z, randomVertexVectorLOD.y * 2 + Math.random() * 0.8 ); // расширяет траву (костыль)
		dummyLOD.rotation.y = Math.PI / 2 * (Math.round(Math.random()) * 2 - 1) + Math.PI / 2 * (Math.random() - 0.5)
		dummyLOD.updateMatrix();
		grassesLOD.setMatrixAt(i, dummyLOD.matrix)
	}

	console.log(u)
	console.log(planeByTextureVerticesVectorsLOD.length, grassCount)
	console.log({urand})

	grasses.instanceMatrix.setUsage(THREE.StaticDrawUsage)
	grasses.instanceMatrix.needsUpdate = true
	grasses.scale.z = -1

	grassesLOD.instanceMatrix.setUsage(THREE.StaticDrawUsage)
	grassesLOD.instanceMatrix.needsUpdate = true
	grassesLOD.scale.z = -1

	console.warn(grassesLOD.frustumCulled)
	

	return {grasses, grassesLOD}
}
