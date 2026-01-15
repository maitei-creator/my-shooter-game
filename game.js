// =========================
// ゲーム初期設定
// =========================
const canvas = document.createElement('canvas');
const container = document.getElementById('game-container');
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

let gameWidth;
let gameHeight;

// キーの入力を管理するオブジェクト（これが抜けていたためエラーが出ていました）
const keys = {};

// プレイヤー機の定義（resizeCanvasで使うので先に定義します）
const player = {
    x: 50,
    y: 0, 
    size: 20,
    speed: 5,
    color: 'cyan',
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.size, this.y);
        ctx.lineTo(this.x, this.y - this.size / 2);
        ctx.lineTo(this.x, this.y + this.size / 2);
        ctx.fill();
    },
    update() {
        if (this.y < this.size / 2) this.y = this.size / 2;
        if (this.y > gameHeight - this.size / 2) this.y = gameHeight - this.size / 2;
    }
};

// 画面サイズを調整する関数
function resizeCanvas() {
    gameWidth = container.clientWidth;
    gameHeight = container.clientHeight;
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    
    // 画面中央に配置
    if (player.y === 0) player.y = gameHeight / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); 

// =========================
// ゲームオブジェクトのクラス
// =========================

let bullets = [];
class Bullet {
    constructor(x, y) {
        this.x = x + player.size;
        this.y = y;
        this.radius = 3;
        this.speed = 7;
        this.color = 'yellow';
    }
    update() { this.x += this.speed; }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

let enemies = [];
class Enemy {
    constructor() {
        this.size = Math.floor(Math.random() * 15) + 20;
        this.x = gameWidth + this.size;
        this.y = Math.random() * (gameHeight - this.size) + this.size / 2;
        this.speed = Math.random() * 2 + 2;
        this.color = 'red';
    }
    update() { this.x -= this.speed; }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
}

// =========================
// 入力処理（PC・スマホ共通）
// =========================

// キーボード操作
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const fireButton = document.getElementById('fire');

function handleTouchStart(e) {
    e.preventDefault();
    if (this.id === 'up') keys['ArrowUp'] = true;
    if (this.id === 'down') keys['ArrowDown'] = true;
    if (this.id === 'fire') keys[' '] = true;
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (this.id === 'up') keys['ArrowUp'] = false;
    if (this.id === 'down') keys['ArrowDown'] = false;
    if (this.id === 'fire') keys[' '] = false;
}

[upButton, downButton, fireButton].forEach(button => {
    button.addEventListener('touchstart', handleTouchStart, {passive: false});
    button.addEventListener('touchend', handleTouchEnd, {passive: false});
    button.addEventListener('mousedown', handleTouchStart);
    button.addEventListener('mouseup', handleTouchEnd);
});

// キーの状態を見てプレイヤーを動かす関数
let lastBulletTime = 0;
const fireRate = 200;

function handleInput() {
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys[' ']) {
        const now = Date.now();
        if (now - lastBulletTime > fireRate) {
            bullets.push(new Bullet(player.x, player.y));
            lastBulletTime = now;
        }
    }
}

// =========================
// ゲームループ
// =========================

let score = 0;
let enemySpawnTimer = 0;
const enemySpawnInterval = 40; 

function gameLoop() {
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    handleInput();
    player.update();

    enemySpawnTimer++;
    if (enemySpawnTimer >= enemySpawnInterval) {
        enemies.push(new Enemy());
        enemySpawnTimer = 0;
    }

    bullets.forEach((bullet, bIndex) => {
        bullet.update();
        bullet.draw();
        if (bullet.x > gameWidth) bullets.splice(bIndex, 1);
    });

    enemies.forEach((enemy, eIndex) => {
        enemy.update();
        enemy.draw();

        bullets.forEach((bullet, bIndex) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < bullet.radius + enemy.size / 2) {
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                score += 10;
            }
        });
        
        if (enemy.x < -enemy.size) enemies.splice(eIndex, 1);
    });

    player.draw();

    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText('SCORE: ' + score, 20, 40);

    requestAnimationFrame(gameLoop);
}

gameLoop();