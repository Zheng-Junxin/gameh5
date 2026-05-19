const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const mineCountEl = document.getElementById('mineCount');
const timerEl = document.getElementById('timer');
const faceBtn = document.getElementById('faceBtn');
const newGameBtn = document.getElementById('newGameBtn');
const revealModeBtn = document.getElementById('revealMode');
const flagModeBtn = document.getElementById('flagMode');

const ROWS = 9, COLS = 9, MINES = 10;
let CELL;
let W, H;
let board, revealed, flagged, gameOver, firstClick, minesRemaining, timerSec, timerInterval;
let flagMode = false;

function resize() {
  const container = canvas.parentElement;
  const maxW = container.clientWidth - 8;
  W = Math.min(maxW, 420);
  H = W;
  CELL = W / COLS;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
}

const NUMBER_COLORS = ['', '#1a73e8', '#388e3c', '#d32f2f', '#7b1fa2', '#c62828', '#00838f', '#212121', '#757575'];

function init() {
  resize();
  clearInterval(timerInterval);
  board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
  revealed = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
  flagged = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
  gameOver = false;
  firstClick = true;
  minesRemaining = MINES;
  timerSec = 0;
  mineCountEl.textContent = MINES;
  timerEl.textContent = '000';
  faceBtn.textContent = '🙂';
  draw();
}

function placeMines(safeR, safeC) {
  const positions = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (r !== safeR || c !== safeC)
        positions.push({ r, c });

  // Fisher-Yates partial shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < MINES; i++) {
    board[positions[i].r][positions[i].c] = -1;
  }

  // Calculate adjacent counts
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === -1) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (board[r + dr] && board[r + dr][c + dc] === -1) count++;
      board[r][c] = count;
    }
  }
}

function reveal(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  if (revealed[r][c] || flagged[r][c]) return;

  revealed[r][c] = true;

  if (board[r][c] === 0) {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        reveal(r + dr, c + dc);
  }
}

function draw() {
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, 0, W, H);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL, y = r * CELL;

      if (revealed[r][c]) {
        ctx.fillStyle = '#bdbdbd';
        ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = '#9e9e9e';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);

        if (board[r][c] === -1) {
          ctx.fillStyle = '#d32f2f';
          ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, CELL * 0.3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#111';
          ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, CELL * 0.15, 0, Math.PI * 2); ctx.fill();
        } else if (board[r][c] > 0) {
          ctx.fillStyle = NUMBER_COLORS[board[r][c]];
          ctx.font = `bold ${CELL * 0.55}px "PingFang SC", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(board[r][c], x + CELL / 2, y + CELL / 2 + 1);
        }
      } else {
        // Raised cell
        const bevel = CELL * 0.12;
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x, y, CELL, CELL);

        // Top/left highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(x, y + CELL); ctx.lineTo(x, y); ctx.lineTo(x + CELL, y);
        ctx.lineTo(x + CELL - bevel, y + bevel); ctx.lineTo(x + bevel, y + bevel); ctx.lineTo(x + bevel, y + CELL - bevel);
        ctx.closePath(); ctx.fill();

        // Bottom/right shadow
        ctx.fillStyle = '#808080';
        ctx.beginPath(); ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); ctx.lineTo(x, y + CELL);
        ctx.lineTo(x + bevel, y + CELL - bevel); ctx.lineTo(x + CELL - bevel, y + CELL - bevel); ctx.lineTo(x + CELL - bevel, y + bevel);
        ctx.closePath(); ctx.fill();

        // Flag
        if (flagged[r][c]) {
          ctx.fillStyle = '#d32f2f';
          ctx.beginPath();
          const fx = x + CELL * 0.3, fy = y + CELL * 0.2;
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + CELL * 0.4, fy + CELL * 0.2);
          ctx.lineTo(fx, fy + CELL * 0.4);
          ctx.fill();
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx, y + CELL * 0.65);
          ctx.stroke();
        }

        if (gameOver && board[r][c] === -1 && !flagged[r][c]) {
          ctx.fillStyle = '#111';
          ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, CELL * 0.25, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }
}

function checkWin() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] !== -1 && !revealed[r][c]) return false;
  return true;
}

function endGame(won) {
  clearInterval(timerInterval);
  gameOver = true;
  faceBtn.textContent = won ? '😎' : '😵';

  if (!won) {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (board[r][c] === -1) revealed[r][c] = true;
  }
  draw();
}

canvas.addEventListener('click', e => {
  if (gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const r = Math.floor((e.clientY - rect.top) * scaleX / CELL);
  const c = Math.floor((e.clientX - rect.left) * scaleX / CELL);

  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;

  if (flagMode) {
    if (!revealed[r][c]) {
      flagged[r][c] = !flagged[r][c];
      minesRemaining += flagged[r][c] ? -1 : 1;
      mineCountEl.textContent = minesRemaining;
      draw();
    }
    return;
  }

  if (flagged[r][c] || revealed[r][c]) return;

  if (firstClick) {
    placeMines(r, c);
    timerInterval = setInterval(() => {
      timerSec++;
      timerEl.textContent = String(Math.min(timerSec, 999)).padStart(3, '0');
    }, 1000);
    firstClick = false;
  }

  if (board[r][c] === -1) {
    endGame(false);
    return;
  }

  reveal(r, c);
  draw();

  if (checkWin()) endGame(true);
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const r = Math.floor((e.clientY - rect.top) * scaleX / CELL);
  const c = Math.floor((e.clientX - rect.left) * scaleX / CELL);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  if (!revealed[r][c]) {
    flagged[r][c] = !flagged[r][c];
    minesRemaining += flagged[r][c] ? -1 : 1;
    mineCountEl.textContent = minesRemaining;
    draw();
  }
});

// Mobile long press for flag
let longPressTimer;
canvas.addEventListener('touchstart', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const r = Math.floor((e.touches[0].clientY - rect.top) * scaleX / CELL);
  const c = Math.floor((e.touches[0].clientX - rect.left) * scaleX / CELL);
  longPressTimer = setTimeout(() => {
    if (!gameOver && !revealed[r][c]) {
      flagged[r][c] = !flagged[r][c];
      minesRemaining += flagged[r][c] ? -1 : 1;
      mineCountEl.textContent = minesRemaining;
      draw();
    }
  }, 500);
});
canvas.addEventListener('touchend', () => clearTimeout(longPressTimer));
canvas.addEventListener('touchmove', () => clearTimeout(longPressTimer));

revealModeBtn.addEventListener('click', () => {
  flagMode = false;
  revealModeBtn.classList.add('active');
  flagModeBtn.classList.remove('active');
});
flagModeBtn.addEventListener('click', () => {
  flagMode = true;
  flagModeBtn.classList.add('active');
  revealModeBtn.classList.remove('active');
});

faceBtn.addEventListener('click', init);
newGameBtn.addEventListener('click', init);

init();
