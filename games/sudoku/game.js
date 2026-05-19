const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const levelNumEl = document.getElementById('levelNum');
const hintCountEl = document.getElementById('hintCount');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');
const difficultySelect = document.getElementById('difficultySelect');
const newGameBtn = document.getElementById('newGameBtn');
const hintBtn = document.getElementById('hintBtn');

const DIFFICULTY = { easy: 38, medium: 46, hard: 53 };

let W, CELL;
let board, solution, given, userBoard, selectedR, selectedC;
let difficulty, level, hints, timerSec, timerInterval;
let gameComplete;

function resize() {
  const container = canvas.parentElement;
  W = Math.min(container.clientWidth - 8, 400);
  CELL = W / 9;
  canvas.width = W;
  canvas.height = W;
  canvas.style.width = W + 'px';
  canvas.style.height = W + 'px';
}

// Seeded random for reproducible puzzles
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleArray(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCompleteBoard(seed) {
  const rand = seededRandom(seed);
  const board = Array(9).fill(null).map(() => Array(9).fill(0));

  function isValid(b, r, c, n) {
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === n || b[i][c] === n) return false;
      const br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
      const bc = Math.floor(c / 3) * 3 + i % 3;
      if (b[br][bc] === n) return false;
    }
    return true;
  }

  function fill(b) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          const nums = shuffleArray([1,2,3,4,5,6,7,8,9], rand);
          for (const n of nums) {
            if (isValid(b, r, c, n)) {
              b[r][c] = n;
              if (fill(b)) return true;
              b[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  fill(board);
  return board;
}

function generatePuzzle(seed, blanks) {
  const solution = generateCompleteBoard(seed);
  const board = solution.map(r => [...r]);
  const rand = seededRandom(seed + 9999);

  const cells = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      cells.push({ r, c });

  const shuffled = shuffleArray(cells, rand);
  let removed = 0;

  for (const { r, c } of shuffled) {
    if (removed >= blanks) break;
    const backup = board[r][c];
    board[r][c] = 0;
    removed++;
  }

  const given = Array(9).fill(null).map((_, r) =>
    Array(9).fill(null).map((_, c) => board[r][c] !== 0)
  );

  return { board, solution, given };
}

function init() {
  resize();
  clearInterval(timerInterval);
  difficulty = difficultySelect.value;
  level = Math.floor(Math.random() * 20) + 1;

  const seed = difficulty === 'easy' ? level * 100 : difficulty === 'medium' ? level * 100 + 5000 : level * 100 + 10000;
  const blanks = DIFFICULTY[difficulty];
  const puzzle = generatePuzzle(seed, blanks);

  board = puzzle.board;
  solution = puzzle.solution;
  given = puzzle.given;
  userBoard = board.map(r => [...r]);
  selectedR = -1;
  selectedC = -1;
  hints = 3;
  timerSec = 0;
  gameComplete = false;

  levelNumEl.textContent = level;
  hintCountEl.textContent = hints;
  timerEl.textContent = '00:00';
  overlay.style.display = 'none';
  hintBtn.disabled = false;
  draw();
}

function draw() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, W);

  // Grid lines
  for (let i = 0; i <= 9; i++) {
    const w = i % 3 === 0 ? 2.5 : 1;
    ctx.strokeStyle = i % 3 === 0 ? '#333' : '#bbb';
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke();
  }

  // Selection highlight
  if (selectedR >= 0 && selectedC >= 0) {
    ctx.fillStyle = 'rgba(187,222,251,0.6)';
    ctx.fillRect(selectedC * CELL + 1, selectedR * CELL + 1, CELL - 2, CELL - 2);

    // Same row/col highlight
    ctx.fillStyle = 'rgba(227,242,253,0.4)';
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(i * CELL + 1, selectedR * CELL + 1, CELL - 2, CELL - 2);
      ctx.fillRect(selectedC * CELL + 1, i * CELL + 1, CELL - 2, CELL - 2);
    }

    // Same number highlight
    const selVal = userBoard[selectedR][selectedC];
    if (selVal > 0) {
      ctx.fillStyle = 'rgba(200,230,201,0.5)';
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          if (userBoard[r][c] === selVal)
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
    }
  }

  // Numbers
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = userBoard[r][c];
      if (val === 0) continue;

      const x = c * CELL + CELL / 2;
      const y = r * CELL + CELL / 2 + 1;

      if (given[r][c]) {
        ctx.fillStyle = '#333';
        ctx.font = `bold ${CELL * 0.52}px "PingFang SC", sans-serif`;
      } else {
        // Check conflicts
        const conflict = val !== solution[r][c];
        ctx.fillStyle = conflict ? '#E53935' : '#1565C0';
        ctx.font = `${CELL * 0.5}px "PingFang SC", sans-serif`;
      }
      ctx.fillText(val, x, y);
    }
  }
}

function getCell(e) {
  const rect = canvas.getBoundingClientRect();
  const scale = W / rect.width;
  const x = (e.clientX - rect.left) * scale;
  const y = (e.clientY - rect.top) * scale;
  const c = Math.floor(x / CELL);
  const r = Math.floor(y / CELL);
  return { r, c };
}

canvas.addEventListener('click', e => {
  if (gameComplete) return;
  const { r, c } = getCell(e);
  if (r < 0 || r >= 9 || c < 0 || c >= 9) return;
  selectedR = r;
  selectedC = c;
  draw();
});

function inputNumber(n) {
  if (gameComplete || selectedR < 0 || selectedC < 0) return;
  if (given[selectedR][selectedC]) return;
  if (!timerInterval && n > 0) startTimer();
  userBoard[selectedR][selectedC] = n;
  draw();
  if (checkComplete()) {
    gameComplete = true;
    clearInterval(timerInterval);
    overlayTitle.textContent = '🎉 恭喜完成！';
    const m = String(Math.floor(timerSec / 60)).padStart(2, '0');
    const s = String(timerSec % 60).padStart(2, '0');
    overlayMsg.textContent = `第${level}关 (${difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}) 用时 ${m}:${s}`;
    overlay.style.display = 'flex';
  }
}

function checkComplete() {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (userBoard[r][c] !== solution[r][c]) return false;
  return true;
}

function useHint() {
  if (gameComplete || hints <= 0 || selectedR < 0 || selectedC < 0) return;
  if (given[selectedR][selectedC]) return;
  hints--;
  hintCountEl.textContent = hints;
  userBoard[selectedR][selectedC] = solution[selectedR][selectedC];
  given[selectedR][selectedC] = true; // mark as given so it can't be changed
  if (!timerInterval) startTimer();
  draw();
  if (checkComplete()) {
    gameComplete = true;
    clearInterval(timerInterval);
    overlayTitle.textContent = '🎉 恭喜完成！';
    overlayMsg.textContent = `使用了${3 - hints}个提示`;
    overlay.style.display = 'flex';
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    timerSec++;
    const m = String(Math.floor(timerSec / 60)).padStart(2, '0');
    const s = String(timerSec % 60).padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

// Number pad
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const num = btn.getAttribute('data-num');
    if (num === null) inputNumber(0); // delete
    else inputNumber(parseInt(num));
  });
});

// Keyboard
document.addEventListener('keydown', e => {
  if (gameComplete) return;
  const num = parseInt(e.key);
  if (num >= 1 && num <= 9) inputNumber(num);
  else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') inputNumber(0);
  else if (e.key === 'ArrowUp') { selectedR = Math.max(0, selectedR - 1); e.preventDefault(); draw(); }
  else if (e.key === 'ArrowDown') { selectedR = Math.min(8, selectedR + 1); e.preventDefault(); draw(); }
  else if (e.key === 'ArrowLeft') { selectedC = Math.max(0, selectedC - 1); e.preventDefault(); draw(); }
  else if (e.key === 'ArrowRight') { selectedC = Math.min(8, selectedC + 1); e.preventDefault(); draw(); }
});

difficultySelect.addEventListener('change', () => init());
newGameBtn.addEventListener('click', () => init());
hintBtn.addEventListener('click', useHint);
overlayBtn.addEventListener('click', () => { overlay.style.display = 'none'; init(); });

init();
