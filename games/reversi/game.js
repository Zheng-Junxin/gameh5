const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const turnEl = document.getElementById('turn');
const blackScoreEl = document.getElementById('blackScore');
const whiteScoreEl = document.getElementById('whiteScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');
const newGameBtn = document.getElementById('newGameBtn');
const passBtn = document.getElementById('passBtn');

const SIZE = 8;
let W, CELL;
let board, currentPlayer, gameOver;

const DIRECTIONS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function resize() {
  const container = canvas.parentElement;
  W = Math.min(container.clientWidth - 8, 420);
  CELL = W / SIZE;
  canvas.width = W;
  canvas.height = W;
  canvas.style.width = W + 'px';
  canvas.style.height = W + 'px';
}

function init() {
  resize();
  board = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  board[3][3] = board[4][4] = 2; // white
  board[3][4] = board[4][3] = 1; // black
  currentPlayer = 1; // black first
  gameOver = false;
  overlay.style.display = 'none';
  updateUI();
  draw();
}

function opponent(p) { return 3 - p; }

function isValidMove(r, c, player) {
  if (board[r][c] !== 0) return false;
  for (const [dr, dc] of DIRECTIONS) {
    let nr = r + dr, nc = c + dc, foundOpponent = false;
    while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === opponent(player)) {
      foundOpponent = true;
      nr += dr; nc += dc;
    }
    if (foundOpponent && nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) return true;
  }
  return false;
}

function getValidMoves(player) {
  const moves = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (isValidMove(r, c, player)) moves.push({ r, c });
  return moves;
}

function makeMove(r, c, player) {
  board[r][c] = player;
  for (const [dr, dc] of DIRECTIONS) {
    const toFlip = [];
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === opponent(player)) {
      toFlip.push({ r: nr, c: nc });
      nr += dr; nc += dc;
    }
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
      toFlip.forEach(p => board[p.r][p.c] = player);
    }
  }
}

function getScore() {
  let black = 0, white = 0;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === 1) black++; else if (board[r][c] === 2) white++;
  return { black, white };
}

function draw() {
  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(0, 0, W, W);

  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = 1;
  for (let i = 1; i < SIZE; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke();
  }

  const validMoves = gameOver ? [] : getValidMoves(currentPlayer);

  // Valid move indicators
  if (currentPlayer === 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    validMoves.forEach(({ r, c }) => {
      ctx.beginPath(); ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, CELL * 0.15, 0, Math.PI * 2); ctx.fill();
    });
  }

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) continue;
      const x = c * CELL + CELL / 2, y = r * CELL + CELL / 2;
      const radius = CELL * 0.4;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.arc(x + 1, y + 1, radius, 0, Math.PI * 2); ctx.fill();

      // Piece
      const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
      if (board[r][c] === 1) {
        grad.addColorStop(0, '#616161'); grad.addColorStop(1, '#212121');
      } else {
        grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#bdbdbd');
      }
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function updateUI() {
  const { black, white } = getScore();
  blackScoreEl.textContent = black;
  whiteScoreEl.textContent = white;
  turnEl.textContent = currentPlayer === 1 ? '⚫ 黑棋回合' : '⚪ 白棋回合';
}

function checkGameEnd() {
  const blackMoves = getValidMoves(1);
  const whiteMoves = getValidMoves(2);
  if (blackMoves.length === 0 && whiteMoves.length === 0) {
    endGame();
  } else if (getValidMoves(currentPlayer).length === 0) {
    currentPlayer = opponent(currentPlayer);
    updateUI();
    draw();
    if (currentPlayer === 2) setTimeout(aiMove, 500);
  }
}

function endGame() {
  gameOver = true;
  const { black, white } = getScore();
  let result;
  if (black > white) result = '⚫ 黑棋获胜！';
  else if (white > black) result = '⚪ 白棋获胜！';
  else result = '平局！';
  overlayTitle.textContent = result;
  overlayMsg.textContent = `黑棋 ${black} : ${white} 白棋`;
  overlay.style.display = 'flex';
  draw();
}

function humanMove(r, c) {
  if (gameOver || currentPlayer !== 1) return;
  if (!isValidMove(r, c, 1)) return;

  makeMove(r, c, 1);
  currentPlayer = 2;
  updateUI();
  draw();

  if (getValidMoves(2).length === 0) {
    checkGameEnd();
    return;
  }
  if (getValidMoves(1).length === 0) {
    currentPlayer = 1;
    updateUI();
    draw();
    return;
  }

  setTimeout(aiMove, 400);
}

function aiMove() {
  if (gameOver || currentPlayer !== 2) return;
  const moves = getValidMoves(2);
  if (moves.length === 0) { checkGameEnd(); return; }

  // Simple AI: prefer corners, then edges, maximize flips
  const corners = moves.filter(m => (m.r === 0 || m.r === 7) && (m.c === 0 || m.c === 7));
  const edges = moves.filter(m => m.r === 0 || m.r === 7 || m.c === 0 || m.c === 7);

  let best = moves[0]; let maxFlips = -1;
  const candidates = corners.length > 0 ? corners : edges.length > 0 ? edges : moves;

  for (const m of candidates) {
    const temp = board.map(r => [...r]);
    board[m.r][m.c] = 2;
    let flips = 0;
    for (const [dr, dc] of DIRECTIONS) {
      let nr = m.r + dr, nc = m.c + dc, count = 0;
      while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === 1) { count++; nr += dr; nc += dc; }
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === 2) flips += count;
    }
    board = temp;
    if (flips > maxFlips) { maxFlips = flips; best = m; }
  }

  makeMove(best.r, best.c, 2);
  currentPlayer = 1;
  updateUI();
  draw();
  checkGameEnd();
}

canvas.addEventListener('click', e => {
  if (gameOver || currentPlayer !== 1) return;
  const rect = canvas.getBoundingClientRect();
  const scale = W / rect.width;
  const r = Math.floor((e.clientY - rect.top) * scale / CELL);
  const c = Math.floor((e.clientX - rect.left) * scale / CELL);
  humanMove(r, c);
});

newGameBtn.addEventListener('click', init);
overlayBtn.addEventListener('click', init);
passBtn.addEventListener('click', () => {
  if (currentPlayer === 1) { currentPlayer = 2; updateUI(); draw(); setTimeout(aiMove, 500); }
});

init();
