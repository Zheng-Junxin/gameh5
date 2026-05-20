const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');

let W, H;
let player, bullets, enemies, particles, score, lives, gameState;
let enemyTimer, frame;
let keys = {};

function resize() {
  const c = canvas.parentElement;
  const maxW = Math.min(c.clientWidth - 8, 420);
  W = maxW; H = Math.min(W * 1.5, 600);
  canvas.width = W; canvas.height = H;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
}

function init() {
  resize();
  player = { x: W / 2, y: H - 60, w: 30, h: 36 };
  bullets = []; enemies = []; particles = [];
  score = 0; lives = 3; gameState = 'waiting'; frame = 0;
  scoreEl.textContent = '0'; livesEl.textContent = '3';
  overlay.style.display = 'flex';
  overlayTitle.textContent = '🎯 飞机大战';
  overlayMsg.textContent = '点击/触摸开始';
  keys = {};
  draw();
}

function draw() {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 40; i++) {
    const sx = (i * 97 + 13) % W, sy = ((i * 73 + frame * 2) % (H + 20)) - 10;
    if (sy < H && sy > 0) { ctx.beginPath(); ctx.arc(sx, sy, (i % 3) + 1, 0, Math.PI * 2); ctx.fill(); }
  }

  // Player
  if (gameState !== 'over') {
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 18);
    ctx.lineTo(player.x - 15, player.y + 12);
    ctx.lineTo(player.x - 6, player.y + 8);
    ctx.lineTo(player.x - 6, player.y + 18);
    ctx.lineTo(player.x, player.y + 14);
    ctx.lineTo(player.x + 6, player.y + 18);
    ctx.lineTo(player.x + 6, player.y + 8);
    ctx.lineTo(player.x + 15, player.y + 12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x - 3, player.y - 6, 6, 14);
    // Shield flash when hit
    if (gameState === 'hit') {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(player.x, player.y, 22, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // Bullets
  ctx.fillStyle = '#FFEB3B';
  bullets.forEach(b => {
    ctx.fillRect(b.x - 2, b.y - 10, 4, 14);
  });

  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.type === 'small' ? '#FF5252' : '#FF9800';
    if (e.type === 'small') {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y + 14);
      ctx.lineTo(e.x - 12, e.y - 8);
      ctx.lineTo(e.x - 4, e.y - 4);
      ctx.lineTo(e.x - 4, e.y - 14);
      ctx.lineTo(e.x, e.y - 10);
      ctx.lineTo(e.x + 4, e.y - 14);
      ctx.lineTo(e.x + 4, e.y - 4);
      ctx.lineTo(e.x + 12, e.y - 8);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y + 18);
      ctx.lineTo(e.x - 16, e.y - 10);
      ctx.lineTo(e.x - 5, e.y - 5);
      ctx.lineTo(e.x - 5, e.y - 18);
      ctx.lineTo(e.x, e.y - 12);
      ctx.lineTo(e.x + 5, e.y - 18);
      ctx.lineTo(e.x + 5, e.y - 5);
      ctx.lineTo(e.x + 16, e.y - 10);
      ctx.closePath(); ctx.fill();
    }
  });

  // Particles
  particles = particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; return p.life > 0; });
  particles.forEach(p => {
    ctx.fillStyle = `rgba(255,200,0,${p.life})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5 * p.life, 0, Math.PI * 2); ctx.fill();
  });
}

function spawnEnemy(type) {
  enemies.push({
    x: Math.random() * (W - 40) + 20, y: -30,
    type, hp: type === 'big' ? 3 : 1,
    speed: type === 'big' ? 1.5 : 2 + Math.random() * 2
  });
}

function update() {
  if (gameState !== 'playing') return;
  frame++;

  // Player movement
  if (keys.ArrowLeft || keys.a) player.x = Math.max(20, player.x - 6);
  if (keys.ArrowRight || keys.d) player.x = Math.min(W - 20, player.x + 6);
  if (keys.ArrowUp || keys.w) player.y = Math.max(30, player.y - 5);
  if (keys.ArrowDown || keys.s) player.y = Math.min(H - 30, player.y + 5);

  // Shooting
  if (frame % 6 === 0) {
    bullets.push({ x: player.x, y: player.y - 20 });
  }

  // Move bullets
  bullets = bullets.filter(b => (b.y -= 10) > -20);

  // Move enemies
  enemies.forEach(e => { e.y += e.speed; });

  // Collision: bullets vs enemies
  for (let b = bullets.length - 1; b >= 0; b--) {
    for (let e = enemies.length - 1; e >= 0; e--) {
      if (Math.abs(bullets[b].x - enemies[e].x) < 16 && Math.abs(bullets[b].y - enemies[e].y) < 18) {
        bullets.splice(b, 1);
        enemies[e].hp--;
        if (enemies[e].hp <= 0) {
          for (let i = 0; i < 10; i++) particles.push({
            x: enemies[e].x, y: enemies[e].y,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 1
          });
          score += enemies[e].type === 'big' ? 50 : 10;
          scoreEl.textContent = score;
          enemies.splice(e, 1);
        }
        break;
      }
    }
  }

  // Collision: enemies vs player
  if (gameState === 'playing') {
    for (let e = enemies.length - 1; e >= 0; e--) {
      if (Math.abs(enemies[e].x - player.x) < 20 && Math.abs(enemies[e].y - player.y) < 22) {
        enemies.splice(e, 1);
        lives--;
        livesEl.textContent = lives;
        if (lives <= 0) {
          gameOver();
          return;
        }
        gameState = 'hit';
        setTimeout(() => { gameState = 'playing'; }, 1000);
        break;
      }
    }
  }

  // Remove offscreen enemies
  enemies = enemies.filter(e => e.y < H + 40);

  // Spawn enemies
  if (frame % 40 === 0) spawnEnemy('small');
  if (frame % 200 === 0) spawnEnemy('big');

  draw();
}

function gameOver() {
  gameState = 'over';
  overlay.style.display = 'flex';
  overlayTitle.textContent = '游戏结束';
  overlayMsg.textContent = `最终得分: ${score}`;
}

// Controls
document.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
document.addEventListener('keyup', e => { keys[e.key] = false; });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const sx = W / rect.width, sy = H / rect.height;
  player.x = Math.min(Math.max((e.touches[0].clientX - rect.left) * sx, 20), W - 20);
  player.y = Math.min(Math.max((e.touches[0].clientY - rect.top) * sy, 30), H - 30);
}, { passive: false });
overlay.addEventListener('click', () => {
  if (gameState !== 'playing') { init(); gameState = 'playing'; overlay.style.display = 'none'; }
});

function loop() { update(); requestAnimationFrame(loop); }
init(); loop();
