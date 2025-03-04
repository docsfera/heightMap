import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { servObj } from './init_glob';

export function makeCSS2Dannotaition(object, text = 'AnnText'){

	if(!object || typeof object != 'object' || !object.isObject3D) return;

	let rotateLine_1 = document.createElement( 'div' );
	rotateLine_1.classList.add('rotation_line_1');
	rotateLine_1.style.position = 'absolute';
	rotateLine_1.style.top = '0';
	rotateLine_1.style.right = '0';

	let line_1 = document.createElement( 'div' );
	line_1.classList.add('line_1');
	line_1.style.position = 'absolute';
	line_1.style.top = '0';
	line_1.style.left = '0';

    rotateLine_1.append(line_1);

    let rotateLine_2 = document.createElement( 'div' );
	rotateLine_2.classList.add('rotation_line_2');
	rotateLine_2.style.position = 'absolute';
	rotateLine_2.style.top = '0';
	rotateLine_2.style.right = '0';

    let line_2 = document.createElement( 'div' );
	line_2.classList.add('line_2');
	line_2.style.position = 'absolute';
	line_2.style.top = '0';
	line_2.style.left = '0';

    let lineText = document.createElement( 'div' );
	lineText.textContent = text;
	lineText.dataset.text = object.name;

	lineText.classList.add('line_text');
	lineText.style.position = 'absolute';
	lineText.style.bottom = '0';
	lineText.style.left = '50%';
	lineText.style.transform = 'translateX(-50%)';

    line_2.append(lineText);
    rotateLine_2.append(line_2);
    line_1.append(rotateLine_2);

	let pointLabel = document.createElement( 'div' );
	pointLabel.classList.add('ann_point_label');
	pointLabel.style.position = 'absolute';
	pointLabel.textContent = text;
	
	let pointHTML = document.createElement( 'div' );
	pointHTML.id = `ann_${object.name || object.id}`;
	pointHTML.classList.add('ann_point');
	pointHTML.style.pointerEvents = 'auto';
	pointHTML.append(pointLabel);
	pointHTML.append(rotateLine_1, pointLabel);
	
	//*************** pointer handler *********************
	// pointHTML.addEventListener('pointerdown', (e)=>{
    //     if(!servObj.showAllAnns){
    //         Array.from(document.querySelectorAll('.ann_point_label')).filter(el=>el != pointLabel).forEach(el=>el.classList.remove('visible'));
    //         Array.from(document.querySelectorAll('.line_1, .line_2, .line_text')).filter(el=>el != line_1 && el != line_2 && el != lineText).forEach(el=>el.classList.remove('line_visible'));
    //     }; 
	// 	pointLabel.classList.toggle('visible');
	// 	line_1.classList.toggle('line_visible');
	// 	line_2.classList.toggle('line_visible');
	// 	lineText.classList.toggle('line_visible');
	// });

	let point2D = new CSS2DObject(pointHTML);
	point2D.name = 'css2d_' + object.name || 'id_' + object.id;
	object.add(point2D);

	servObj && servObj.annotations && servObj.annotations.push(point2D);
	return point2D;
}

export function initCSS2DRenderer(container){
    let labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize( container.innerWidth, container.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.classList.add('wrap_annotations');
    document.body.appendChild( labelRenderer.domElement );
    return labelRenderer;
}

let raycaster = new THREE.Raycaster(); 
let v3_1 = new THREE.Vector3(); 
let v3_2 = new THREE.Vector3(); 
let v3_3 = new THREE.Vector3();


export function hideInvisibleAnns(camera, annotaitions){
    if(!camera.isCamera || !annotaitions.length || !servObj.toDecomp || !servObj.showAllAnns) return;
	
	annotaitions.forEach(ann=>{
		getWorldPositionNorm(camera, v3_1);
		getWorldPositionNorm(ann, v3_2);
		v3_3.copy(v3_2).sub(v3_1).normalize();
		raycaster.set(v3_1, v3_3);
		raycaster.far = v3_1.distanceTo(v3_2);
		let i = raycaster.intersectObject(servObj.app.scene.children[0], !0);
		// let i = raycaster.intersectObject(findRootObj(ann), !0);
		ann.element.style.display = i.length > 1 || 1 == i.length && i[0].object != ann.parent ? 'none' : 'block';
		ann.element.querySelectorAll('.ann_point_label, .line_1, .line_2, .line_text').forEach(el=>el.classList[i.length > 1 || 1 == i.length && i[0].object != ann.parent ? 'remove' : 'add']('visible', 'line_visible'));
	
	});
}

function getWorldPositionNorm(obj, v3 = new THREE.Vector3()){
    if(!obj) return;
    return v3.setFromMatrixPosition(obj.matrixWorld)
}
function findRootObj(obj) {
    let e = obj;
    return obj.traverseAncestors((function(t){e = t})), e;
}


// export function hideInvisibleAnns(camera, annotaitions){
//     if(!camera.isCamera || !annotaitions.length || !servObj.toDecomp) return;
// 	let objDist = {};
// 	let arrDist = [];

// 	annotaitions.forEach(obj=>{
//         let dist = camera.getWorldPosition(new THREE.Vector3()).distanceTo(obj.getWorldPosition(new THREE.Vector3()));
// 		objDist[dist] = obj.element;
//     });
// 	arrDist = Object.keys(objDist).sort((a,b)=>a-b);
// 	arrDist.forEach((el,indx)=>{
// 		if(indx < arrDist.length/2){
// 			objDist[el].style.display =  'block';
// 		}else{
// 			objDist[el].querySelectorAll('.ann_point_label, .line_1, .line_2, .line_text').forEach(el=>el.classList.remove('visible', 'line_visible'));
// 			objDist[el].style.display =  'none';
// 		}
// 	});
// }