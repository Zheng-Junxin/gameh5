const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');

let W, H;
let player, obstacles, coins, particles, score, best, gameState, frame, speed;
let groundOffset;

function resize() {
  const c = canvas.parentElement;
  W = Math.min(c.clientWidth - 8, 500); H = Math.min(W * 0.6, 320);
  canvas.width = W; canvas.height = H;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
}

function init() {
  resize();
  player = { x: W * 0.2, y: H - 60, w: 28, h: 40, vy: 0, onGround: true };
  obstacles = []; coins = []; particles = [];
  score = 0; gameState = 'waiting'; frame = 0; speed = 5; groundOffset = 0;
  best = parseInt(localStorage.getItem('runnerBest') || '0');
  scoreEl.textContent = '0'; bestEl.textContent = best;
  overlay.style.display = 'flex';
  overlayTitle.textContent = '🏃 跑酷达人';
  overlayMsg.textContent = '点击或按空格跳跃';
  draw();
}

function draw() {
  // Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#87CEEB'); skyGrad.addColorStop(1, '#E0F7FA');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);

  // Ground
  ctx.fillStyle = '#8BC34A'; ctx.fillRect(0, H - 20, W, 40);
  ctx.fillStyle = '#689F38';
  for (let i = 0; i < W + 20; i += 30) {
    ctx.fillRect(i - (groundOffset % 30), H - 18, 20, 4);
  }

  // Obstacles (cacti/rocks)
  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(o.x, o.y, o.w, o.h / 4);
  });

  // Coins
  coins.forEach(c => {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFA000';
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('$', c.x, c.y + 4);
  });

  // Player
  const px = player.x, py = player.y;
  ctx.fillStyle = '#FF6D00';
  ctx.fillRect(px - player.w / 2, py - player.h, player.w, player.h);
  ctx.fillStyle = '#FFAB40';
  ctx.fillRect(px - player.w / 2 + 4, py - player.h + 4, player.w - 8, player.h / 3);
  // Head
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath(); ctx.arc(px, py - player.h, player.w / 2 - 2, 0, Math.PI * 2); ctx.fill();
  // Eyes
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(px + 4, py - player.h - 2, 2.5, 0, Math.PI * 2); ctx.fill();
  // Leg animation
  const legAnim = Math.sin(frame * 0.3) * 4;
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(px - 8, py - 2, 6, 10 + legAnim);
  ctx.fillRect(px + 2, py - 2, 6, 10 - legAnim);

  // Particles
  particles = particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.04; return p.life > 0; });
  particles.forEach(p => {
    ctx.fillStyle = `rgba(255,200,0,${p.life})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2); ctx.fill();
  });
}

function spawnObstacle() {
  const types = [
    { w: 20, h: 35, color: '#5D4037' },
    { w: 14, h: 50, color: '#33691E' },
    { w: 30, h: 25, color: '#795548' },
  ];
  const t = types[Math.floor(Math.random() * types.length)];
  obstacles.push({ x: W + 20, y: H - 20 - t.h, w: t.w, h: t.h, color: t.color });
}

function spawnCoin() {
  coins.push({ x: W + 10, y: H - 70 - Math.random() * 40, r: 8 });
}

function update() {
  if (gameState !== 'playing') return;
  frame++;

  // Player physics
  if (!player.onGround) {
    player.vy += 0.8;
    player.y += player.vy;
    if (player.y >= H - 60) {
      player.y = H - 60; player.vy = 0; player.onGround = true;
    }
  }

  // Scroll
  groundOffset += speed;
  speed = 5 + Math.floor(score / 200) * 0.5;

  // Spawn
  if (frame % 60 === 0) spawnObstacle();
  if (frame % 45 === 0 && Math.random() > 0.4) spawnCoin();

  // Move obstacles and coins
  obstacles.forEach(o => o.x -= speed);
  coins.forEach(c => c.x -= speed);

  // Remove offscreen
  obstacles = obstacles.filter(o => o.x > -40);
  coins = coins.filter(c => c.x > -20);

  // Collision with obstacles
  for (const o of obstacles) {
    if (player.x + player.w / 2 - 4 > o.x && player.x - player.w / 2 + 4 < o.x + o.w &&
        player.y - 4 > o.y && player.y - player.h + 4 < o.y + o.h) {
      gameOver();
      return;
    }
  }

  // Collect coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    if (Math.abs(player.x - c.x) < 20 && Math.abs(player.y - player.h / 2 - c.y) < 20) {
      score += 10;
      for (let j = 0; j < 5; j++) particles.push({
        x: c.x, y: c.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 1
      });
      coins.splice(i, 1);
    }
  }

  // Score increase by distance
  if (frame % 10 === 0) { score++; }
  scoreEl.textContent = score;

  draw();
}

function jump() {
  if (gameState === 'waiting') {
    init(); gameState = 'playing'; overlay.style.display = 'none'; jump();
    return;
  }
  if (gameState === 'over') { init(); gameState = 'playing'; overlay.style.display = 'none'; return; }
  if (player.onGround) { player.vy = -12; player.onGround = false; }
}

function gameOver() {
  gameState = 'over';
  if (score > best) { best = score; localStorage.setItem('runnerBest', best); bestEl.textContent = best; }
  overlay.style.display = 'flex';
  overlayTitle.textContent = '游戏结束';
  overlayMsg.textContent = `得分: ${score} | 最高: ${best}`;
}

document.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } });
canvas.addEventListener('click', jump);
overlay.addEventListener('click', e => { e.stopPropagation(); jump(); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

function loop() { update(); requestAnimationFrame(loop); }
init(); loop();
