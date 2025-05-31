import * as THREE from "three";

import waterV from '../shaders/water/vertex.glsl'
import waterF from '../shaders/water/fragment.glsl'

const mapPlaneWidth = 200
const mapPlaneHeight = 200
const mapPlaneSegments = 400
const mapPlaneDisplacementScale = 20

const riverPlaneSegments = 2

const textureLoader = new THREE.TextureLoader()
const sand = textureLoader.load('./3d/animesand.jpg')
//const sand = textureLoader.load('./3d/sand.png')
//const displacement = textureLoader.load('./3d/map2.jpg')

const map = textureLoader.load('./3d/tex2.jpg')
map.wrapS = THREE.RepeatWrapping;
map.wrapT = THREE.RepeatWrapping;
map.repeat.set(10, 10); // Масштаб текстуры

export const addMapPlane = (displacement, mask, scene) => {
    
    sand.wrapS = THREE.RepeatWrapping;
    sand.wrapT = THREE.RepeatWrapping;
    sand.repeat.set(10, 10) // Масштаб текстуры
    sand.needsUpdate = true

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

    const mapPlane = new THREE.Mesh(mapPlaneGeometry, mapPlaneMaterial)

    mapPlane.rotation.x = -Math.PI / 2
    mapPlane.position.y = 0.1
    scene.add(mapPlane)
}

export const addRiverPlane = (scene) => {
    const riverMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib[ 'fog' ], {
                uTime: {value: 0.0}
            }
        ]),
        vertexShader: waterV,
        fragmentShader: waterF,
        fog: true,
    })

    const riverPlane = new THREE.Mesh(new THREE.PlaneGeometry(mapPlaneWidth, mapPlaneHeight, riverPlaneSegments, riverPlaneSegments), riverMaterial)
    riverPlane.rotation.x = - Math.PI / 2
    riverPlane.position.y = 2
    scene.add(riverPlane)

    return riverPlane 
}