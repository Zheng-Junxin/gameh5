const EMOJI_POOL = [
  '🍎','🍊','🍋','🍇','🍓','🌸','⭐','🌙','🐶','🐱',
  '🐸','🦊','🐼','🐨','🐙','🦋','🌻','🍉','🍒','🥝',
  '🚀','🎸','⚽','🎨','🔔','💎','🌈','🦄','🐳','🍄',
  '🌮','🎭','🦀','🐝','🌵','🍕','🎵','📷','🪐','🎪'
];

const LEVELS = [
  { cols: 4, rows: 4, pairs: 8 },   // 1
  { cols: 4, rows: 4, pairs: 8 },   // 2
  { cols: 5, rows: 4, pairs: 10 },  // 3
  { cols: 5, rows: 4, pairs: 10 },  // 4
  { cols: 4, rows: 6, pairs: 12 },  // 5
  { cols: 6, rows: 4, pairs: 12 },  // 6
  { cols: 5, rows: 6, pairs: 15 },  // 7
  { cols: 5, rows: 6, pairs: 15 },  // 8
  { cols: 6, rows: 6, pairs: 18 },  // 9
  { cols: 6, rows: 6, pairs: 18 },  // 10
];

const grid = document.getElementById('cardGrid');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const levelNumEl = document.getElementById('levelNum');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const nextBtn = document.getElementById('nextBtn');
const retryBtn = document.getElementById('retryBtn');
const resetBtn = document.getElementById('resetBtn');
const levelButtons = document.getElementById('levelButtons');

let cards, flipped, moves, matched, lockBoard, timerSec, timerInterval;
let currentLevel = 0;
let completedLevels = new Set();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLevelEmojis(level) {
  const start = (level * 3) % (EMOJI_POOL.length - LEVELS[level].pairs + 1);
  return EMOJI_POOL.slice(start, start + LEVELS[level].pairs);
}

function buildLevelButtons() {
  levelButtons.innerHTML = '';
  LEVELS.forEach((l, i) => {
    const btn = document.createElement('button');
    btn.className = 'lvl-btn';
    btn.textContent = i + 1;
    if (i === currentLevel) btn.classList.add('active');
    if (completedLevels.has(i)) btn.classList.add('completed');
    btn.addEventListener('click', () => { currentLevel = i; init(); });
    levelButtons.appendChild(btn);
  });
}

function init() {
  clearInterval(timerInterval);
  const level = LEVELS[currentLevel];
  const emojis = getLevelEmojis(currentLevel);
  const pairs = shuffle([...emojis, ...emojis]);
  cards = pairs.map((emoji, i) => ({ emoji, id: i, flipped: false, matched: false }));
  flipped = [];
  moves = 0;
  matched = 0;
  lockBoard = false;
  timerSec = 0;
  movesEl.textContent = '0';
  timerEl.textContent = '00:00';
  levelNumEl.textContent = currentLevel + 1;
  overlay.style.display = 'none';

  grid.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;
  render();
  buildLevelButtons();
}

function render() {
  grid.innerHTML = '';
  cards.forEach(card => {
    const cardEl = document.createElement('div');
    const cls = ['card'];
    if (card.flipped || card.matched) cls.push('flipped');
    if (card.matched) cls.push('matched');
    cardEl.className = cls.join(' ');
    cardEl.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back">?</div>
        <div class="card-face card-front">${card.emoji}</div>
      </div>`;
    cardEl.addEventListener('click', () => flipCard(card.id));
    grid.appendChild(cardEl);
  });
}

function updateCardDOM(id) {
  const card = cards[id];
  const el = grid.children[id];
  if (!el) return;
  const cls = ['card'];
  if (card.flipped || card.matched) cls.push('flipped');
  if (card.matched) cls.push('matched');
  el.className = cls.join(' ');
}

function flipCard(id) {
  if (lockBoard) return;
  const card = cards[id];
  if (card.flipped || card.matched) return;
  if (flipped.length === 0 && moves === 0) startTimer();

  card.flipped = true;
  updateCardDOM(id);
  flipped.push(id);

  if (flipped.length === 2) {
    moves++;
    movesEl.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [a, b] = flipped;
  if (cards[a].emoji === cards[b].emoji) {
    cards[a].matched = true;
    cards[b].matched = true;
    updateCardDOM(a);
    updateCardDOM(b);
    matched++;
    flipped = [];
    if (matched === LEVELS[currentLevel].pairs) win();
  } else {
    lockBoard = true;
    setTimeout(() => {
      cards[a].flipped = false;
      cards[b].flipped = false;
      updateCardDOM(a);
      updateCardDOM(b);
      flipped = [];
      lockBoard = false;
    }, 650);
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

function win() {
  clearInterval(timerInterval);
  completedLevels.add(currentLevel);
  const m = String(Math.floor(timerSec / 60)).padStart(2, '0');
  const s = String(timerSec % 60).padStart(2, '0');
  overlayTitle.textContent = '🎉 恭喜通关！';
  overlayMsg.textContent = `第${currentLevel + 1}关 用时 ${m}:${s} | 步数 ${moves}`;
  try { localStorage.setItem('memoryProgress', JSON.stringify([...completedLevels])); } catch(e) {}
  if (currentLevel < LEVELS.length - 1) {
    nextBtn.style.display = 'inline-block';
  } else {
    nextBtn.style.display = 'none';
    overlayTitle.textContent = '🏆 全部通关！';
  }
  overlay.style.display = 'flex';
  buildLevelButtons();
}

nextBtn.addEventListener('click', () => {
  if (currentLevel < LEVELS.length - 1) {
    currentLevel++;
    init();
  }
});

retryBtn.addEventListener('click', init);
resetBtn.addEventListener('click', init);

// Load saved progress
try {
  const saved = JSON.parse(localStorage.getItem('memoryProgress') || '[]');
  completedLevels = new Set(saved);
} catch(e) {}

init();

