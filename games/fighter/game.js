const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const p1HpEl = document.getElementById('p1Hp'); const p2HpEl = document.getElementById('p2Hp');
const p1HpText = document.getElementById('p1HpText'); const p2HpText = document.getElementById('p2HpText');
const roundInfo = document.getElementById('roundInfo'); const winsEl = document.getElementById('wins');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');

const MOVES = { rock: '👊拳', paper: '🖐防', scissors: '✌️踢' };
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const MAX_HP = 100;
const DODGE_CHANCE = 0.3;

let W, H;
let p1Hp, p2Hp, wins, round, gameActive;
let playerMove, aiMove, combatMsg;
let animFrame, animTimer;

function resize() {
  const c = canvas.parentElement;
  W = Math.min(c.clientWidth - 8, 420); H = Math.min(W * 0.6, 250);
  canvas.width = W; canvas.height = H;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
}

function init() {
  resize();
  p1Hp = MAX_HP; p2Hp = MAX_HP; wins = 0; round = 1; gameActive = true;
  playerMove = null; aiMove = null; combatMsg = '选择招式！';
  animFrame = 0; animTimer = null;
  updateUI();
  overlay.style.display = 'none';
  draw();
}

function updateUI() {
  p1HpEl.style.width = (p1Hp / MAX_HP * 100) + '%';
  p2HpEl.style.width = (p2Hp / MAX_HP * 100) + '%';
  p1HpText.textContent = p1Hp; p2HpText.textContent = p2Hp;
  roundInfo.textContent = `第${round}回合`;
  winsEl.textContent = wins;
}

function aiChoose() {
  if (Math.random() < 0.2 && playerMove) return BEATS[BEATS[playerMove]]; // counter
  const keys = Object.keys(MOVES);
  return keys[Math.floor(Math.random() * keys.length)];
}

function calcDamage(move, countered) { return countered ? 8 + Math.floor(Math.random() * 12) : 15 + Math.floor(Math.random() * 20); }

function resolveCombat() {
  aiMove = aiChoose();

  if (playerMove === aiMove) {
    combatMsg = `双方都用了${MOVES[playerMove]}，平手！`;
  } else if (BEATS[playerMove] === aiMove) {
    const dmg = calcDamage(playerMove, false);
    p2Hp -= dmg;
    combatMsg = `${MOVES[playerMove]} 克 ${MOVES[aiMove]}！造成 ${dmg} 伤害`;
    if (Math.random() < 0.15) combatMsg += ' 💥暴击！';
  } else {
    // AI might dodge
    if (Math.random() < DODGE_CHANCE && aiMove === 'paper') {
      combatMsg = `对手用${MOVES[aiMove]}闪避了你的攻击！`;
    } else {
      const dmg = calcDamage(aiMove, true);
      p1Hp -= dmg;
      combatMsg = `${MOVES[aiMove]} 克 ${MOVES[playerMove]}！受到 ${dmg} 伤害`;
      if (Math.random() < 0.15) combatMsg += ' 💢连击！';
    }
  }
  animFrame = 0;
  updateUI();
  draw();
  checkRound();
}

function checkRound() {
  if (p1Hp <= 0) {
    p1Hp = 0; gameActive = false;
    updateUI(); draw();
    overlayTitle.textContent = '💀 你输了';
    overlayMsg.textContent = `赢了${wins}回合，再接再厉！`;
    overlay.style.display = 'flex';
  } else if (p2Hp <= 0) {
    p2Hp = 0; wins++; round++; p1Hp = MAX_HP; p2Hp = MAX_HP;
    updateUI(); draw();
    if (wins >= 5) {
      gameActive = false;
      overlayTitle.textContent = '🏆 你赢了！';
      overlayMsg.textContent = `5胜达成！你是格斗之王！`;
      overlay.style.display = 'flex';
    } else {
      combatMsg = `🎉 第${round - 1}回合胜利！新回合开始`;
      playerMove = null; aiMove = null;
    }
  }
  if (gameActive && p1Hp > 0 && p2Hp > 0) {
    setTimeout(() => { playerMove = null; aiMove = null; combatMsg = '选择招式！'; draw(); }, 1200);
  }
}

function draw() {
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);

  // P1 (left)
  const p1x = W * 0.25, p1y = H * 0.6;
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(p1x - 20, p1y - 60, 40, 60);
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath(); ctx.arc(p1x, p1y - 70, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(p1x - 5, p1y - 74, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p1x + 5, p1y - 74, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('我方', p1x, p1y + 20);

  // P2 (right)
  const p2x = W * 0.75, p2y = H * 0.6;
  ctx.fillStyle = '#F44336';
  ctx.fillRect(p2x - 20, p2y - 60, 40, 60);
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath(); ctx.arc(p2x, p2y - 70, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(p2x - 5, p2y - 74, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p2x + 5, p2y - 74, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText('对手', p2x, p2y + 20);

  // Combat text
  if (playerMove) {
    ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(MOVES[playerMove], p1x, H * 0.2);
  }
  if (aiMove) {
    ctx.fillStyle = '#F44336'; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(MOVES[aiMove], p2x, H * 0.2);
  }

  // Message
  ctx.fillStyle = '#FFD54F'; ctx.font = 'bold 14px "PingFang SC",sans-serif';
  ctx.fillText(combatMsg || '', W / 2, H * 0.88);
}

document.querySelectorAll('.act-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!gameActive || playerMove) return;
    playerMove = btn.getAttribute('data-move');
    resolveCombat();
  });
});

document.addEventListener('keydown', e => {
  if (!gameActive || playerMove) return;
  const map = { '1': 'rock', '2': 'paper', '3': 'scissors', a: 'rock', s: 'paper', d: 'scissors' };
  if (map[e.key]) { playerMove = map[e.key]; e.preventDefault(); resolveCombat(); }
});

overlayBtn.addEventListener('click', init);
init();
