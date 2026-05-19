const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');

const GRID = 20;
const CELL = 24;
let W, H, cols, rows;

let snake, food, dir, nextDir, score, best, gameState, tickTimer;
let particles = [];

function resize() {
  const container = canvas.parentElement;
  const maxW = Math.min(container.clientWidth - 8, 500);
  const maxH = Math.min(window.innerHeight * 0.55, 500);
  const size = Math.min(maxW, maxH);
  cols = Math.floor(size / CELL);
  rows = Math.floor(size / CELL);
  W = cols * CELL;
  H = rows * CELL;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
}

function init() {
  resize();
  snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = '0';
  best = parseInt(localStorage.getItem('snakeBest') || '0');
  bestEl.textContent = best;
  spawnFood();
  particles = [];
}

function spawnFood() {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
  const available = [];
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (!occupied.has(`${x},${y}`)) available.push({ x, y });
    }
  }
  if (available.length === 0) return;
  food = available[Math.floor(Math.random() * available.length)];
}

function update() {
  dir = { ...nextDir };
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    return gameOver();
  }
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    spawnParticles(head.x * CELL + CELL / 2, head.y * CELL + CELL / 2);
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function spawnParticles(cx, cy) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1
    });
  }
}

function gameOver() {
  gameState = 'over';
  if (score > best) {
    best = score;
    localStorage.setItem('snakeBest', best);
    bestEl.textContent = best;
  }
  overlayTitle.textContent = '游戏结束';
  overlayMsg.textContent = `得分: ${score} | 点击重新开始`;
  overlay.style.display = 'flex';
}

function draw() {
  ctx.fillStyle = '#0f0f23';
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
  }
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
  }

  // Food with pulse
  const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
  const fx = food.x * CELL + CELL / 2;
  const fy = food.y * CELL + CELL / 2;
  const fr = CELL / 2 * pulse;
  ctx.fillStyle = '#FF5252';
  ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(fx - fr * 0.25, fy - fr * 0.2, fr * 0.25, 0, Math.PI * 2); ctx.fill();

  // Snake
  snake.forEach((s, i) => {
    const x = s.x * CELL + 1;
    const y = s.y * CELL + 1;
    const w = CELL - 2;
    const alpha = 1 - (i / (snake.length + 10)) * 0.5;
    const hue = 120 - i * 2;
    ctx.fillStyle = `hsla(${hue}, 70%, 45%, ${alpha})`;
    ctx.beginPath();
    ctx.roundRect(x, y, w, w, 6);
    ctx.fill();

    // Eyes on head
    if (i === 0) {
      ctx.fillStyle = '#fff';
      const ex = dir.x === 0 ? 5 : (dir.x > 0 ? 14 : 2);
      const ey = dir.y === 0 ? 5 : (dir.y > 0 ? 14 : 2);
      ctx.beginPath(); ctx.arc(x + ex, y + ey, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(x + ex + dir.x * 1.5, y + ey + dir.y * 1.5, 2, 0, Math.PI * 2); ctx.fill();
    }
  });

  // Particles
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.05;
    ctx.fillStyle = `rgba(255,200,50,${p.life})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2); ctx.fill();
  });
}

function startGame() {
  init();
  gameState = 'playing';
  overlay.style.display = 'none';
  draw();
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (gameState === 'playing') update();
  }, 120);
}

function setDirection(dx, dy) {
  if (dx !== 0 && dir.x === -dx) return;
  if (dy !== 0 && dir.y === -dy) return;
  nextDir = { x: dx, y: dy };
}

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (gameState !== 'playing') startGame();
    return;
  }
  const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
                 w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
                 W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] };
  const d = map[e.key];
  if (d) {
    e.preventDefault();
    setDirection(d[0], d[1]);
  }
});

// Touch swipe
let touchStart = null;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (gameState !== 'playing') { startGame(); return; }
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
    setDirection(dx > 0 ? 1 : -1, 0);
  } else if (Math.abs(dy) > 20) {
    setDirection(0, dy > 0 ? 1 : -1);
  }
  touchStart = null;
});

// Click overlay
overlay.addEventListener('click', () => {
  if (gameState !== 'playing') startGame();
});

// Mobile buttons
document.querySelectorAll('.ctrl-btn').forEach(btn => {
  btn.addEventListener('touchstart', e => {
    e.preventDefault();
    const d = btn.getAttribute('data-dir');
    const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    setDirection(...map[d]);
    if (gameState !== 'playing') startGame();
  });
});

// Init
resize();
init();
draw();
gameState = 'waiting';
window.addEventListener('resize', () => {
  if (gameState === 'waiting' || gameState === 'over') { resize(); init(); draw(); }
});
