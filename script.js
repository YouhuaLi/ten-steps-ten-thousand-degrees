class TenKDegreesGame {
    constructor() {
        this.gridSize = 5;
        this.maxOperations = 10;
        this.operationsLeft = 10;
        this.totalDegrees = 0;
        this.targetDegrees = 100000;
        this.blocks = [];
        this.gameActive = false;
        this.animationSpeed = 300; // medium speed
        
        this.directions = ['up', 'right', 'down', 'left'];
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeGame();
    }
    
    initializeElements() {
        this.gridContainer = document.getElementById('gridContainer');
        this.operationsLeftElement = document.getElementById('operationsLeft');
        this.scoreElement = document.getElementById('score');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.speedSelect = document.getElementById('speed');
        this.messageElement = document.getElementById('gameMessage');
    }
    
    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.speedSelect.addEventListener('change', () => this.changeSpeed());
    }
    
    changeSpeed() {
        const speed = this.speedSelect.value;
        switch(speed) {
            case 'slow':
                this.animationSpeed = 500;
                break;
            case 'medium':
                this.animationSpeed = 300;
                break;
            case 'fast':
                this.animationSpeed = 150;
                break;
        }
    }
    
    initializeGame() {
        this.createGrid();
        this.resetGame();
    }
    
    createGrid() {
        this.gridContainer.innerHTML = '';
        this.blocks = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            this.blocks[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const block = document.createElement('div');
                block.className = 'block';
                block.dataset.row = row;
                block.dataset.col = col;
                
                const arrow = document.createElement('div');
                arrow.className = 'arrow';
                
                block.appendChild(arrow);
                block.addEventListener('click', () => this.handleBlockClick(row, col));
                
                this.gridContainer.appendChild(block);
                
                // 初始化方向 - 所有箭头向上
                const direction = 0; // 0 = up
                this.blocks[row][col] = {
                    element: block,
                    arrow: arrow,
                    direction: direction
                };
                
                this.updateArrowDirection(row, col);
            }
        }
    }
    
    updateArrowDirection(row, col) {
        const block = this.blocks[row][col];
        const direction = this.directions[block.direction];
        block.arrow.className = `arrow ${direction}`;
    }
    
    startNewGame() {
        this.gameActive = true;
        this.operationsLeft = this.maxOperations;
        this.totalDegrees = 0;
        
        // 重置所有方块的方向为向上
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.blocks[row][col].direction = 0; // 0 = up
                this.updateArrowDirection(row, col);
                this.blocks[row][col].element.classList.remove('active', 'chain-active');
            }
        }
        
        this.updateAllBlockColors();
        this.updateDisplay();
        this.showMessage(`游戏开始！目标：用10次操作达到${this.targetDegrees.toLocaleString()}度`, 'success', 3000);
    }
    
    resetGame() {
        this.operationsLeft = this.maxOperations;
        this.totalDegrees = 0;
        this.gameActive = false;
        
        // 清除所有动画状态
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.blocks[row][col].element.classList.remove('active', 'chain-active');
            }
        }
        
        this.updateDisplay();
    }
    
    async handleBlockClick(row, col) {
        if (!this.gameActive) {
            this.showMessage('请先开始新游戏！', 'error', 1500);
            return;
        }
        
        if (this.operationsLeft <= 0) {
            this.showMessage('操作次数已用完！', 'error', 1500);
            return;
        }
        
        // 执行操作
        this.operationsLeft--;
        
        // 触发连锁反应
        await this.triggerChainReaction(row, col);
        
        this.updateDisplay();
        
        // 检查游戏结束条件
        if (this.totalDegrees >= this.targetDegrees) {
            this.showMessage(`恭喜！达到目标${this.targetDegrees.toLocaleString()}度！`, 'success', 3000);
            this.gameActive = false;
        } else if (this.operationsLeft <= 0) {
            this.endGame();
        }
    }
    
    rotateBlock(row, col) {
        const block = this.blocks[row][col];
        block.direction = (block.direction + 1) % 4;
        this.updateArrowDirection(row, col);
        this.totalDegrees += 90; // 每次旋转90度
        
        // 添加点击效果
        block.element.classList.add('active');
        setTimeout(() => {
            block.element.classList.remove('active');
        }, 600);
    }
    
    async triggerChainReaction(startRow, startCol) {
        const queue = [{ row: startRow, col: startCol }];
        
        while (queue.length > 0) {
            const { row, col } = queue.shift();
            
            // 旋转当前方块
            this.rotateBlock(row, col);
            
            // 添加动画效果
            if (!(row === startRow && col === startCol)) {
                this.blocks[row][col].element.classList.add('chain-active');
                await this.delay(this.animationSpeed);
            }
            
            // 检查旋转后的指针是否指向另一个圆圈
            const direction = this.blocks[row][col].direction;
            const pointedCircle = this.getPointedCircle(row, col, direction);
            
            if (pointedCircle) {
                // 如果指向另一个圆圈，将其加入队列继续连锁反应
                queue.push(pointedCircle);
            }
        }
        
        // 更新所有方块的颜色
        this.updateAllBlockColors();
        
        // 清除连锁反应动画
        setTimeout(() => {
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    this.blocks[row][col].element.classList.remove('chain-active');
                }
            }
        }, this.animationSpeed);
    }
    
    getPointedCircle(row, col, direction) {
        // 检查指针是否指向相邻的圆圈
        const directions = [
            { row: -1, col: 0 }, // up
            { row: 0, col: 1 },  // right
            { row: 1, col: 0 },  // down
            { row: 0, col: -1 }  // left
        ];
        
        const delta = directions[direction];
        const targetRow = row + delta.row;
        const targetCol = col + delta.col;
        
        // 检查目标位置是否在网格内且有圆圈
        if (targetRow >= 0 && targetRow < this.gridSize && 
            targetCol >= 0 && targetCol < this.gridSize) {
            return { row: targetRow, col: targetCol };
        }
        
        return null;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    canTriggerChainReaction(row, col) {
        // 检查如果当前方块旋转90度后是否能触发连锁反应
        const currentDirection = this.blocks[row][col].direction;
        const nextDirection = (currentDirection + 1) % 4;
        
        const pointedCircle = this.getPointedCircle(row, col, nextDirection);
        return pointedCircle !== null;
    }
    
    updateBlockColor(row, col) {
        const block = this.blocks[row][col];
        const element = block.element;
        
        // 清除之前的颜色类
        element.classList.remove('can-trigger', 'cannot-trigger');
        
        // 根据是否能触发连锁反应添加对应的颜色类
        if (this.canTriggerChainReaction(row, col)) {
            element.classList.add('can-trigger');
        } else {
            element.classList.add('cannot-trigger');
        }
    }
    
    updateAllBlockColors() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.updateBlockColor(row, col);
            }
        }
    }
    
    endGame() {
        this.gameActive = false;
        const message = this.totalDegrees >= this.targetDegrees 
            ? `恭喜完成目标！总旋转度数: ${this.totalDegrees.toLocaleString()}度`
            : `游戏结束！总旋转度数: ${this.totalDegrees.toLocaleString()}度，目标: ${this.targetDegrees.toLocaleString()}度`;
        this.showMessage(message, 'success', 4000);
    }
    
    updateDisplay() {
        this.operationsLeftElement.textContent = this.operationsLeft;
        this.scoreElement.textContent = this.totalDegrees.toLocaleString() + '°';
    }
    
    showMessage(text, type = 'info', duration = 2000) {
        this.messageElement.textContent = text;
        this.messageElement.className = `message ${type}`;
        this.messageElement.classList.remove('hidden');
        
        setTimeout(() => {
            this.messageElement.classList.add('hidden');
        }, duration);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TenKDegreesGame();
});