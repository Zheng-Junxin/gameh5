const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const levelNumEl = document.getElementById('levelNum');
const movesEl = document.getElementById('moves');
const completedCountEl = document.getElementById('completedCount');
const totalLevelsEl = document.getElementById('totalLevels');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');

const LEVELS = [
  // Level 1-5: Tutorial
  ['  ####  ','###  ###','#  $  # ','# .@. #','#  $  # ','###  ###','  ####  '],
  ['#####','#.@ #','# $ #','# . #','#   #','#####'],
  [' #### ','##  ##','# $@ #','# .# #','# $ # ','## .##',' #### '],
  [' ##### ','###  ##','#  $$ #','# .@. #','##   ##',' ##### '],
  ['######','#    #','# #$ #','# .@ #','# .$ #','#    #','######'],
  // Level 6-10
  [' #### ','#    #','# #$ #','#*@. #','# #$ #','#    #',' #### '],
  ['######','#  . #','# $# #','# .@ #','#  $ #','#  . #','######'],
  [' #####','##   #','# $  #','# .@ #','#  $ #','#   ##','#####'],
  ['########','#   #  #','# $ #  #','# .@. ##','# $$#  #','#    ###','########'],
  ['  ####  ','###  ###','# .$ . #','#  @   #','# $$ $ #','###  ###','  ####  '],
  // Level 11-15
  ['######','#    #','# .$ #','# $@. #','# $# #','#    #','######'],
  [' #### ','# ..# ','# $  #','#  @ #','# $  #','# ..# ',' #### '],
  ['########','#  .   #','# $$ # #','#   @. #','# . $ #','#   .  #','########'],
  [' #####','##.  #','# $$ #','# .@ #','#  $ #','#  .##','#####'],
  ['########','# .  . #','#  $$  #','#  @@  #','# .  . #','########'],
  // Level 16-20
  [' #######','##  .  #','#  $$  #','#  @   #','#  .   #','##   ###',' #####'],
  [' #####','##. .#','# $$ #','# @  #','# .$ #','## . #',' ####'],
  ['########','#  .   #','#  $   #','# $@ . #','# .$$  #','#      #','########'],
  [' ######','## .  #','#  $$ #','# .   #','#  @  #','##  ###',' #####'],
  [' #### ','# ..# ','# $$ #','# $$@# ','# .  # ','######'],
  // Level 21-25
  ['########','#   .  #','#  $$  #','#  @   #','#  ..  #','#   .  #','########'],
  [' ######','## .  #','#     #','#  @. #','#  $$ #','#   .##','######'],
  ['#######','#  .  #','# $$$ #','# ... #','# @   #','#######'],
  [' ######','## .. #','# .$  #','# $$ @#','# .   #','#   ###','#####'],
  ['########','# .  . #','#  $$  #','#  ..  #','#  $$  #','# . @. #','########'],
  // Level 26-27 bonus
  [' #######','## ... #','#  $$$ #','#  @   #','#   $  #','##  ####',' #####'],
  [' ####### ','##  ...##','#  $$$  #','#   @   #','#  ..$  #','##     ##','  ###### '],
];

let W, H, CELL;
let levelData, playerR, playerC, moves, history;
let currentLevel, completedLevels;

function loadLevel(idx) {
  const raw = LEVELS[idx];
  levelData = raw.map(r => r.split(''));
  // Find player
  for (let r = 0; r < levelData.length; r++) {
    for (let c = 0; c < levelData[r].length; c++) {
      if (levelData[r][c] === '@') { playerR = r; playerC = c; levelData[r][c] = ' '; }
      else if (levelData[r][c] === '+') { playerR = r; playerC = c; levelData[r][c] = '.'; }
    }
  }
  moves = 0;
  history = [];
}

function resize() {
  const container = canvas.parentElement;
  const maxW = Math.min(container.clientWidth - 8, 440);
  W = maxW;
  const rows = levelData.length;
  const cols = Math.max(...levelData.map(r => r.length));
  CELL = Math.min(W / cols, W / rows * 1.2);
  H = rows * CELL;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
}

function draw() {
  ctx.fillStyle = '#263238';
  ctx.fillRect(0, 0, W, H);

  const offsetX = Math.max(0, (W - levelData[0].length * CELL)) / 2;

  for (let r = 0; r < levelData.length; r++) {
    for (let c = 0; c < levelData[r].length; c++) {
      const x = offsetX + c * CELL, y = r * CELL;
      const ch = levelData[r][c];

      if (ch === '#') {
        ctx.fillStyle = '#546E7A';
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 1, y + 1, CELL - 2, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 1, y + CELL - 4, CELL - 2, 3);
      } else {
        ctx.fillStyle = '#37474F';
        ctx.fillRect(x, y, CELL, CELL);
      }

      if (ch === '.' || ch === '*' || ch === '+') {
        ctx.fillStyle = '#FFAB91';
        ctx.beginPath();
        ctx.arc(x + CELL / 2, y + CELL / 2, CELL * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }

      if (ch === '$' || ch === '*') {
        ctx.fillStyle = ch === '*' ? '#66BB6A' : '#FFA726';
        ctx.fillRect(x + 3, y + 3, CELL - 6, CELL - 6);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 3, y + 3, CELL - 6, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 3, y + CELL - 6, CELL - 6, 3);
      }
    }
  }

  // Player
  const px = offsetX + playerC * CELL + CELL / 2;
  const py = playerR * CELL + CELL / 2;
  ctx.fillStyle = '#42A5F5';
  ctx.beginPath();
  ctx.arc(px, py, CELL * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px - CELL * 0.08, py - CELL * 0.08, CELL * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function isWall(r, c) {
  return levelData[r] && levelData[r][c] === '#';
}

function getBox(r, c) {
  if (!levelData[r]) return null;
  return levelData[r][c] === '$' || levelData[r][c] === '*';
}

function movePlayer(dr, dc) {
  const nr = playerR + dr, nc = playerC + dc;

  if (isWall(nr, nc)) return;

  if (getBox(nr, nc)) {
    const br = nr + dr, bc = nc + dc;
    if (isWall(br, bc) || getBox(br, bc)) return;
    if (levelData[br][bc] === '.') levelData[br][bc] = '*';
    else levelData[br][bc] = '$';
    if (levelData[nr][nc] === '*') levelData[nr][nc] = '.';
    else levelData[nr][nc] = ' ';
  }

  history.push({ pr: playerR, pc: playerC, data: levelData.map(r => [...r]) });

  playerR = nr;
  playerC = nc;
  moves++;
  movesEl.textContent = moves;
  draw();

  if (checkWin()) {
    setTimeout(() => {
      completedLevels.add(currentLevel);
      saveProgress();
      overlayTitle.textContent = '🎉 通关！';
      overlayMsg.textContent = `第${currentLevel + 1}关完成，用了${moves}步`;
      overlay.style.display = 'flex';
    }, 300);
  }
}

function checkWin() {
  for (const row of levelData) {
    for (const ch of row) {
      if (ch === '.' || ch === '+') return false;
    }
  }
  return true;
}

function undo() {
  if (history.length === 0) return;
  const prev = history.pop();
  playerR = prev.pr;
  playerC = prev.pc;
  levelData = prev.data;
  moves = Math.max(0, moves - 1);
  movesEl.textContent = moves;
  draw();
}

function selectLevel(idx) {
  if (idx < 0 || idx >= LEVELS.length) return;
  currentLevel = idx;
  loadLevel(idx);
  resize();
  levelNumEl.textContent = idx + 1;
  movesEl.textContent = '0';
  overlay.style.display = 'none';
  draw();
  updateNav();
}

function saveProgress() {
  try {
    localStorage.setItem('sokobanProgress', JSON.stringify([...completedLevels]));
  } catch(e) {}
}

function updateNav() {
  completedCountEl.textContent = completedLevels.size;
}

function updateAll() {
  totalLevelsEl.textContent = LEVELS.length;
}

// Input
document.addEventListener('keydown', e => {
  if (overlay.style.display === 'flex') return;
  const map = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1],
                 w: [-1,0], s: [1,0], a: [0,-1], d: [0,1],
                 W: [-1,0], S: [1,0], A: [0,-1], D: [0,1] };
  const d = map[e.key];
  if (d) { e.preventDefault(); movePlayer(d[0], d[1]); }
  if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
});

document.querySelectorAll('.dir-btn').forEach(btn => {
  btn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (overlay.style.display === 'flex') return;
    const [dr, dc] = btn.getAttribute('data-dir').split(',').map(Number);
    movePlayer(dr, dc);
  });
});

// Touch swipe
let touchStart = null;
canvas.addEventListener('touchstart', e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) movePlayer(0, dx > 0 ? 1 : -1);
  else movePlayer(dy > 0 ? 1 : -1, 0);
  touchStart = null;
});

document.getElementById('prevBtn').addEventListener('click', () => selectLevel(currentLevel - 1));
document.getElementById('nextBtn').addEventListener('click', () => selectLevel(currentLevel + 1));
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('resetBtn').addEventListener('click', () => selectLevel(currentLevel));
overlayBtn.addEventListener('click', () => {
  if (currentLevel < LEVELS.length - 1) selectLevel(currentLevel + 1);
  else selectLevel(0);
});

// Init
try {
  const saved = JSON.parse(localStorage.getItem('sokobanProgress') || '[]');
  completedLevels = new Set(saved);
} catch(e) { completedLevels = new Set(); }

updateAll();
selectLevel(0);
