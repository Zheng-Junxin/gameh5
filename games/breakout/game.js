const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');

let W, H;
let paddle, ball, bricks, score, lives, gameState;
let particles = [];

const PADDLE_W = 100, PADDLE_H = 14;
const BALL_R = 7;
const BRICK_ROWS = 5, BRICK_COLS = 8;
const BRICK_PAD = 4;

const FALLBACK_W = 400, FALLBACK_H = 300;

function resize() {
  const container = canvas.parentElement;
  const cw = container.clientWidth - 8;
  W = cw > 0 ? Math.min(cw, 600) : FALLBACK_W;
  H = W > 0 ? Math.min(W * 0.7, 420) : FALLBACK_H;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
}

const BRICK_COLORS = ['#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF'];

function init() {
  resize();
  paddle = { x: W / 2 - PADDLE_W / 2, y: H - 40, w: PADDLE_W, h: PADDLE_H };
  ball = { x: W / 2, y: H - 50, dx: 4, dy: -4, r: BALL_R };
  score = 0;
  lives = 3;
  gameState = 'waiting';
  particles = [];

  const totalPad = BRICK_PAD * (BRICK_COLS + 1);
  const bw = (W - totalPad) / BRICK_COLS;
  const bh = 22;
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_PAD + c * (bw + BRICK_PAD),
        y: 50 + r * (bh + BRICK_PAD),
        w: bw,
        h: bh,
        color: BRICK_COLORS[r],
        alive: true
      });
    }
  }

  scoreEl.textContent = '0';
  livesEl.textContent = '❤️'.repeat(lives);
  overlay.style.display = 'flex';
  overlayTitle.textContent = '打砖块';
  overlayMsg.textContent = '点击开始游戏';
  draw();
}

function draw() {
  ctx.fillStyle = '#0f0f23';
  ctx.fillRect(0, 0, W, H);

  bricks.forEach(b => {
    if (!b.alive) return;
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(b.x, b.y, b.w, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);
  });

  const px = paddle.x, py = paddle.y;
  ctx.fillStyle = '#4D96FF';
  ctx.beginPath(); ctx.roundRect(px, py, paddle.w, paddle.h, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(px, py, paddle.w, paddle.h / 2);

  const grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, BALL_R);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.5, '#FFD93D');
  grad.addColorStop(1, '#FF8E53');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();

  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.04;
    ctx.fillStyle = `rgba(255,200,50,${p.life})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2); ctx.fill();
  });
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 1,
      color
    });
  }
}

function ballHitPaddle() {
  const hitPos = (ball.x - paddle.x) / paddle.w;
  const angle = (hitPos - 0.5) * Math.PI * 0.7;
  const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
  ball.dx = Math.sin(angle) * speed;
  ball.dy = -Math.abs(Math.cos(angle) * speed);
}

function ballHitBrick(brick) {
  const prevX = ball.x - ball.dx, prevY = ball.y - ball.dy;
  if (prevX + BALL_R <= brick.x) ball.dx = -Math.abs(ball.dx);
  else if (prevX - BALL_R >= brick.x + brick.w) ball.dx = Math.abs(ball.dx);
  else if (prevY + BALL_R <= brick.y) ball.dy = -Math.abs(ball.dy);
  else if (prevY - BALL_R >= brick.y + brick.h) ball.dy = Math.abs(ball.dy);
  else ball.dy *= -1;
}

function update() {
  if (gameState !== 'playing') return;

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x - BALL_R <= 0) { ball.x = BALL_R; ball.dx = Math.abs(ball.dx); }
  if (ball.x + BALL_R >= W) { ball.x = W - BALL_R; ball.dx = -Math.abs(ball.dx); }
  if (ball.y - BALL_R <= 0) { ball.y = BALL_R; ball.dy = Math.abs(ball.dy); }

  if (ball.dy > 0 &&
      ball.y + BALL_R >= paddle.y &&
      ball.y - BALL_R <= paddle.y + paddle.h &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.w) {
    ball.y = paddle.y - BALL_R;
    ballHitPaddle();
  }

  if (ball.y - BALL_R > H) {
    lives--;
    livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
    if (lives <= 0) {
      gameOver();
    } else {
      ball.x = W / 2;
      ball.y = H - 50;
      ball.dx = 4;
      ball.dy = -4;
      paddle.x = W / 2 - PADDLE_W / 2;
    }
  }

  for (const b of bricks) {
    if (!b.alive) continue;
    if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
        ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
      b.alive = false;
      ballHitBrick(b);
      score += 10;
      scoreEl.textContent = score;
      spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color);
      break;
    }
  }

  const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
  const maxSpeed = 8;
  if (speed > maxSpeed) {
    ball.dx = ball.dx / speed * maxSpeed;
    ball.dy = ball.dy / speed * maxSpeed;
  }

  if (bricks.every(b => !b.alive)) gameWin();
  draw();
}

function gameOver() {
  gameState = 'over';
  overlay.style.display = 'flex';
  overlayTitle.textContent = '游戏结束';
  overlayMsg.textContent = `最终得分: ${score}`;
}

function gameWin() {
  gameState = 'over';
  overlay.style.display = 'flex';
  overlayTitle.textContent = '🎉 恭喜通关！';
  overlayMsg.textContent = `得分: ${score} | 生命: ${'❤️'.repeat(lives)}`;
}

function startPlaying() {
  resize();
  init();
  gameState = 'playing';
  overlay.style.display = 'none';
}

// Input
canvas.addEventListener('mousemove', e => {
  if (gameState !== 'playing' || W <= 0) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  paddle.x = Math.min(Math.max((e.clientX - rect.left) * scaleX - paddle.w / 2, 0), W - paddle.w);
});

canvas.addEventListener('touchmove', e => {
  if (gameState !== 'playing' || W <= 0) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  paddle.x = Math.min(Math.max((e.touches[0].clientX - rect.left) * scaleX - paddle.w / 2, 0), W - paddle.w);
}, { passive: false });

document.addEventListener('keydown', e => {
  if (gameState !== 'playing') return;
  if (e.key === 'ArrowLeft') paddle.x = Math.max(paddle.x - 25, 0);
  if (e.key === 'ArrowRight') paddle.x = Math.min(paddle.x + 25, W - paddle.w);
});

overlay.addEventListener('click', () => {
  if (gameState === 'waiting' || gameState === 'over') startPlaying();
});

window.addEventListener('resize', () => {
  if (gameState === 'waiting' || gameState === 'over') { resize(); init(); draw(); }
});

function loop() {
  update();
  requestAnimationFrame(loop);
}

init();
loop();
