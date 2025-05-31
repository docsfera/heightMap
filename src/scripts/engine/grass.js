import * as THREE from "three"
import grassV from '../shaders/grass/vertex.glsl'
import grassF from '../shaders/grass/fragment.glsl'

const textureScaleZ = 0.4//0.6

export const gg = (pixels, tt) => {
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

	return planeByTexture
}

export const getGrass = (mask, pixels, tt) => {
	const grassCount = 400000
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

	//console.log({grassGeometry})

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

	const planeByTexture = gg(pixels, tt)



	const grasses = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount)

	grassGeometry.attributes.iscale.needsUpdate = true

	const planeByTextureVerticesVectors = []

	const planeByTextureVertexsPositions = planeByTexture.geometry.attributes.position.array

	for (let i = 0; i < planeByTextureVertexsPositions.length; i += 3) {
		planeByTextureVerticesVectors.push(new THREE.Vector3(planeByTextureVertexsPositions[i], planeByTextureVertexsPositions[i+1], planeByTextureVertexsPositions[i+2]))
	}

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

	grasses.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
	grasses.instanceMatrix.needsUpdate = true
	grasses.scale.z = -1
	

	return grasses
}
