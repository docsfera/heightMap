varying vec2 vUv;
varying vec2 vTerrainUV;
uniform sampler2D pathMask;

void main(){
	vec4 mask = texture2D(pathMask, vTerrainUV);
    //if (mask.r > 0.5) discard; // Отбрасываем пиксели, где маска темная
    
    // Оригинальный цвет травы
    vec3 baseColor = vec3(0.2, 0.6, 0.3);
    vec3 tipColor = vec3(0.4, 0.9, 0.5);
    vec3 clr = mix(baseColor, tipColor, vUv.y);
    
    //diffuseColor = vec4(clr , 1.0);

	gl_FragColor = vec4(clr, 1.0);
}