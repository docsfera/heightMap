varying vec2 vUv;
varying vec3 vPosition;

void main()
{
    //vec2 uv = gl_FragCoord.xy / resolution.xy;
    //vec4 particle = texture(uParticles, uv);
    gl_FragColor = vec4(vPosition, 1.0);
}