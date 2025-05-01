varying vec2 vUv;
varying vec2 vTerrainUV; // UV для маски
uniform sampler2D pathMask;

void main(){

	vUv = uv;
	vec3 newPos = position;


    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(newPos, 1.0);
    vTerrainUV = (worldPosition.xz + vec2(100.0)) / 200.0; // Для плоскости 200x200 ////////////////////////////////////////// 200!!!!! TODO


    vec4 mask = texture2D(pathMask, vTerrainUV);
    if (mask.r > 0.5) newPos *= 0.0;
    
    if (mask.r > 0.02) newPos *= 0.3;
    if (mask.r > 0.09) newPos *= 0.7 / 0.3;

	gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(newPos, 1.0);
}