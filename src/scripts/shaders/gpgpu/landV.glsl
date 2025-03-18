uniform sampler2D uDisplacementMap;
    uniform float uDisplacementScale;
    varying vec2 vUv;
    varying vec3 vPosition;

void main(){
	vUv = uv;
	// Получаем значение смещения из текстуры
      float displacement = texture2D(uDisplacementMap, vUv).r;
      
      // Применяем смещение к позиции вершины
      vec3 newPosition = position + normal * displacement * uDisplacementScale;

      vPosition = newPosition;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}