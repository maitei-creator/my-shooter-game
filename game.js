// =========================
// ゲーム初期設定
// =========================
const canvas = document.createElement('canvas');
const container = document.getElementById('game-container');
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

let gameWidth, gameHeight;
const keys = {};
let gameState = 'title';
let score = 0;

// デルタタイム計算用の変数
let lastTime = 0;

const player = {
    x: 50,
    y: 0,
    size: 20,
    speed: 300, // 1秒間に300ピクセル移動
    color: 'cyan',
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.size, this.y);
        ctx.lineTo(this.x, this.y - this.size / 2);
        ctx.lineTo(this.x, this.y + this.size / 2);
        ctx.fill();
    },
    update(dt) {
        if (keys['ArrowUp'] || keys['w']) this.y -= this.speed * dt;
        if (keys['ArrowDown'] || keys['s']) this.y += this.speed * dt;

        if (this.y < this.size / 2) this.y = this.size / 2;
        if (this.y > gameHeight - this.size / 2) this.y = gameHeight - this.size / 2;
    }
};

function resizeCanvas() {
    gameWidth = container.clientWidth;
    gameHeight = container.clientHeight;
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    if (player.y === 0) player.y = gameHeight / 2;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// =========================
// クラス定義
// =========================
let bullets = [];
class Bullet {
    constructor(x, y) {
        this.x = x + player.size;
        this.y = y;
        this.radius = 3;
        this.speed = 500; // 秒速
    }
    update(dt) { this.x += this.speed * dt; }
    draw() {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

let enemies = [];
class Enemy {
    constructor() {
        this.size = Math.floor(Math.random() * 20) + 20;
        this.x = gameWidth + this.size;
        this.y = Math.random() * (gameHeight - this.size) + this.size / 2;
        this.speed = Math.random() * 100 + 150; // 秒速 150〜250
    }
    update(dt) { this.x -= this.speed * dt; }
    draw() {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
}

// =========================
// 入力処理（前回と同様）
// =========================
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const fireButton = document.getElementById('fire');

function handleAction() {
    if (gameState === 'title' || gameState === 'gameover') {
        resetGame();
    } else {
        keys[' '] = true;
    }
}

upButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowUp'] = true; }, {passive: false});
upButton.addEventListener('touchend', () => { keys['ArrowUp'] = false; });
downButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowDown'] = true; }, {passive: false});
downButton.addEventListener('touchend', () => { keys['ArrowDown'] = false; });
fireButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleAction(); }, {passive: false});
fireButton.addEventListener('touchend', () => { keys[' '] = false; });

// =========================
// ゲームメインループ
// =========================
function resetGame() {
    score = 0;
    enemies = [];
    bullets = [];
    player.y = gameHeight / 2;
    gameState = 'playing';
}

let lastBulletTime = 0;

function gameLoop(timestamp) {
    // 前回のフレームからの経過時間を計算（秒単位）
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    if (gameState === 'title') {
        drawScreen("レトロ・シューター", "「発射」ボタンでスタート");
    } else if (gameState === 'playing') {
        // 更新処理に dt を渡す
        updatePlaying(dt || 0); 
    } else if (gameState === 'gameover') {
        drawScreen("ゲームオーバー", `スコア: ${score}  - 再挑戦は発射ボタン`);
    }

    requestAnimationFrame(gameLoop);
}

function updatePlaying(dt) {
    player.update(dt);
    player.draw();

    // 発射処理
    if (keys[' ']) {
        const now = Date.now();
        if (now - lastBulletTime > 150) {
            bullets.push(new Bullet(player.x, player.y));
            lastBulletTime = now;
        }
    }

    if (Math.random() < 0.02) enemies.push(new Enemy());

    bullets.forEach((bullet, bIndex) => {
        bullet.update(dt);
        bullet.draw();
        if (bullet.x > gameWidth) bullets.splice(bIndex, 1);
    });

    enemies.forEach((enemy, eIndex) => {
        enemy.update(dt);
        enemy.draw();

        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distToPlayer < player.size / 2 + enemy.size / 2) {
            gameState = 'gameover';
        }

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

    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + score, 20, 40);
}

function drawScreen(title, sub) {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(title, gameWidth / 2, gameHeight / 2 - 20);
    ctx.font = '20px sans-serif';
    ctx.fillText(sub, gameWidth / 2, gameHeight / 2 + 40);
}

// 最初のループ開始
requestAnimationFrame(gameLoop);