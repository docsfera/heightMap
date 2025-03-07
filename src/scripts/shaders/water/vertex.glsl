#include <fog_pars_vertex>
varying vec2 vUv;

void main(){
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	#include <begin_vertex>
	#include <project_vertex>
	#include <fog_vertex>
}