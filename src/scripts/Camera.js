import {
	Vector2,
	Vector3,
	Vector4,
	Quaternion,
	Matrix4,
	Spherical,
	Box3,
	Sphere,
	Raycaster,
    PerspectiveCamera,
    OrthographicCamera,

    MathUtils,
} from 'three';

const subsetOfTHREE = {
	Vector2,
	Vector3,
	Vector4,
	Quaternion,
	Matrix4,
	Spherical,
	Box3,
	Sphere,
	Raycaster,
};
import CameraControls from 'camera-controls';
//https://github.com/yomotsu/camera-controls

CameraControls.install( { THREE: subsetOfTHREE } );

export const ViewportFitNone = 0;
export const ViewportFitVertical = 1;
export const ViewportFitHorizontal = 2;
export const ViewportFitAuto = 3;
export const ViewportFitFill = 4;
export const ViewportFitOverscan = 5;

export class Perspective extends PerspectiveCamera {

    controls;
    _rotateOnPointerMove = false;
    _truckOnPointerMove = false;
    aspect;
    viewportFit = {};
    

    constructor(canvas, fov, aspect, near, far) {
        super(fov, aspect, near, far);    

        if (!aspect) this.aspect = canvas.offsetWidth / canvas.offsetHeight;
        else this.aspect = aspect
        
        this.viewportFit.initialFov = fov;
        this.viewportFit.initialAspect = this.aspect + 0;
        this.viewportFit.type = ViewportFitFill;

        this.#init(canvas);
    }

    #init(canvas){
        this.controls = new CameraControls( this, canvas );

        this.controls.pointer = new Vector2();
        this.controls._prevPointer = this.controls.pointer.clone();

        const onPointerMove = (event) => {
            this.controls.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.controls.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;          
        }
        window.addEventListener('pointermove', onPointerMove);
        // WIP
    }

    update(deltaTime) {
        
        if (!this.controls.enabled) return;
        this.controls.update(deltaTime);
        this.updateRotationOnMove();
        this.updateTruckOnMove();

    }

    updateRotationOnMove(){
        if (this._rotateOnPointerMove) {
            const azimuthAngle = MathUtils.mapLinear(
                this.controls.pointer.x,
                -1,
                1,
                this.controls.minAzimuthAngle,
                this.controls.maxAzimuthAngle);
            const polarAngle = MathUtils.mapLinear(
                -this.controls.pointer.y,
                -1,
                1,
                this.controls.minPolarAngle,
                this.controls.maxPolarAngle);
            
            this.controls.rotateTo(azimuthAngle, polarAngle, true);
        }
    }

    updateTruckOnMove(){
        if (this._truckOnPointerMove) {

            const truckX =  (this.controls.pointer.x - this.controls._prevPointer.x) * this.controls.maxTruckOffset.x;
            const truckY =  -(this.controls.pointer.y - this.controls._prevPointer.y) * this.controls.maxTruckOffset.y;

            this.controls.truck(truckX, truckY, true);

            this.controls._prevPointer.copy(this.controls.pointer);
        }
    }

    setRotateOnPointerMove(enable) {
        this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
        this._rotateOnPointerMove = enable;
        if (!enable) return;
        this.controls.mouseButtons.left = CameraControls.ACTION.NONE;
    } 

    setTruckOnPointerMove(enable, maxTruckOffset = {x: 1, y: 1}) {
        this.controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
        this._truckOnPointerMove = enable;
        if (!enable) return;
        this.controls.mouseButtons.right = CameraControls.ACTION.NONE;
        
        this.controls.maxTruckOffset = maxTruckOffset;
    }

}

export class Orthographic extends OrthographicCamera {

    controls;
    _rotateOnPointerMove = false;
    _truckOnPointerMove = false;
    aspect;
    viewportFit = {};

    constructor(canvas, left, right, top, bottom, near, far) {
        super(left, right, top, bottom, near, far);    
        
        this.aspect =  (right - left) / (top - bottom);
        this.viewportFit.initialAspect = this.aspect + 0;
        this.viewportFit.type = ViewportFitFill;

        this.#init(canvas);
    }

    #init(canvas) {
        this.controls = new CameraControls( this, canvas );
        this.controls.mouseButtons.middle = CameraControls.ACTION.ZOOM;

        this.controls.pointer = {x: 0, y: 0};
        const onPointerMove = (event) => {
            this.controls.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.controls.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        }
        window.addEventListener('pointermove', onPointerMove);
        // WIP
    }

    update(deltaTime) {
        
        if (!this.controls.enabled) return;
        this.controls.update(deltaTime);
        this.updateRotationOnMove();
        this.updateTruckOnMove();

    }

    updateRotationOnMove(){
        if (this._rotateOnPointerMove) {
            const azimuthAngle = MathUtils.mapLinear(
                this.controls.pointer.x,
                -1,
                1,
                this.controls.minAzimuthAngle,
                this.controls.maxAzimuthAngle);
            const polarAngle = MathUtils.mapLinear(
                -this.controls.pointer.y,
                -1,
                1,
                this.controls.minPolarAngle,
                this.controls.maxPolarAngle);
            
            this.controls.rotateTo(azimuthAngle, polarAngle, true);
        }
    }

    updateTruckOnMove(){
        if (this._truckOnPointerMove) {

            const truckX =  (this.controls.pointer.x - this.controls._prevPointer.x) * this.controls.maxTruckOffset.x;
            const truckY =  -(this.controls.pointer.y - this.controls._prevPointer.y) * this.controls.maxTruckOffset.y;

            this.controls.truck(truckX, truckY, true);

            this.controls._prevPointer.copy(this.controls.pointer);
        }
    }

    setRotateOnPointerMove(enable) {
        this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
        this._rotateOnPointerMove = enable;
        if (!enable) return;
        this.controls.mouseButtons.left = CameraControls.ACTION.NONE;
    } 

    setTruckOnPointerMove(enable, maxTruckOffset = {x: 1, y: 1}) {
        this.controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
        this._truckOnPointerMove = enable;
        if (!enable) return;
        this.controls.mouseButtons.right = CameraControls.ACTION.NONE;
        
        this.controls.maxTruckOffset = maxTruckOffset;
    }
}