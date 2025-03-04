import * as THREE from "three";

extendMeshBasicMaterial();

const materialList = [];

export const materials = {
	list: materialList,
	setMaterial: setMaterial,
	updatableMaterials: [],
    getMaterial: getMaterial,
};

function getMaterial(name) {
    return materialList.find( mat => mat.name === name);
}

function setMaterial(object) {
	let existingMaterial;
	if (materialList.length > 0) {
		existingMaterial = materialList.find((mat) => mat.name === object.material.name);
	}

	if (existingMaterial) {
		object.material = existingMaterial.isUnique ? existingMaterial.clone() : existingMaterial;
		return;
	}

	if (object.material.type === "MeshBasicMaterial") {

	}

	materialList.push(object.material);
}

function extendMeshBasicMaterial() {

    Object.defineProperty(THREE.MeshBasicMaterial.prototype, 'emissiveIntensity', {
        get: function() {
            return this._emissiveIntensity !== undefined ? this._emissiveIntensity : 1.0;
        },
        set: function(value) {
            this._emissiveIntensity = value;
            if (this.userData && this.userData.shader) {
                this.userData.shader.uniforms.emissiveIntensity.value = value;
            }
        }
    });

    THREE.MeshBasicMaterial.prototype.onBeforeCompile = function(shader) {
        shader.uniforms.emissiveIntensity = { value: this.emissiveIntensity };
        shader.fragmentShader = 'uniform float emissiveIntensity;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
            'vec4 diffuseColor = vec4( diffuse, opacity );',
            'vec4 diffuseColor = vec4( diffuse * emissiveIntensity, opacity );'
        );
        this.userData.shader = shader;
    };
}