uniform sampler2D uParticlesTexture;

attribute vec2 aParticlesUv;
void main()
{
    vec4 particle = texture(uParticlesTexture, aParticlesUv);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.0);
    // ...
}