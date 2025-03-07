#include <fog_pars_fragment>
uniform float uTime;
varying vec2 vUv;

void main(){

		// Normalized UV coordinates (from 0 to 1)
	     vec2 uv = vUv;
	    
	    // Time varying for animation
	    float t = uTime * 0.5;
	    
	    // Create water waves using sine functions
	    vec2 wave = vec2(
	        sin(uv.x * 10.0 + t) * 0.05,
	        sin(uv.y * 8.0 + t * 1.1) * 0.03
	    );
	    
	    // Add some noise for more organic ripples
	    //float noise = fract(sin(dot(uv + t * 0.1, vec2(12.9898,78.233))) * 43758.5453) * 0.1;
	    
	    // Distort UV coordinates for ripples
	    vec2 distortedUV = uv + wave ;
	    
	    // Base water color (blue-green gradient)
	    vec3 baseColor = vec3(0.0, 0.3, 0.6); // Deep blue
	    vec3 shallowColor = vec3(0.0, 0.5, 0.8); // Lighter blue-green
	    
	    // Mix colors based on depth (simulated by y-coordinate)
	    float depth = smoothstep(0.0, 1.0, distortedUV.y);
	    vec3 waterColor = mix(shallowColor, baseColor, depth);
	    
	    // Add reflection effect using sine waves
	    float reflection = sin(distortedUV.x * 20.0 + distortedUV.y * 20.0 + t * 2.0) * 0.5 + 0.5;
	    waterColor = mix(waterColor, vec3(1.0), reflection * 0.3); // Add white highlights
	    
	    // Add foam at the edges (top of water)
	    float foam = smoothstep(0.9, 1.0, distortedUV.y);
	    waterColor = mix(waterColor, vec3(1.0), foam * 0.2);
	    
	    // Add subtle specular highlights
	    float specular = pow(max(0.0, reflection), 10.0);
	    waterColor += vec3(1.0) * specular * 0.5;
	    
	    // Output to screen
	    gl_FragColor = vec4(waterColor, 1.0);


	    #include <fog_fragment>
	
    
}