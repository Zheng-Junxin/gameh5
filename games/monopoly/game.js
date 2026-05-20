const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const moneyEl = document.getElementById('money');
const turnInfo = document.getElementById('turnInfo');
const logEl = document.getElementById('log');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');
const rollBtn = document.getElementById('rollBtn');
const endTurnBtn = document.getElementById('endTurnBtn');

const BOARD_SIZE = 20;
const TILE_TYPES = ['start','land','land','land','land','land','chance','land','land','land','land','land','tax','land','land','land','land','land','chance','land'];

let W, CELL;
let playerPos, playerMoney, computerPos, computerMoney, currentPlayer, gameActive;
let diceValue, rolled;

function resize() {
  const c = canvas.parentElement; W = Math.min(c.clientWidth - 8, 460);
  CELL = W / 1.15; // Square board
  canvas.width = CELL; canvas.height = CELL;
  canvas.style.width = CELL + 'px'; canvas.style.height = CELL + 'px';
}

function init() {
  resize();
  playerPos = 0; computerPos = 0;
  playerMoney = 1500; computerMoney = 1500;
  currentPlayer = 'player'; gameActive = true;
  diceValue = 0; rolled = false;
  updateUI();
  overlay.style.display = 'none';
  log('🎲 欢迎来到大富翁！掷骰子开始吧');
  draw();
}

function log(msg) {
  logEl.innerHTML = msg + '<br>' + logEl.innerHTML.split('<br>').slice(0, 9).join('<br>');
}

function updateUI() {
  moneyEl.textContent = playerMoney;
  turnInfo.textContent = currentPlayer === 'player' ? '你的回合' : '电脑回合';
  rollBtn.disabled = currentPlayer !== 'player' || rolled || !gameActive;
  endTurnBtn.disabled = currentPlayer !== 'player' || !rolled || !gameActive;
}

function roll() { return Math.floor(Math.random() * 6) + 1; }

function getTileName(pos) {
  const names = ['起点','空地','空地','空地','空地','空地','机会','空地','空地','空地','空地','空地','缴税','空地','空地','空地','空地','空地','机会','空地'];
  return names[pos % 20];
}

function processTile(player, pos) {
  const isPlayer = (player === 'player');
  const tile = pos % 20;

  if (pos === 0 || pos % 20 === 0) {
    const bonus = 200;
    if (isPlayer) { playerMoney += bonus; log(`🎁 经过起点，获得 ${bonus}元`); }
    else { computerMoney += bonus; log(`💻 电脑经过起点，获得 ${bonus}元`); }
  } else if (tile === 6 || tile === 18) {
    // Chance
    const effects = [
      (m) => m + 150 + '元奖励',
      (m) => m - 100 > 0 ? m - 100 : 0 + '元罚款',
      (m) => m + 50 + '元修理费',
      (m) => m + 200 + '元大奖',
    ];
    const effect = effects[Math.floor(Math.random() * effects.length)];
    if (isPlayer) { playerMoney = Math.max(0, playerMoney + parseInt(effect(0))); log(`🎲 机会卡：${effect(playerMoney - playerMoney)}`); }
    else { computerMoney = Math.max(0, computerMoney + parseInt(effect(0))); log(`💻 电脑触发机会卡`); }
  } else if (tile === 12) {
    if (isPlayer) { playerMoney = Math.max(0, playerMoney - 80); log('💰 缴税 80元'); }
    else { computerMoney = Math.max(0, computerMoney - 80); log('💻 电脑缴税 80元'); }
  } else if (tile >= 1 && tile <= 19 && tile % 6 !== 0 && tile !== 12) {
    const rent = 60 + Math.floor(Math.random() * 40);
    if (isPlayer) {
      if (tile % 3 === 0) {
        playerMoney = Math.max(0, playerMoney - rent);
        log(`💸 踩中收费地，支付 ${rent}元`);
      }
    } else {
      if (tile % 3 === 1) {
        computerMoney = Math.max(0, computerMoney - rent);
        log(`💻 电脑踩中收费地，支付 ${rent}元`);
      }
    }
  }

  if (isPlayer ? playerMoney <= 0 : computerMoney <= 0) {
    gameActive = false;
    const winner = isPlayer ? '电脑' : '你';
    overlayTitle.textContent = isPlayer ? '💀 你破产了！' : '🏆 你赢了！';
    overlayMsg.textContent = `${winner}获胜！`;
    overlay.style.display = 'flex';
  }

  updateUI(); draw();
}

function playerRoll() {
  if (!gameActive || rolled || currentPlayer !== 'player') return;
  const d1 = roll(), d2 = roll();
  diceValue = d1 + d2;
  rolled = true;
  playerPos = (playerPos + diceValue) % (BOARD_SIZE * 3);
  log(`🎲 你掷出了 ${d1}+${d2}=${diceValue}，走到 ${getTileName(playerPos)}`);
  draw();
  setTimeout(() => processTile('player', playerPos), 600);
}

function computerTurn() {
  if (!gameActive) return;
  const d1 = roll(), d2 = roll();
  const total = d1 + d2;
  computerPos = (computerPos + total) % (BOARD_SIZE * 3);
  log(`💻 电脑掷出 ${d1}+${d2}=${total}，走到 ${getTileName(computerPos)}`);
  processTile('computer', computerPos);

  setTimeout(() => {
    if (gameActive) {
      currentPlayer = 'player';
      rolled = false;
      updateUI();
      log('🟢 轮到你了！');
    }
  }, 800);
}

function draw() {
  const SIZE = CELL;
  const TRACK = SIZE * 0.75;
  const MARGIN = (SIZE - TRACK) / 2;
  const SEG = TRACK / 5;

  ctx.fillStyle = '#E8F5E9'; ctx.fillRect(0, 0, SIZE, SIZE);

  // Board
  ctx.fillStyle = '#A5D6A7';
  ctx.fillRect(MARGIN, MARGIN, TRACK, TRACK);
  ctx.fillStyle = '#C8E6C9';
  ctx.fillRect(MARGIN + SEG, MARGIN + SEG, TRACK - SEG * 2, TRACK - SEG * 2);

  // Tiles
  for (let i = 0; i < 5; i++) {
    drawTile(MARGIN + i * SEG, MARGIN, SEG, SEG, i, 'top');
    drawTile(MARGIN + TRACK - SEG, MARGIN + i * SEG, SEG, SEG, i + 5, 'right');
    drawTile(MARGIN + (4 - i) * SEG, MARGIN + TRACK - SEG, SEG, SEG, i + 10, 'bottom');
    drawTile(MARGIN, MARGIN + (4 - i) * SEG, SEG, SEG, i + 15, 'left');
  }

  // Players
  function posOnBoard(pos) {
    const p = (pos % 20 + 20) % 20;
    if (p < 5) return { x: MARGIN + p * SEG + SEG / 2, y: MARGIN + SEG / 2 };
    if (p < 10) return { x: MARGIN + TRACK - SEG + SEG / 2, y: MARGIN + (p - 5) * SEG + SEG / 2 };
    if (p < 15) return { x: MARGIN + (14 - p) * SEG + SEG / 2, y: MARGIN + TRACK - SEG + SEG / 2 };
    return { x: MARGIN + SEG / 2, y: MARGIN + (19 - p) * SEG + SEG / 2 };
  }

  const pp = posOnBoard(playerPos);
  ctx.fillStyle = '#2196F3'; ctx.beginPath(); ctx.arc(pp.x, pp.y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('P', pp.x, pp.y + 3);

  const cp = posOnBoard(computerPos);
  ctx.fillStyle = '#F44336'; ctx.beginPath(); ctx.arc(cp.x + 18, cp.y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText('C', cp.x + 18, cp.y + 3);

  // Dice
  if (diceValue > 0) {
    ctx.fillStyle = '#FF9800'; ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`🎲${diceValue}`, SIZE / 2, SIZE / 2 + 10);
  }
}

function drawTile(x, y, w, h, idx, side) {
  const colors = ['#FFEB3B','#E8F5E9','#E8F5E9','#E8F5E9','#E8F5E9','#E8F5E9','#BBDEFB','#E8F5E9','#E8F5E9','#E8F5E9','#E8F5E9','#E8F5E9','#FFCDD2','#E8F5E9','#E8F5E9','#E8F5E9','#E8F5E9','#E8F5E9','#BBDEFB','#E8F5E9'];
  const labels = ['起','地','地','地','地','地','?','地','地','地','地','地','税','地','地','地','地','地','?','地'];

  ctx.fillStyle = colors[idx]; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = '#81C784'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#333'; ctx.font = '9px "PingFang SC",sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(labels[idx], x + w / 2, y + h / 2 + 4);
}

rollBtn.addEventListener('click', () => { if (currentPlayer === 'player' && !rolled) playerRoll(); });
endTurnBtn.addEventListener('click', () => {
  if (currentPlayer === 'player' && rolled && gameActive) {
    currentPlayer = 'computer'; rolled = false; diceValue = 0;
    updateUI(); draw();
    setTimeout(computerTurn, 500);
  }
});
overlayBtn.addEventListener('click', init);

init();
