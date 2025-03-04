//ПЕРЕПИСАТЬ
import { annotations } from './annotations.js';
import { animations } from './animations.js';

export const selecting = {
    init: init,
    setSelectable: setSelectable,
}

let selectable;
let selectedObject;
let scene;
let prevHoveredObject;

function init(pScene){
    scene = pScene;

    servObj.onHover3D.push( (intersects) => highlightHoveredObject(intersects[0].object) );
    servObj.onClick3D.push( (intersects) => setSelectedObject(intersects[0].object) );
}

function setSelectable(objNames){
    selectable = objNames
}

function highlightHoveredObject(hoveredObject) {
    if (!selectable) return;

    if (
        prevHoveredObject && 
        prevHoveredObject !== hoveredObject &&
        prevHoveredObject !== selectedObject &&
        selectable.includes(prevHoveredObject.name)
    )
    {
        highlightObject(prevHoveredObject, false);
    }
    
    if (hoveredObject && selectable.includes(hoveredObject.name)) {
        highlightObject(hoveredObject, true);
    }

    prevHoveredObject = hoveredObject;
}

function setSelectedObject(object) {
    if (!selectable) return;
    selectedObject = object;
    // if (selectedObject) annotations.setTextVisibility(selectedObject.name, true);
    selectable.map(deselect);
    return;
}

function highlightObject(obj, selected) {
    animations.highlightObj(obj, selected)
    annotations.setAnnVisibility(obj.name, selected);
}

function deselect(objName) {
    if (selectedObject && objName === selectedObject.name) return;

    const obj = scene.getObjectByName(objName);
    highlightObject(obj, false)
    annotations.setTextVisibility(objName, false);
}