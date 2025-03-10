import GUI from 'lil-gui'; 

const gui = new GUI();
window.gui = gui;

// gui.onFinishChange(() => {
//     window.localStorage.setItem('gui', JSON.stringify(gui.save()))
// });

gui.show(true);
document.addEventListener('keydown', (e) => { if (e.altKey && e.key === 'h') gui.show( gui._hidden ); } );

GUI.prototype.addVector = function (vector, name){
    let folder = this.addFolder(name);
    folder.close();
    folder.add(vector, 'x');
    folder.add(vector, 'y');
    if (vector.z != undefined) folder.add(vector, 'z');
}

GUI.prototype.addMaterial = function (material){
    let folder = this.addFolder(material.name);
    folder.close();
    folder.addColor(material, 'color');
    if (material.metalness != undefined) folder.add(material, 'metalness');
    if (material.roughness != undefined) folder.add(material, 'roughness');

    if (material.emissive != undefined) folder.addColor(material, 'emissive');
    if (material.emissiveIntensity != undefined) folder.add(material, 'emissiveIntensity');

    folder.add(material, 'transparent');
    folder.add(material, 'opacity');
    folder.add(material, 'depthWrite');

    if (material.reflectivity != undefined) folder.add(material, 'reflectivity');
    if (material.specularColor != undefined) folder.addColor(material, 'specularColor');
    if (material.specularIntensity != undefined) folder.add(material, 'specularIntensity');
    if (material.transmission != undefined) folder.add(material, 'transmission');
    if (material.thickness != undefined) folder.add(material, 'thickness');
}

GUI.prototype.loadFromLocalStorage = function () {
    const guiData = JSON.parse(window.localStorage.getItem('gui'));
    if (!guiData) return
    delete guiData.controllers.activeRenderer;
    gui.load(guiData);
}