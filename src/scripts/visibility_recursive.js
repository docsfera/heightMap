export function setVisibility(obj, bool){
    if(!obj)return;
    let layer = bool ? 0 : 1;
    obj.visible = bool;
    obj.layers.set(layer);
    obj.children.forEach(el => el.children.length > 0 ? setVisibility(el, bool) : (el.visible = bool, el.layers.set(layer)));
}