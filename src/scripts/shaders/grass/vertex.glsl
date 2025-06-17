varying vec2 vUv;
varying vec2 vTerrainUV; // UV для маски
uniform sampler2D pathMask;
uniform float uTime;

void main(){

	vUv = uv;
	vec3 newPos = position;

	 vec4 worldPosition = modelMatrix * instanceMatrix * vec4(newPos, 1.0);
    vTerrainUV = (worldPosition.xz + vec2(400.0)) / 800.0; // Для плоскости 800x800 ////////////////////////////////////////// 800!!!!! TODO (для 200 было vec2(1000.0)) / 200.0

	

	if(vUv.y > 0.95) { // Верхняя часть UV-развертки
	    newPos.x += sin(uTime / 80.0) / 10.0;
	}
	if(vUv.y > 0.5 && vUv.y < 0.95) { // Верхняя часть UV-развертки
	    newPos.x += sin(uTime / 80.0) / 20.0;
	}


   


    vec4 mask = texture2D(pathMask, vTerrainUV);
    if (mask.r > 0.5) newPos *= 0.0;
    
    //if (mask.r > 0.02) newPos *= 0.3;
    //if (mask.r > 0.09) newPos *= 0.7 / 0.3;

	gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(newPos, 1.0);
}