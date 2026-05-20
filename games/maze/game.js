const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const levelEl = document.getElementById('level');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');

let W, CELL;
let maze, rows, cols, playerR, playerC, exitR, exitC, level;
let visible, timerSec, timerInterval, gameActive;
let hintPath;

function resize() {
  const c = canvas.parentElement; W = Math.min(c.clientWidth - 8, 440);
  canvas.width = W; canvas.height = W;
  canvas.style.width = W + 'px'; canvas.style.height = W + 'px';
  CELL = W / cols;
}

function generateMaze(r, c) {
  rows = r; cols = c;
  resize();

  // Initialize walls everywhere
  maze = Array(rows).fill(null).map(() => Array(cols).fill(1));
  visible = Array(rows).fill(null).map(() => Array(cols).fill(false));

  // DFS maze generation
  function carve(cr, cc) {
    maze[cr][cc] = 0;
    const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dr, dc] of dirs) {
      const nr = cr + dr, nc = cc + dc;
      if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && maze[nr][nc] === 1) {
        maze[cr + dr / 2][cc + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  playerR = 1; playerC = 1;
  exitR = rows - 2; exitC = cols - 2;
  maze[exitR][exitC] = 0; // ensure exit is open
  revealAround(playerR, playerC);
}

function revealAround(r, c) {
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++)
      if (r + dr >= 0 && r + dr < rows && c + dc >= 0 && c + dc < cols)
        visible[r + dr][c + dc] = true;
}

function findPath() {
  const queue = [[playerR, playerC]];
  const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
  const prev = Array(rows).fill(null).map(() => Array(cols).fill(null));
  visited[playerR][playerC] = true;

  while (queue.length) {
    const [r, c] = queue.shift();
    if (r === exitR && c === exitC) {
      const path = [];
      let cr = r, cc = c;
      while (cr !== playerR || cc !== playerC) {
        path.push([cr, cc]); [cr, cc] = prev[cr][cc];
      }
      return path.reverse();
    }
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && maze[nr][nc] === 0) {
        visited[nr][nc] = true; prev[nr][nc] = [r, c]; queue.push([nr, nc]);
      }
    }
  }
  return [];
}

function init() {
  clearInterval(timerInterval);
  level = parseInt(localStorage.getItem('mazeLevel') || '1');
  const size = 11 + Math.min(level, 10) * 2; // grows with level
  generateMaze(size, size);
  gameActive = true; timerSec = 0; hintPath = null;
  levelEl.textContent = level; timerEl.textContent = '00:00';
  overlay.style.display = 'none';
  draw();
}

function draw() {
  ctx.fillStyle = '#263238'; ctx.fillRect(0, 0, W, W);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * CELL, y = r * CELL;

      if (!visible[r][c]) { ctx.fillStyle = '#111'; ctx.fillRect(x, y, CELL, CELL); continue; }

      if (maze[r][c] === 1) {
        ctx.fillStyle = '#455A64';
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x + 1, y + 1, CELL - 2, 2);
      } else {
        ctx.fillStyle = '#37474F'; ctx.fillRect(x, y, CELL, CELL);
        // Hint path
        if (hintPath && hintPath.some(p => p[0] === r && p[1] === c)) {
          ctx.fillStyle = 'rgba(255,152,0,0.25)'; ctx.fillRect(x, y, CELL, CELL);
        }
      }
    }
  }

  // Exit
  ctx.fillStyle = '#4CAF50';
  const ex = exitC * CELL + CELL / 2, ey = exitR * CELL + CELL / 2;
  ctx.beginPath(); ctx.arc(ex, ey, CELL * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `${CELL * 0.5}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('出', ex, ey);

  // Player
  const px = playerC * CELL + CELL / 2, py = playerR * CELL + CELL / 2;
  ctx.fillStyle = '#42A5F5';
  ctx.beginPath(); ctx.arc(px, py, CELL * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(px - 2, py - 3, CELL * 0.1, 0, Math.PI * 2); ctx.fill();
}

function move(dr, dc) {
  if (!gameActive) return;
  const nr = playerR + dr, nc = playerC + dc;
  if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || maze[nr][nc] === 1) return;

  playerR = nr; playerC = nc;
  revealAround(playerR, playerC);

  if (!timerInterval) {
    timerInterval = setInterval(() => {
      timerSec++; const m = String(Math.floor(timerSec / 60)).padStart(2, '0');
      const s = String(timerSec % 60).padStart(2, '0'); timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  if (playerR === exitR && playerC === exitC) {
    gameActive = false; clearInterval(timerInterval);
    level++; localStorage.setItem('mazeLevel', level);
    const m = String(Math.floor(timerSec / 60)).padStart(2, '0');
    const s = String(timerSec % 60).padStart(2, '0');
    overlayTitle.textContent = '🎉 找到出口！';
    overlayMsg.textContent = `第${level - 1}关完成 用时 ${m}:${s}`;
    overlay.style.display = 'flex';
  }
  draw();
}

document.addEventListener('keydown', e => {
  const map = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1],
                 w: [-1,0], s: [1,0], a: [0,-1], d: [0,1] };
  const d = map[e.key]; if (d) { e.preventDefault(); move(d[0], d[1]); }
});

document.querySelectorAll('.d-btn').forEach(btn => {
  btn.addEventListener('touchstart', e => {
    e.preventDefault();
    const [dr, dc] = btn.getAttribute('data-dir').split(',').map(Number);
    move(dr, dc);
  });
});

canvas.addEventListener('touchstart', e => {
  if (!gameActive) return;
  const rect = canvas.getBoundingClientRect();
  const sx = W / rect.width;
  const tr = Math.floor((e.touches[0].clientY - rect.top) * sx / CELL);
  const tc = Math.floor((e.touches[0].clientX - rect.left) * sx / CELL);
  if (tr === playerR && tc === playerC - 1) move(0, -1);
  else if (tr === playerR && tc === playerC + 1) move(0, 1);
  else if (tr === playerR - 1 && tc === playerC) move(-1, 0);
  else if (tr === playerR + 1 && tc === playerC) move(1, 0);
});

document.getElementById('newBtn').addEventListener('click', init);
document.getElementById('hintBtn').addEventListener('click', () => {
  hintPath = findPath();
  draw();
  setTimeout(() => { hintPath = null; draw(); }, 3000);
});
overlayBtn.addEventListener('click', init);

init();
