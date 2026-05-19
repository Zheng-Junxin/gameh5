const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const continueBtn = document.getElementById('continueBtn');
const retryBtn = document.getElementById('retryBtn');
const newGameBtn = document.getElementById('newGameBtn');

const TILE_COLORS = {
  2:    { bg: '#eee4da', fg: '#776e65' },
  4:    { bg: '#ede0c8', fg: '#776e65' },
  8:    { bg: '#f2b179', fg: '#f9f6f2' },
  16:   { bg: '#f59563', fg: '#f9f6f2' },
  32:   { bg: '#f67c5f', fg: '#f9f6f2' },
  64:   { bg: '#f65e3b', fg: '#f9f6f2' },
  128:  { bg: '#edcf72', fg: '#f9f6f2' },
  256:  { bg: '#edcc61', fg: '#f9f6f2' },
  512:  { bg: '#edc850', fg: '#f9f6f2' },
  1024: { bg: '#edc53f', fg: '#f9f6f2' },
  2048: { bg: '#edc22e', fg: '#f9f6f2' },
  4096: { bg: '#3c3a32', fg: '#f9f6f2' },
};

let grid, score, best, won, gameOver;

function init() {
  grid = Array(16).fill(0);
  score = 0;
  won = false;
  gameOver = false;
  scoreEl.textContent = '0';
  best = parseInt(localStorage.getItem('best2048') || '0');
  bestEl.textContent = best;
  overlay.style.display = 'none';
  spawnTile();
  spawnTile();
  render();
}

function emptyCells() {
  return grid.reduce((acc, v, i) => v === 0 ? [...acc, i] : acc, []);
}

function spawnTile() {
  const empty = emptyCells();
  if (empty.length === 0) return;
  const idx = empty[Math.floor(Math.random() * empty.length)];
  grid[idx] = Math.random() < 0.9 ? 2 : 4;
}

function render() {
  boardEl.innerHTML = '';
  grid.forEach(v => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    if (v > 0) {
      tile.textContent = v;
      tile.setAttribute('data-value', v);
      const color = TILE_COLORS[v] || TILE_COLORS[4096];
      tile.style.background = color.bg;
      tile.style.color = color.fg;
      if (v >= 1000) tile.style.fontSize = '1.3rem';
    }
    boardEl.appendChild(tile);
  });
}

function slideRow(row) {
  let arr = row.filter(v => v !== 0);
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter(v => v !== 0);
  while (arr.length < 4) arr.push(0);
  return arr;
}

function moveGrid(direction) {
  // 0: left, 1: right, 2: up, 3: down
  const old = [...grid];
  const size = 4;

  if (direction === 0) { // left
    for (let r = 0; r < size; r++) {
      const row = grid.slice(r * size, r * size + size);
      const newRow = slideRow(row);
      for (let c = 0; c < size; c++) grid[r * size + c] = newRow[c];
    }
  } else if (direction === 1) { // right
    for (let r = 0; r < size; r++) {
      const row = grid.slice(r * size, r * size + size).reverse();
      const newRow = slideRow(row).reverse();
      for (let c = 0; c < size; c++) grid[r * size + c] = newRow[c];
    }
  } else if (direction === 2) { // up
    for (let c = 0; c < size; c++) {
      const col = [grid[c], grid[c + 4], grid[c + 8], grid[c + 12]];
      const newCol = slideRow(col);
      grid[c] = newCol[0];
      grid[c + 4] = newCol[1];
      grid[c + 8] = newCol[2];
      grid[c + 12] = newCol[3];
    }
  } else { // down
    for (let c = 0; c < size; c++) {
      const col = [grid[c], grid[c + 4], grid[c + 8], grid[c + 12]].reverse();
      const newCol = slideRow(col).reverse();
      grid[c] = newCol[0];
      grid[c + 4] = newCol[1];
      grid[c + 8] = newCol[2];
      grid[c + 12] = newCol[3];
    }
  }

  const changed = !old.every((v, i) => v === grid[i]);
  return changed;
}

function canMove() {
  if (emptyCells().length > 0) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[r * 4 + c] === grid[r * 4 + c + 1]) return true;
    }
  }
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 3; r++) {
      if (grid[r * 4 + c] === grid[(r + 1) * 4 + c]) return true;
    }
  }
  return false;
}

function checkWin() {
  if (!won && grid.some(v => v === 2048)) {
    won = true;
    overlayTitle.textContent = '🎉 你赢了！';
    overlayMsg.textContent = `得分: ${score}`;
    continueBtn.style.display = 'inline-block';
    overlay.style.display = 'flex';
  }
}

function makeMove(direction) {
  if (gameOver || overlay.style.display === 'flex') return;
  const moved = moveGrid(direction);
  if (!moved) return;
  spawnTile();
  render();
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    localStorage.setItem('best2048', best);
    bestEl.textContent = best;
  }
  checkWin();
  if (!canMove()) {
    gameOver = true;
    overlayTitle.textContent = '游戏结束';
    overlayMsg.textContent = `最终得分: ${score}`;
    continueBtn.style.display = 'none';
    overlay.style.display = 'flex';
  }
}

// Keyboard
document.addEventListener('keydown', e => {
  const map = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
  if (map[e.key] !== undefined) {
    e.preventDefault();
    makeMove(map[e.key]);
  }
});

// Touch swipe
let touchStart = null;
boardEl.addEventListener('touchstart', e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
boardEl.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    makeMove(dx > 0 ? 1 : 0);
  } else {
    makeMove(dy > 0 ? 3 : 2);
  }
  touchStart = null;
});

retryBtn.addEventListener('click', init);
continueBtn.addEventListener('click', () => { overlay.style.display = 'none'; });
newGameBtn.addEventListener('click', init);

init();
