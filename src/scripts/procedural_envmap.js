import * as THREE from "three";

export const proceduralEnvironmentHandler = {
    environment: null,
    scene: null,
    renderer: null,
    init: init,
}

function init(scene, renderer) {
    proceduralEnvironmentHandler.scene = scene;
    proceduralEnvironmentHandler.renderer = renderer;
    
    const proceduralEnvironment = new ProceduralEnvironment();
    proceduralEnvironmentHandler.environment = new THREE.PMREMGenerator(renderer).fromScene(proceduralEnvironment).texture;
    scene.environment = proceduralEnvironmentHandler.environment;
}

class ProceduralEnvironment extends THREE.Scene {

	constructor() {

		super();

        const procedualEnvFolder = gui.addFolder('Procedural Environment');
        procedualEnvFolder.close();

		const geometry = new THREE.BoxGeometry();
		geometry.deleteAttribute( 'uv' );
		const roomMaterial = new THREE.MeshStandardMaterial( { metalness: 0, side: THREE.BackSide } );
		const room = new THREE.Mesh( geometry, roomMaterial );
		room.scale.setScalar( 10 );
		this.add( room );

		const mainLight = new THREE.PointLight( 0xFFFFFF, 50, 0, 2 );
		this.add( mainLight );
        procedualEnvFolder.addColor(mainLight, 'color').onFinishChange((event) => console.log(event.getHexString()));
        procedualEnvFolder.add(mainLight, 'intensity');
        
        const materialTop = new THREE.MeshBasicMaterial( { color: 0xffffff, emissiveIntensity: 5 } );
		const lightTop = new THREE.Mesh( geometry, materialTop );
		lightTop.position.set( 0, 5, 0 );
		lightTop.scale.set( 2, 0.1, 2 );
		this.add( lightTop );
        addLightGUI(lightTop, 'Top Light', procedualEnvFolder);
        
        const materialBottom = new THREE.MeshBasicMaterial( { color: 0xffffff, emissiveIntensity: 5 } );
		const lightBottom = new THREE.Mesh( geometry, materialBottom );
		lightBottom.position.set( 0, -5, 0 );
		lightBottom.scale.set( 2, 0.1, 2 );
        lightBottom.visible = false;
		this.add( lightBottom );
        addLightGUI(lightBottom, 'Bottom Light', procedualEnvFolder);

		const materialLeft = new THREE.MeshBasicMaterial( { color: 0xffffff, emissiveIntensity: 5 } );
		const lightLeft = new THREE.Mesh( geometry, materialLeft );
		lightLeft.position.set( - 5, 0, 0 );
		lightLeft.scale.set( 0.1, 2, 2 );
		this.add( lightLeft );
        addLightGUI(lightLeft, 'Left Light', procedualEnvFolder);


        const materialRight = new THREE.MeshBasicMaterial( { color: 0xffffff, emissiveIntensity: 5 } );
		const lightRight = new THREE.Mesh( geometry, materialRight );
		lightRight.position.set( 5, 0, 0 );
		lightRight.scale.set( 0.1, 2, 2 );
		this.add( lightRight );
        addLightGUI(lightRight, 'Right Light', procedualEnvFolder);


		const materialFront = new THREE.MeshBasicMaterial( { color: 0xffffff, emissiveIntensity: 5 } );
		const lightFront = new THREE.Mesh( geometry, materialFront );
		lightFront.position.set( 0, 0, 5 );
		lightFront.scale.set( 2, 2, 0.1 );
		this.add( lightFront );
        addLightGUI(lightFront, 'Front Light', procedualEnvFolder);


        const materialBack = new THREE.MeshBasicMaterial( { color: 0xffffff, emissiveIntensity: 5 } );
		const lightBack = new THREE.Mesh( geometry, materialBack );
		lightBack.position.set( 0, 0, -5 );
		lightBack.scale.set( 2, 2, 0.1 );
		this.add( lightBack );
        addLightGUI(lightBack, 'Back Light', procedualEnvFolder);

        procedualEnvFolder.onChange( event => proceduralEnvironmentHandler.scene.environment = new THREE.PMREMGenerator(proceduralEnvironmentHandler.renderer).fromScene(this).texture );
	}
}

function addLightGUI(obj, name, parentFolder) {
    const folder = parentFolder.addFolder(name);
    folder.close();
    folder.add(obj.position, 'y').name('Pos');
    folder.addVector(obj.scale, 'Size');
    folder.add(obj, 'visible').name('Visibility');
    folder.addColor(obj.material, 'color').name('Color').onFinishChange((event) => console.log(event.getHexString()));
    folder.add(obj.material, 'emissiveIntensity').name('Intensity');
}