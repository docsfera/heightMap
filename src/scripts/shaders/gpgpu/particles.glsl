void main()
{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle = texture(uParticles, uv);
    gl_FragColor = vec4(particle.x, 0.0, 0.0, 1.0);
    //gl_FragColor = particle;
}