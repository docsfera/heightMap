import * as THREE from 'three';
export function createPoints(scene, pointsAmount = 1000, pointsMaterial) {
    const vertices = [];

    for ( let i = 0; i < pointsAmount; i ++ ) {
        const x = THREE.MathUtils.randFloatSpread( 1 );
        const y = THREE.MathUtils.randFloatSpread( 1 );
        const z = THREE.MathUtils.randFloatSpread( 1 );

        vertices.push( x, y, z );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    if (!pointsMaterial) pointsMaterial = new THREE.PointsMaterial({color: 0x555555, sizeAttenuation: false, size: 3});
    const points = new THREE.Points( geometry, pointsMaterial );
    scene.add( points );
}