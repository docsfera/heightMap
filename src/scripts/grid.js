import { GridHelper, Color, Object3D } from 'three'

export default function(scene, divisions = 50, cellSize = 2, name = ''){
    if(!scene) return;

    let gridSize;
    gridSize = divisions * cellSize;

    const grid = new Object3D();
    grid.name = name;

    const gridLarge = new GridHelper( gridSize, gridSize / 2, new Color(0xFFFFFF), new Color(0xFFFFFF));
    gridLarge.position.y = 0.01;
    gridLarge.material.transparent = true;
    gridLarge.material.opacity = .2;
    grid.add( gridLarge );

    const gridMid = new GridHelper( gridSize, gridSize, new Color(0xFFFFFF), new Color(0xFFFFFF));
    gridMid.position.y = 0.015;
    gridMid.material.transparent = true;
    gridMid.material.opacity = .15;
    grid.add( gridMid );

    const gridSmall = new GridHelper( gridSize, gridSize * 2, new Color(0xFFFFFF), new Color(0xFFFFFF));
    gridSmall.material.transparent = true;
    gridSmall.material.opacity = .1;
    grid.add( gridSmall );

    scene.add(grid);
}