// =========================
// ゲーム初期設定
// =========================
const canvas = document.createElement('canvas');
const container = document.getElementById('game-container');
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

let gameWidth;
let gameHeight;

// resizeCanvas 関数を以下のように強化します
function resizeCanvas() {
    // コンテナのサイズに合わせる
    gameWidth = container.clientWidth;
    gameHeight = container.clientHeight;
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    
    // プレイヤーの位置が画面外にいかないよう調整
    player.y = gameHeight / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // 初回実行

// =========================
// ゲームオブジェクト
// =========================

// プレイヤー機
const player = {
    x: 50,
    y: gameHeight / 2,
    size: 20,
    speed: 5,
    color: 'cyan',
    draw() {
        ctx.fillStyle = this.color;
        // プレイヤーを三角形（戦闘機）として描画
        ctx.beginPath();
        ctx.moveTo(this.x + this.size, this.y);
        ctx.lineTo(this.x, this.y - this.size / 2);
        ctx.lineTo(this.x, this.y + this.size / 2);
        ctx.fill();
    },
    update() {
        // 画面外に出ないように制限
        if (this.y < this.size / 2) this.y = this.size / 2;
        if (this.y > gameHeight - this.size / 2) this.y = gameHeight - this.size / 2;
    }
};

// 弾
let bullets = [];
class Bullet {
    constructor(x, y) {
        this.x = x + player.size; // プレイヤーの鼻先から
        this.y = y;
        this.radius = 3;
        this.speed = 7;
        this.color = 'yellow';
    }
    update() {
        this.x += this.speed;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 敵
let enemies = [];
class Enemy {
    constructor() {
        this.size = Math.floor(Math.random() * 15) + 10;
        this.x = gameWidth + this.size;
        this.y = Math.random() * (gameHeight - this.size * 2) + this.size;
        this.speed = Math.random() * 2 + 1;
        this.color = 'red';
    }
    update() {
        this.x -= this.speed;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
}

// =========================
// 入力処理
// =========================

// PC (キーボード)
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// スマホ (ボタン)
const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const fireButton = document.getElementById('fire');

function handleTouchStart(e) {
    e.preventDefault(); // スクロール防止
    if (this.id === 'up') keys['ArrowUp'] = true;
    if (this.id === 'down') keys['ArrowDown'] = true;
    if (this.id === 'fire') keys[' '] = true; // スペースキーに対応
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (this.id === 'up') keys['ArrowUp'] = false;
    if (this.id === 'down') keys['ArrowDown'] = false;
    if (this.id === 'fire') keys[' '] = false;
}

// タッチイベントの設定
[upButton, downButton, fireButton].forEach(button => {
    button.addEventListener('mousedown', handleTouchStart);
    button.addEventListener('mouseup', handleTouchEnd);
    button.addEventListener('touchstart', handleTouchStart);
    button.addEventListener('touchend', handleTouchEnd);
    button.addEventListener('mouseleave', handleTouchEnd); // マウスがボタンから離れた時
});


let lastBulletTime = 0;
const fireRate = 200; // ms (連射速度)

function handleInput() {
    // プレイヤーの移動
    if (keys['ArrowUp'] || keys['w']) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y += player.speed;
    }

    // 発射
    if (keys[' '] || keys[' ']) { // スペースキー
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
const enemySpawnInterval = 60; // 60フレームごとに敵を生成 (約1秒)

function gameLoop() {
    // 1. 背景の描画 (再描画で前のフレームを消去)
    ctx.fillStyle = '#000033'; // 暗い宇宙色
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    // 2. 入力処理
    handleInput();
    player.update();

    // 3. 敵の生成
    enemySpawnTimer++;
    if (enemySpawnTimer >= enemySpawnInterval) {
        enemies.push(new Enemy());
        enemySpawnTimer = 0;
    }

    // 4. オブジェクトの更新と描画
    // 弾の更新、描画、画面外の除去
    bullets.forEach((bullet, bIndex) => {
        bullet.update();
        bullet.draw();
        if (bullet.x > gameWidth) {
            bullets.splice(bIndex, 1);
        }
    });

    // 敵の更新、描画
    enemies.forEach((enemy, eIndex) => {
        enemy.update();
        enemy.draw();

        // 衝突判定 (弾 vs 敵)
        bullets.forEach((bullet, bIndex) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < bullet.radius + enemy.size / 2) {
                // 衝突: 敵と弾を削除し、スコア加算
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                score += 10;
            }
        });
        
        // 敵が画面外に出た/プレイヤーとの衝突 (ここでは単純化のため画面外での除去のみ)
        if (enemy.x < -enemy.size) {
            enemies.splice(eIndex, 1);
            // 本来はライフを減らすなどの処理
        }
    });

    // プレイヤーの描画
    player.draw();

    // 5. スコア表示
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText('SCORE: ' + score, 10, 30);

    // 6. 次のフレームを要求
    requestAnimationFrame(gameLoop);
}

// ゲーム開始
gameLoop();