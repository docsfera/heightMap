import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import floatingPointsFloatVertexShader from './shaders/floatingPoints/vertex.glsl'
import floatingPointsFragmentShader from './shaders/floatingPoints/fragment.glsl'
import { PointsMaterial, Uniform, Vector3 } from 'three';
import { materials } from "./materials.js";

let elapsedTime = 0;

const uniforms = {
    uTest: new Uniform(1),
    
    uSizeTime: new Uniform(0),
    uPositionTime: new Uniform(0),
    uDirectionOffsetTime: new Uniform(0),
    uFlowTime: new Uniform(.1),
    uMinSize: new Uniform(1),
    uMaxSize: new Uniform(3),
    uSizeNoiseFrequency: new Uniform(5),
    uPositionNoiseFrequency: new Uniform(10),
    uPositionOffsetStrength: new Uniform(.1),
    uDirectionOffset: new Uniform(new Vector3(0, 0, 0)),
    uCatmullRomPoints: new Uniform(new Array(1000).fill(new Vector3(0, 0, 0))),
    uCatmullRomPointsLength: new Uniform(1),
};

export function createFloatingPointsMaterial(splineGeometry) {
    const floatingPointsMaterial = new CustomShaderMaterial({
        baseMaterial: PointsMaterial,
        vertexShader: floatingPointsFloatVertexShader,
        fragmentShader: floatingPointsFragmentShader,
        uniforms: uniforms,
    });
    floatingPointsMaterial.animationUpdate = update;
    floatingPointsMaterial.sizeWobbleSpeed = .5;
    floatingPointsMaterial.positionFloatSpeed = .2;
    floatingPointsMaterial.uDirectionOffsetSpeed = .1;
    floatingPointsMaterial.flowSpeed = .05;
    materials.updatableMaterials.push(floatingPointsMaterial);

    //tmp
    floatingPointsMaterial.sizeAttenuation = false;
    
    if (!splineGeometry) return floatingPointsMaterial;

    const splineVertPositions = splineGeometry.attributes.position.array;
    floatingPointsMaterial.uniforms.uCatmullRomPointsLength = new Uniform(splineVertPositions.length / 3);
    for (let i = 0; i < splineVertPositions.length; i+=3) {
        floatingPointsMaterial.uniforms.uCatmullRomPoints.value[i / 3] = new Vector3(
            splineVertPositions[i], 
            splineVertPositions[i + 1], 
            splineVertPositions[i + 2]
        ); 
        console.log(i / 3);
    }
    console.log(floatingPointsMaterial.uniforms.uCatmullRomPoints.value);
    return floatingPointsMaterial;
}

function update(deltaTime){
    this.uniforms.uSizeTime.value += deltaTime * this.sizeWobbleSpeed;
    this.uniforms.uPositionTime.value += deltaTime * this.positionFloatSpeed;
    this.uniforms.uDirectionOffsetTime.value += deltaTime * this.uDirectionOffsetSpeed;
    this.uniforms.uFlowTime.value += deltaTime * this.flowSpeed;
}