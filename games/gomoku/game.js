const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const turnEl = document.getElementById('turn');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');
const newGameBtn = document.getElementById('newGameBtn');
const undoBtn = document.getElementById('undoBtn');
const modeBtn = document.getElementById('modeBtn');

const SIZE = 15;
let W, CELL, MARGIN;
let board, currentPlayer, gameOver, history, aiMode;

function resize() {
  const container = canvas.parentElement;
  W = Math.min(container.clientWidth - 8, 440);
  MARGIN = W * 0.06;
  CELL = (W - MARGIN * 2) / (SIZE - 1);
  canvas.width = W;
  canvas.height = W;
  canvas.style.width = W + 'px';
  canvas.style.height = W + 'px';
}

function init() {
  resize();
  board = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  currentPlayer = 1; // black
  gameOver = false;
  history = [];
  overlay.style.display = 'none';
  turnEl.textContent = '⚫ 黑方回合';
  draw();
}

function opponent(p) { return p === 1 ? 2 : 1; }

function checkWin(r, c, player) {
  const directions = [[1,0],[0,1],[1,1],[1,-1]];
  for (const [dr, dc] of directions) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) count++;
      else break;
    }
    for (let i = 1; i < 5; i++) {
      const nr = r - dr * i, nc = c - dc * i;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) count++;
      else break;
    }
    if (count >= 5) return true;
  }
  return false;
}

function isDraw() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === 0) return false;
  return true;
}

function draw() {
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(0, 0, W, W);

  // Grid
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 1;
  for (let i = 0; i < SIZE; i++) {
    const pos = MARGIN + i * CELL;
    ctx.beginPath(); ctx.moveTo(MARGIN, pos); ctx.lineTo(W - MARGIN, pos); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pos, MARGIN); ctx.lineTo(pos, W - MARGIN); ctx.stroke();
  }

  // Star points
  const stars = [[3,3],[7,7],[11,11],[3,11],[11,3],[7,3],[7,11],[3,7],[11,7]];
  stars.forEach(([r, c]) => {
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(MARGIN + c * CELL, MARGIN + r * CELL, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Pieces
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) continue;
      const x = MARGIN + c * CELL, y = MARGIN + r * CELL;
      const rSize = CELL * 0.42;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.arc(x + 1, y + 1, rSize, 0, Math.PI * 2); ctx.fill();

      const grad = ctx.createRadialGradient(x - rSize * 0.3, y - rSize * 0.3, rSize * 0.1, x, y, rSize);
      if (board[r][c] === 1) {
        grad.addColorStop(0, '#555'); grad.addColorStop(1, '#111');
      } else {
        grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ccc');
      }
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, rSize, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Last move indicator
  if (history.length > 0) {
    const last = history[history.length - 1];
    const x = MARGIN + last.c * CELL, y = MARGIN + last.r * CELL;
    ctx.strokeStyle = '#F44336';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, CELL * 0.22, 0, Math.PI * 2); ctx.stroke();
  }
}

function makeMove(r, c) {
  if (gameOver || board[r][c] !== 0) return false;
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;

  board[r][c] = currentPlayer;
  history.push({ r, c, player: currentPlayer });

  if (checkWin(r, c, currentPlayer)) {
    gameOver = true;
    const name = currentPlayer === 1 ? '⚫ 黑方' : '⚪ 白方';
    overlayTitle.textContent = `🎉 ${name}获胜！`;
    overlayMsg.textContent = `共下${history.length}手`;
    overlay.style.display = 'flex';
    draw();
    return true;
  }

  if (isDraw()) {
    gameOver = true;
    overlayTitle.textContent = '平局！';
    overlayMsg.textContent = '棋盘已满';
    overlay.style.display = 'flex';
    draw();
    return true;
  }

  currentPlayer = opponent(currentPlayer);
  turnEl.textContent = currentPlayer === 1 ? '⚫ 黑方回合' : '⚪ 白方回合';
  draw();
  return true;
}

function evaluateBoard() {
  // Simple scoring: count patterns
  let score = 0;
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) continue;
      for (const [dr, dc] of dirs) {
        let count = 1, openEnds = 0;
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === board[r][c]) { count++; nr += dr; nc += dc; }
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === 0) openEnds++;
        nr = r - dr; nc = c - dc;
        while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === board[r][c]) { count++; nr -= dr; nc -= dc; }
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === 0) openEnds++;

        if (count >= 5) score += board[r][c] === 2 ? 100000 : -100000;
        else if (openEnds === 2) score += (board[r][c] === 2 ? 1 : -1) * (10 ** count);
        else if (openEnds === 1) score += (board[r][c] === 2 ? 1 : -1) * (5 ** count);
      }
    }
  }
  return score;
}

function aiMove() {
  // Simple minimax-like: find best scoring move for AI
  let bestScore = -Infinity;
  let bestMove = null;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== 0) continue;
      // Check if near existing pieces
      let hasNeighbor = false;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (r + dr >= 0 && r + dr < SIZE && c + dc >= 0 && c + dc < SIZE && board[r + dr][c + dc] !== 0)
            hasNeighbor = true;
      if (!hasNeighbor) continue;

      board[r][c] = 2;
      const score = evaluateBoard();
      board[r][c] = 0;

      if (score > bestScore) {
        bestScore = score;
        bestMove = { r, c };
      }
    }
  }

  // Fallback: center
  if (!bestMove) {
    const center = Math.floor(SIZE / 2);
    if (board[center][center] === 0) bestMove = { r: center, c: center };
    else {
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
          if (board[r][c] === 0) { bestMove = { r, c }; break; }
    }
  }

  if (bestMove) makeMove(bestMove.r, bestMove.c);
}

function undoMove() {
  if (gameOver || history.length === 0) return;
  if (aiMode && history.length >= 2) {
    const aiHistory = history.pop();
    board[aiHistory.r][aiHistory.c] = 0;
    const humanHistory = history.pop();
    board[humanHistory.r][humanHistory.c] = 0;
    currentPlayer = 1;
  } else if (!aiMode) {
    const last = history.pop();
    board[last.r][last.c] = 0;
    currentPlayer = last.player;
  }
  turnEl.textContent = currentPlayer === 1 ? '⚫ 黑方回合' : '⚪ 白方回合';
  draw();
}

canvas.addEventListener('click', e => {
  if (gameOver) return;
  if (aiMode && currentPlayer === 2) return;

  const rect = canvas.getBoundingClientRect();
  const scale = W / rect.width;
  const x = (e.clientX - rect.left) * scale;
  const y = (e.clientY - rect.top) * scale;

  const c = Math.round((x - MARGIN) / CELL);
  const r = Math.round((y - MARGIN) / CELL);

  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;

  if (!makeMove(r, c)) return;

  if (aiMode && !gameOver && currentPlayer === 2) {
    setTimeout(aiMove, 300);
  }
});

modeBtn.addEventListener('click', () => {
  aiMode = !aiMode;
  modeBtn.textContent = aiMode ? '双人对战' : '人机对战';
  init();
});

newGameBtn.addEventListener('click', init);
overlayBtn.addEventListener('click', init);
undoBtn.addEventListener('click', undoMove);

init();
