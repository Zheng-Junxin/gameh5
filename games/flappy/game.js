const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayScore = document.getElementById('overlayScore');
const medalEl = document.getElementById('medal');

let W, H;
let bird, pipes, score, best, gameState;
let frameCount;
let bgOffset;

const GRAVITY = 0.45;
const FLAP = -7.5;
const PIPE_SPEED = 2.5;
const PIPE_GAP = 130;
const PIPE_WIDTH = 55;
const PIPE_INTERVAL = 100;

function resize() {
  const container = canvas.parentElement;
  const maxW = Math.min(container.clientWidth - 8, 420);
  W = maxW;
  H = Math.min(W * 1.35, 580);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
}

function init() {
  resize();
  bird = { x: W * 0.25, y: H / 2, vy: 0, r: 16 };
  pipes = [];
  score = 0;
  best = parseInt(localStorage.getItem('flappyBest') || '0');
  gameState = 'waiting';
  frameCount = 0;
  bgOffset = 0;

  overlay.style.display = 'flex';
  overlayTitle.textContent = '🐦 飞翔的小鸟';
  overlayMsg.textContent = '点击屏幕让小鸟起飞';
  overlayScore.style.display = 'none';
  medalEl.style.display = 'none';
  draw();
}

function draw() {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#4DD0E1');
  grad.addColorStop(0.6, '#B2EBF2');
  grad.addColorStop(1, '#AED581');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  drawCloud(bgOffset % (W + 100) - 50, H * 0.15, 50);
  drawCloud((bgOffset + 180) % (W + 100) - 50, H * 0.25, 40);
  drawCloud((bgOffset + 350) % (W + 100) - 50, H * 0.1, 45);

  // City skyline at bottom
  ctx.fillStyle = '#546E7A';
  for (let i = 0; i < W; i += 40) {
    const h = 20 + Math.sin(i * 0.05) * 15 + Math.cos(i * 0.08) * 10;
    ctx.fillRect(i, H - h, 36, h);
  }

  // Ground
  ctx.fillStyle = '#8BC34A';
  ctx.fillRect(0, H - 8, W, 20);
  ctx.fillStyle = '#689F38';
  ctx.fillRect(0, H - 6, W, H);

  // Pipes
  pipes.forEach(p => {
    const gradTop = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
    gradTop.addColorStop(0, '#43A047');
    gradTop.addColorStop(0.3, '#66BB6A');
    gradTop.addColorStop(0.7, '#43A047');
    gradTop.addColorStop(1, '#2E7D32');
    ctx.fillStyle = gradTop;
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topY);

    // Pipe cap top
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(p.x - 4, p.topY - 28, PIPE_WIDTH + 8, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(p.x - 4, p.topY - 28, PIPE_WIDTH + 8, 6);

    // Pipe bottom
    ctx.fillStyle = '#43A047';
    ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, H - p.bottomY);

    // Pipe cap bottom
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(p.x - 4, p.bottomY, PIPE_WIDTH + 8, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(p.x - 4, p.bottomY, PIPE_WIDTH + 8, 6);
  });

  // Score
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 4;
  ctx.strokeText(score, W / 2, 50);
  ctx.fillText(score, W / 2, 50);

  // Bird
  const b = bird;
  ctx.save();
  ctx.translate(b.x, b.y);
  const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, b.vy * 0.12));
  ctx.rotate(angle);

  // Body
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFC107';
  ctx.beginPath(); ctx.ellipse(0, 2, b.r * 0.7, b.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(b.r * 0.45, -b.r * 0.25, b.r * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(b.r * 0.55, -b.r * 0.25, b.r * 0.18, 0, Math.PI * 2); ctx.fill();

  // Beak
  ctx.fillStyle = '#FF5722';
  ctx.beginPath();
  ctx.moveTo(b.r * 0.75, -b.r * 0.05);
  ctx.lineTo(b.r * 1.3, b.r * 0.1);
  ctx.lineTo(b.r * 0.75, b.r * 0.2);
  ctx.closePath(); ctx.fill();

  // Wing
  const wingFlap = Math.sin(frameCount * 0.25) * 0.4;
  ctx.fillStyle = '#FFA000';
  ctx.beginPath();
  ctx.ellipse(-b.r * 0.1, b.r * 0.35, b.r * 0.55, b.r * 0.35, wingFlap, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCloud(x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
  ctx.arc(x + size * 1.5, y, size * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function update() {
  if (gameState !== 'playing') {
    // Bob animation for waiting
    if (gameState === 'waiting') {
      bird.y = H / 2 + Math.sin(frameCount * 0.06) * 8;
    }
    frameCount++;
    bgOffset += 0.5;
    draw();
    return;
  }

  frameCount++;
  bgOffset += 1;

  // Bird physics
  bird.vy += GRAVITY;
  bird.y += bird.vy;

  // Pipe spawn
  if (frameCount % PIPE_INTERVAL === 0) {
    const gapY = H * 0.2 + Math.random() * (H * 0.4);
    pipes.push({
      x: W,
      topY: gapY - PIPE_GAP / 2,
      bottomY: gapY + PIPE_GAP / 2,
      scored: false
    });
  }

  // Update pipes
  for (const p of pipes) p.x -= PIPE_SPEED;

  // Remove offscreen pipes
  while (pipes.length > 0 && pipes[0].x < -PIPE_WIDTH) pipes.shift();

  // Score
  for (const p of pipes) {
    if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
      p.scored = true;
      score++;
    }
  }

  // Collision
  if (bird.y - bird.r < 0 || bird.y + bird.r > H - 20) {
    gameOver();
    return;
  }

  for (const p of pipes) {
    if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_WIDTH) {
      if (bird.y - bird.r < p.topY || bird.y + bird.r > p.bottomY) {
        gameOver();
        return;
      }
    }
  }

  draw();
}

function gameOver() {
  gameState = 'over';
  if (score > best) {
    best = score;
    localStorage.setItem('flappyBest', best);
  }

  let medal = '';
  if (score >= 30) medal = '🥇';
  else if (score >= 20) medal = '🥈';
  else if (score >= 10) medal = '🥉';

  overlayTitle.textContent = '游戏结束';
  overlayMsg.textContent = `最高分: ${best}`;
  overlayScore.textContent = `得分: ${score}`;
  overlayScore.style.display = 'block';

  if (medal) {
    medalEl.textContent = medal;
    medalEl.style.display = 'flex';
    medalEl.style.background = score >= 30 ? '#FFD700' : score >= 20 ? '#C0C0C0' : '#CD7F32';
  } else {
    medalEl.style.display = 'none';
  }
  overlay.style.display = 'flex';
}

function flap() {
  if (gameState === 'waiting') {
    gameState = 'playing';
    overlay.style.display = 'none';
    bird.vy = FLAP;
  } else if (gameState === 'playing') {
    bird.vy = FLAP;
  } else if (gameState === 'over') {
    init();
  }
}

// Input
canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', e => { e.preventDefault(); flap(); });
document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); }
});

overlay.addEventListener('click', e => {
  e.stopPropagation();
  if (gameState === 'over') init();
});

// Game loop
function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}

init();
gameLoop();
