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
let stuckFrames = 0;

const PADDLE_W = 100, PADDLE_H = 14;
const BALL_R = 7;
const BRICK_ROWS = 5, BRICK_COLS = 8;
const BRICK_PAD = 4;
const FALLBACK_W = 400, FALLBACK_H = 300;
const MIN_VY = 1.5;

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

function clampBall() {
  if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.dx = Math.abs(ball.dx); }
  if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.dx = -Math.abs(ball.dx); }
  if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.dy = Math.abs(ball.dy); }
}

function init() {
  resize();
  paddle = { x: W / 2 - PADDLE_W / 2, y: H - 40, w: PADDLE_W, h: PADDLE_H };
  ball = { x: W / 2, y: H - 50, dx: 4, dy: -4, r: BALL_R };
  score = 0;
  lives = 3;
  gameState = 'waiting';
  particles = [];
  stuckFrames = 0;

  const totalPad = BRICK_PAD * (BRICK_COLS + 1);
  const bw = (W - totalPad) / BRICK_COLS;
  const bh = 22;
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_PAD + c * (bw + BRICK_PAD),
        y: 50 + r * (bh + BRICK_PAD),
        w: bw, h: bh,
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
      life: 1
    });
  }
}

function ballHitPaddle() {
  const hitPos = (ball.x - paddle.x) / paddle.w;
  const angle = (hitPos - 0.5) * Math.PI * 0.6;
  const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
  ball.dx = Math.sin(angle) * speed;
  ball.dy = -Math.abs(Math.cos(angle) * speed);
  // Prevent too-horizontal trajectories
  if (Math.abs(ball.dy) < MIN_VY) {
    ball.dy = ball.dy >= 0 ? MIN_VY : -MIN_VY;
  }
}

function update() {
  if (gameState !== 'playing') return;

  // Move ball step by step to prevent tunneling
  const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
  const steps = Math.ceil(speed / (BALL_R * 0.8));
  const stepDx = ball.dx / steps;
  const stepDy = ball.dy / steps;
  let movedX = 0, movedY = 0;

  for (let s = 0; s < steps; s++) {
    ball.x += stepDx;
    ball.y += stepDy;
    movedX += Math.abs(stepDx);
    movedY += Math.abs(stepDy);

    // Wall collisions
    if (ball.x - BALL_R <= 0) { ball.x = BALL_R; ball.dx = Math.abs(ball.dx); }
    if (ball.x + BALL_R >= W) { ball.x = W - BALL_R; ball.dx = -Math.abs(ball.dx); }
    if (ball.y - BALL_R <= 0) { ball.y = BALL_R; ball.dy = Math.abs(ball.dy); }

    // Paddle collision
    if (ball.dy > 0 &&
        ball.y + BALL_R >= paddle.y &&
        ball.y - BALL_R <= paddle.y + paddle.h &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.w) {
      ball.y = paddle.y - BALL_R;
      ballHitPaddle();
    }

    // Brick collisions - check all bricks
    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
          ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
        b.alive = false;
        // Determine hit side and push ball out
        const overlapLeft = (ball.x + BALL_R) - b.x;
        const overlapRight = (b.x + b.w) - (ball.x - BALL_R);
        const overlapTop = (ball.y + BALL_R) - b.y;
        const overlapBottom = (b.y + b.h) - (ball.y - BALL_R);
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop)      { ball.y = b.y - BALL_R;     ball.dy = -Math.abs(ball.dy); }
        else if (minOverlap === overlapBottom) { ball.y = b.y + b.h + BALL_R; ball.dy = Math.abs(ball.dy); }
        else if (minOverlap === overlapLeft)  { ball.x = b.x - BALL_R;     ball.dx = -Math.abs(ball.dx); }
        else                                 { ball.x = b.x + b.w + BALL_R; ball.dx = Math.abs(ball.dx); }

        if (Math.abs(ball.dy) < MIN_VY) { ball.dy = ball.dy >= 0 ? MIN_VY : -MIN_VY; }
        score += 10;
        scoreEl.textContent = score;
        spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color);
        break;
      }
    }
  }

  // Ball loss
  if (ball.y - BALL_R > H) {
    lives--;
    livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
    if (lives <= 0) {
      gameOver();
      return;
    }
    ball.x = W / 2; ball.y = H - 50;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
    ball.dy = -4;
    paddle.x = W / 2 - PADDLE_W / 2;
  }

  // Anti-stuck: if ball is bouncing too many times in same area, give it a nudge
  if (Math.abs(ball.dy) < 0.5) {
    stuckFrames++;
    if (stuckFrames > 60) {
      ball.dy = Math.random() > 0.5 ? -MIN_VY : MIN_VY;
      stuckFrames = 0;
    }
  } else {
    stuckFrames = 0;
  }

  // Speed cap
  const finalSpeed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
  const maxSpeed = 7;
  if (finalSpeed > maxSpeed) {
    ball.dx = ball.dx / finalSpeed * maxSpeed;
    ball.dy = ball.dy / finalSpeed * maxSpeed;
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
  if (e.key === 'ArrowLeft' || e.key === 'a') paddle.x = Math.max(paddle.x - 30, 0);
  if (e.key === 'ArrowRight' || e.key === 'd') paddle.x = Math.min(paddle.x + 30, W - paddle.w);
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
