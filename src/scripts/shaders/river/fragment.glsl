
varying  vec3 pos;

void main(){
	if(pos.z > 0.01){
	csm_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	}else{
	csm_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
	}
    
}