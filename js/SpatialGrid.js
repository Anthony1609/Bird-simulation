/**
 * SpatialGrid Class
 * Provides O(1) average-time neighbor lookups using uniform grid partitioning.
 */
class SpatialGrid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = new Array(this.cols * this.rows).fill(0).map(() => []);
    }

    clear() {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i].length = 0;
        }
    }

    insert(entity) {
        const col = Math.floor(entity.position.x / this.cellSize);
        const row = Math.floor(entity.position.y / this.cellSize);
        
        // Handle edge wrapping/clamping for the grid
        const safeCol = (col % this.cols + this.cols) % this.cols;
        const safeRow = (row % this.rows + this.rows) % this.rows;
        
        const index = safeCol + safeRow * this.cols;
        this.grid[index].push(entity);
    }

    getNeighbors(entity, radius) {
        const neighbors = [];
        const col = Math.floor(entity.position.x / this.cellSize);
        const row = Math.floor(entity.position.y / this.cellSize);
        
        const cellsToCheck = Math.ceil(radius / this.cellSize);

        for (let x = -cellsToCheck; x <= cellsToCheck; x++) {
            for (let y = -cellsToCheck; y <= cellsToCheck; y++) {
                const c = (col + x + this.cols) % this.cols;
                const r = (row + y + this.rows) % this.rows;
                const index = c + r * this.cols;
                
                const cell = this.grid[index];
                for (let i = 0; i < cell.length; i++) {
                    const other = cell[i];
                    if (other !== entity) {
                        const d = entity.position.dist(other.position);
                        if (d < radius) {
                            neighbors.push(other);
                        }
                    }
                }
            }
        }
        return neighbors;
    }
}

export default SpatialGrid;
