
varying vec3 pos;

varying vec2 vUv;

uniform sampler2D uDisplacementMap;
            uniform float uDisplacementScale;

void main(){

vUv = uv;
    //pos = position;

    float displacement = texture2D(uDisplacementMap, uv).r * uDisplacementScale;

    // Модифицируем позицию вершины
    vec3 newPosition = position + normal * displacement;

    pos = newPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}