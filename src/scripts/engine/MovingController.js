import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

class MovingController {
  constructor(model, animation) {
    this.model = model;
    
    // Анимация
    this.mixer = new THREE.AnimationMixer(model);
    this.action = this.mixer.clipAction(animation);
    this.action.play();
    
    // Параметры движения
    this.moveSpeed = 0.2;
    this.rotationSpeed = 0.02;
    
    // Настройка управления
    this.keys = {};
    this.setupControls();

    this.raycaster = new THREE.Raycaster()
    this.downVector = new THREE.Vector3(0, -1, 0)
    
    
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  getHeightAtPosition(x, y) {
    if(!window.servObj.vertexPositions) return null
    return window.servObj.vertexPositions.filter(v => (Math.abs(v.x - x) < 1 && Math.abs(v.y - y) < 1))[0]
  }

  update(deltaTime) {
    // Обновление анимации
    this.mixer.update(deltaTime);
    
    // Управление движением
    if (this.keys['s'] || this.keys['arrowup']) {
      this.model.translateZ(-this.moveSpeed);
    }
    
    if (this.keys['w'] || this.keys['arrowdown']) {
      this.model.translateZ(this.moveSpeed);
    }
    
    // Управление поворотом
    if (this.keys['a'] || this.keys['arrowleft']) {
        //console.log(this.model)
      this.model.rotation.y += this.rotationSpeed;
    }
    
    if (this.keys['d'] || this.keys['arrowright']) {
      this.model.rotation.y -= this.rotationSpeed;
    }

    this.raycaster.set(this.model.position, this.downVector);

    let c = []

    if(window.servObj.gt){
      c = this.raycaster.intersectObject(window.servObj.gt)
    }
    if(c.length > 0){
      console.log('e', c[0].distance)
      this.model.position.y = c[0].distance + 10
    }
    //console.log(this.raycaster.intersectObject(servObj.scene))

    //const t = this.getHeightAtPosition(this.model.position.x - 100, this.model.position.z - 100)
    //if(t) console.log(t.z) //this.model.position.y = t.z

    const cameraOffset = new THREE.Vector3(0, 5, -30);
    
    // Применяем вращение персонажа к смещению камеры
    cameraOffset.applyQuaternion(this.model.quaternion);
    
    // Устанавливаем позицию камеры
    //this.camera.position.copy(this.model.position.clone().add(cameraOffset));

    const v = this.model.position.clone().add(cameraOffset)
    window.servObj.activeCamera.position.set(v.x, v.y, v.z)
    
    // Направляем камеру на персонажа (немного выше его позиции)
    const lookAtPosition = this.model.position.clone();
    lookAtPosition.y += 1; // Смотрим на уровень груди персонажа


    window.servObj.activeCamera.lookAt(lookAtPosition);

    // window.servObj.activeCamera.controls._target0 = new THREE.Vector3(lookAtPosition.x, lookAtPosition.y, lookAtPosition.z)
    // window.servObj.activeCamera.controls._targetEnd = new THREE.Vector3(lookAtPosition.x, lookAtPosition.y, lookAtPosition.z)

    //window.servObj.activeCamera.controls.update()


    

    
    // window.servObj.activeCamera.controls._target0 = new THREE.Vector3(this.model.position.x, this.model.position.y + 2, this.model.position.z)
    // window.servObj.activeCamera.controls._targetEnd = new THREE.Vector3(this.model.position.x, this.model.position.y + 2, this.model.position.z)
  }
}

// Пример использования

const loader = new FBXLoader();
let controller;

loader.load('Running.fbx', (fbx) => {
  const model = fbx;
  
  // Настройка модели
  model.scale.set(0.02, 0.02, 0.02);
  model.position.set(0, 15.5, 0);
  
  servObj.scene.add(model);
  
  // Создание контроллера
  controller = new MovingController(model, fbx.animations[0]);

  servObj.characterController = controller
});

export default MovingController