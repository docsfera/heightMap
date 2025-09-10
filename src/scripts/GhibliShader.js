import * as THREE from "three";

export const GhibliShader = {
  uniforms: THREE.UniformsUtils.merge([
    THREE.UniformsLib[ 'fog' ], {
      colorMap: {
        value: [
          new THREE.Color("#7ed3b9"),
          new THREE.Color("#6ab9a2"),
          new THREE.Color("#539d87"),
          new THREE.Color("#307e75"),
        ],
      },
      brightnessThresholds: {
        value: [0.9, 0.45, 0.001],
      },
      lightPosition: { value: new THREE.Vector3(0, 1500, 0) },
      
    }
  ]),
  fog: true,
  
  vertexShader: /* glsl */ `
    #include <fog_pars_vertex>
    precision highp float;
    precision highp int;

    // Variables to pass from vertex to fragment shader
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normal;
      vPosition = position;

      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      #include <begin_vertex>
      #include <project_vertex>
      #include <fog_vertex>
    }`,
  fragmentShader: /* glsl */ `
  #include <fog_pars_fragment>
    precision highp float;
    precision highp int;

    // Default THREE.js uniforms available to both fragment and vertex shader
    uniform mat4 modelMatrix;

    uniform vec3 colorMap[4];
    uniform float brightnessThresholds[3];
    uniform vec3 lightPosition;

    // Variables passed from vertex to fragment shader
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 worldPosition = ( modelMatrix * vec4( vPosition, 1.0 )).xyz;
      vec3 worldNormal = normalize( vec3( modelMatrix * vec4( vNormal, 0.0 ) ) );
      vec3 lightVector = normalize( lightPosition - worldPosition );
      float brightness = dot( worldNormal, lightVector );

      vec4 final;

      if (brightness > brightnessThresholds[0])
        final = vec4(colorMap[0], 1);
      else if (brightness > brightnessThresholds[1])
        final = vec4(colorMap[1], 1);
      else if (brightness > brightnessThresholds[2])
        final = vec4(colorMap[2], 1);
      else
        final = vec4(colorMap[3], 1);

      gl_FragColor = vec4( final ) * vec4(1.0);

      #include <fog_fragment>
    }`,
    
};
