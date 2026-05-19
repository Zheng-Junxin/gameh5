const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');

const COLS = 10, ROWS = 20;
let CELL = 28;
let W, H, NCELL = 20;
let board, currentPiece, nextPiece, pos, score, level, lines, best, gameState, tickTimer;

const PIECES = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00BCD4' },
  O: { shape: [[1,1],[1,1]], color: '#FFEB3B' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#9C27B0' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#4CAF50' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#F44336' },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#2196F3' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#FF9800' },
};

const PIECE_KEYS = Object.keys(PIECES);

function resize() {
  const container = canvas.parentElement;
  const maxH = Math.min(window.innerHeight * 0.55, 560);
  CELL = Math.floor(maxH / ROWS);
  W = COLS * CELL;
  H = ROWS * CELL;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  NCELL = 20;
  nextCanvas.width = NCELL * 4;
  nextCanvas.height = NCELL * 4;
  nextCanvas.style.width = NCELL * 4 + 'px';
  nextCanvas.style.height = NCELL * 4 + 'px';
}

function randomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  return { ...PIECES[key], shape: PIECES[key].shape.map(r => [...r]) };
}

function init() {
  resize();
  clearInterval(tickTimer);
  board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
  score = 0;
  level = 1;
  lines = 0;
  best = parseInt(localStorage.getItem('tetrisBest') || '0');
  currentPiece = randomPiece();
  nextPiece = randomPiece();
  pos = { x: Math.floor(COLS / 2 - currentPiece.shape[0].length / 2), y: 0 };
  gameState = 'waiting';
  scoreEl.textContent = '0';
  levelEl.textContent = '1';
  linesEl.textContent = '0';
  bestEl.textContent = best;
  overlay.style.display = 'flex';
  overlayTitle.textContent = '俄罗斯方块';
  overlayMsg.textContent = '按空格键开始';
  drawAll();
}

function collides(piece, px, py) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const nx = px + c, ny = py + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotate(piece) {
  const n = piece.shape.length;
  const rotated = Array(n).fill(null).map(() => Array(n).fill(0));
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      rotated[c][n - 1 - r] = piece.shape[r][c];
  return rotated;
}

function lockPiece() {
  for (let r = 0; r < currentPiece.shape.length; r++) {
    for (let c = 0; c < currentPiece.shape[r].length; c++) {
      if (!currentPiece.shape[r][c]) continue;
      const ny = pos.y + r, nx = pos.x + c;
      if (ny < 0) { gameOver(); return; }
      board[ny][nx] = currentPiece.color;
    }
  }
  clearLines();
  currentPiece = nextPiece;
  nextPiece = randomPiece();
  pos = { x: Math.floor(COLS / 2 - currentPiece.shape[0].length / 2), y: 0 };

  if (collides(currentPiece, pos.x, pos.y)) {
    gameOver();
  }

  drawAll();
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
      r++; // recheck this row
    }
  }

  if (cleared > 0) {
    const points = [0, 100, 300, 500, 800];
    score += points[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    if (score > best) {
      best = score;
      localStorage.setItem('tetrisBest', best);
    }
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
    bestEl.textContent = best;
  }
}

function gameOver() {
  gameState = 'over';
  clearInterval(tickTimer);
  overlay.style.display = 'flex';
  overlayTitle.textContent = '游戏结束';
  overlayMsg.textContent = `得分: ${score} | 点击重新开始`;
}

function moveDown() {
  if (!collides(currentPiece, pos.x, pos.y + 1)) {
    pos.y++;
    drawAll();
    return true;
  }
  lockPiece();
  return false;
}

function hardDrop() {
  while (!collides(currentPiece, pos.x, pos.y + 1)) pos.y++;
  lockPiece();
}

function moveLeft() {
  if (!collides(currentPiece, pos.x - 1, pos.y)) { pos.x--; drawAll(); }
}

function moveRight() {
  if (!collides(currentPiece, pos.x + 1, pos.y)) { pos.x++; drawAll(); }
}

function rotatePiece() {
  const rotated = rotate(currentPiece);
  // Try basic rotation
  if (!collides({ ...currentPiece, shape: rotated }, pos.x, pos.y)) {
    currentPiece.shape = rotated;
  } else if (!collides({ ...currentPiece, shape: rotated }, pos.x - 1, pos.y)) {
    currentPiece.shape = rotated; pos.x--;
  } else if (!collides({ ...currentPiece, shape: rotated }, pos.x + 1, pos.y)) {
    currentPiece.shape = rotated; pos.x++;
  } else if (!collides({ ...currentPiece, shape: rotated }, pos.x, pos.y - 1)) {
    currentPiece.shape = rotated; pos.y--;
  }
  drawAll();
}

function drawBoard() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke();
  }

  // Locked cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        drawCell(ctx, c * CELL, r * CELL, CELL, board[r][c]);
      }
    }
  }

  // Ghost piece
  let ghostY = pos.y;
  while (!collides(currentPiece, pos.x, ghostY + 1)) ghostY++;
  if (ghostY !== pos.y) {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect((pos.x + c) * CELL, (ghostY + r) * CELL, CELL, CELL);
        }
      }
    }
  }

  // Current piece
  for (let r = 0; r < currentPiece.shape.length; r++) {
    for (let c = 0; c < currentPiece.shape[r].length; c++) {
      if (currentPiece.shape[r][c]) {
        drawCell(ctx, (pos.x + c) * CELL, (pos.y + r) * CELL, CELL, currentPiece.color);
      }
    }
  }
}

function drawCell(context, x, y, size, color) {
  context.fillStyle = color;
  context.fillRect(x + 1, y + 1, size - 2, size - 2);
  context.fillStyle = 'rgba(255,255,255,0.25)';
  context.fillRect(x + 1, y + 1, size - 2, 3);
  context.fillRect(x + 1, y + 1, 3, size - 2);
  context.fillStyle = 'rgba(0,0,0,0.2)';
  context.fillRect(x + 1, y + size - 4, size - 2, 3);
  context.fillRect(x + size - 4, y + 1, 3, size - 2);
}

function drawNext() {
  nextCtx.fillStyle = 'rgba(0,0,0,0.3)';
  nextCtx.fillRect(0, 0, NCELL * 4, NCELL * 4);

  const shape = nextPiece.shape;
  const offsetX = (4 - shape[0].length) / 2;
  const offsetY = (4 - shape.length) / 2;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        drawCell(nextCtx, (offsetX + c) * NCELL, (offsetY + r) * NCELL, NCELL, nextPiece.color);
      }
    }
  }
}

function drawAll() {
  drawBoard();
  drawNext();
}

function startGame() {
  init();
  gameState = 'playing';
  overlay.style.display = 'none';
  drawAll();
  tickTimer = setInterval(() => {
    if (gameState === 'playing') moveDown();
  }, Math.max(100, 800 - (level - 1) * 70));
}

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === ' ') {
    e.preventDefault();
    if (gameState !== 'playing') startGame();
    else hardDrop();
    return;
  }
  if (gameState !== 'playing') return;
  const map = {
    ArrowLeft: moveLeft, ArrowRight: moveRight,
    ArrowDown: () => moveDown(),
    ArrowUp: rotatePiece
  };
  if (map[e.key]) { e.preventDefault(); map[e.key](); }
});

// Mobile buttons
document.querySelectorAll('.ctrl-btn').forEach(btn => {
  btn.addEventListener('touchstart', e => {
    e.preventDefault();
    const key = btn.getAttribute('data-key');
    if (key === ' ') {
      if (gameState !== 'playing') startGame();
      else hardDrop();
    } else if (gameState === 'playing') {
      const map = { ArrowLeft: moveLeft, ArrowRight: moveRight, ArrowDown: moveDown, ArrowUp: rotatePiece };
      if (map[key]) map[key]();
    }
  });
});

overlay.addEventListener('click', () => {
  if (gameState !== 'playing') startGame();
});

init();
