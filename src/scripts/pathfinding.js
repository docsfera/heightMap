import * as PF from  'pathfinding';
import * as THREE from 'three';

export const pathfinder = {
    init: init,
    findPath: findPath,
    createInstancedGrid: createInstancedGrid,
    clearInstancedColor: clearInstancedColor
};

let grid, finder;
const gridPositions = [];

function init(gridDivisions, cellSize, obstaclesArray = []){

    grid = new PF.Grid(gridDivisions, gridDivisions); 
    
    for(let i = 0; i < gridDivisions; i++){
        gridPositions[i] = [];

        for(let j = 0; j < gridDivisions; j++){
            const posX = (i - (gridDivisions / 2)) * cellSize + (cellSize * .5);
            const posZ = (j - (gridDivisions / 2)) * cellSize + (cellSize * .5);

            gridPositions[i].push(new THREE.Vector3(posX, 0, posZ));

            if(obstaclesArray.length > 0){
                obstaclesArray.forEach( obstacle => {
                    if (obstacle.containsPoint(gridPositions[i][j])) grid.setWalkableAt(i, j, false);
                });
            }
        }
    }

    finder = new PF.AStarFinder({ allowDiagonal: true, });
}

function findPath(startX, startY, endX, endY){
    if (!finder) {
        console.log('Call initPathfindingGrid function first');
        return;
    }
    const path = {nodes: [], positions: []}
    path.nodes = finder.findPath(startX, startY, endX, endY, grid.clone());
    path.nodes.forEach( (node, i) => path.positions[i] = gridPositions[node[0]][node[1]]);

    return path;
}

function createInstancedGrid(cellSize, name){
    if (gridPositions.length == 0) {
        console.log('Call initPathfindingGrid function first');
        return;
    }
    const gridGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
    const gridMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFFFFF), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending });
    const count = gridPositions.length * gridPositions[0].length;
    const instancedGrid = new THREE.InstancedMesh(gridGeometry, gridMaterial, count);
    instancedGrid.position.y = .05;
    instancedGrid.name = name;

    const matrix = new THREE.Matrix4();
    for (let i = 0; i < gridPositions.length; i++) {
        for (let j = 0; j < gridPositions[i].length; j++) {
            matrix.makeRotationX(-1.5708); //90 degrees
            matrix.setPosition(gridPositions[i][j]);
            
            instancedGrid.setMatrixAt(i * gridPositions.length + j, matrix);
            instancedGrid.setColorAt(i * gridPositions.length + j, new THREE.Color(0x000000))
        }
    }
    
    return instancedGrid;
}

function clearInstancedColor(instancedGrid){
    for (let i = 0; i < instancedGrid.count; i++){
        instancedGrid.setColorAt(i, new THREE.Color(0x000000));
        instancedGrid.instanceColor.needsUpdate = true;
    }
}