import * as THREE from "three";

import landF from '../shaders/gpgpu/landF.glsl'
import landV from '../shaders/gpgpu/landV.glsl'

const textureLoader = new THREE.TextureLoader()

const fragColorPlaneWidth = 400
const fragColorPlaneHeight = 400
const fragColorPlaneSegments = 1000 //mapPlaneSegments//mapPlaneSegments

const wh = 400 // расширение травы !!!!!!

const planePositionsSize = 5

const options = {
	type: THREE.FloatType
  // format: THREE.RGBAFormat,    // Формат данных
  // type: THREE.FloatType,       // Тип данных (для HDR)
  // minFilter: THREE.LinearFilter,
  // magFilter: THREE.LinearFilter,
  // stencilBuffer: false
};

export const getFragColorPlane = (displacement) => {
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

	const _fragColorPlane = new THREE.Mesh(fragColorPlaneGeometry, fragColorPlaneMaterial)
	_fragColorPlane.rotation.x = -Math.PI / 2
	_fragColorPlane.position.y = 0.1

	const fragColorPlane = _fragColorPlane.clone()
	fragColorPlane.rotation.z = -Math.PI / 2

	return fragColorPlane
}

export const getCameraFragColorPlane = () => {
	const textureCamera = new THREE.OrthographicCamera( wh / - 2, wh / 2, wh / 2, wh / - 2, 1, 1000 )
	textureCamera.position.y = 100
	textureCamera.lookAt(0,0,0)

	return textureCamera
}

export const getSceneFragColorPlane = (displacement) => {
	const textureScene = new THREE.Scene()
	const fragColorPlane = getFragColorPlane(displacement)
	textureScene.add(fragColorPlane)

	return textureScene
}

export const getRenderTarget = (scene, tt) => {
	const renderTargetWidth = tt
	const renderTargetHeight = tt

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

	

	return renderTarget
}