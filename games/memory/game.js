const EMOJIS = ['🍎','🍊','🍋','🍇','🍓','🌸','⭐','🌙'];
const grid = document.getElementById('cardGrid');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const restartBtn = document.getElementById('restartBtn');

let cards, flipped, moves, matched, lockBoard, timerSec, timerInterval;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function init() {
  clearInterval(timerInterval);
  const pairs = shuffle([...EMOJIS, ...EMOJIS]);
  cards = pairs.map((emoji, i) => ({ emoji, id: i, flipped: false, matched: false }));
  flipped = [];
  moves = 0;
  matched = 0;
  lockBoard = false;
  timerSec = 0;
  movesEl.textContent = '0';
  timerEl.textContent = '00:00';
  overlay.style.display = 'none';
  render();
}

function render() {
  grid.innerHTML = '';
  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card' + (card.flipped || card.matched ? ' flipped' : '') + (card.matched ? ' matched' : '');
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
  el.className = 'card' + (card.flipped || card.matched ? ' flipped' : '') + (card.matched ? ' matched' : '');
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
    if (matched === EMOJIS.length) win();
  } else {
    lockBoard = true;
    setTimeout(() => {
      cards[a].flipped = false;
      cards[b].flipped = false;
      updateCardDOM(a);
      updateCardDOM(b);
      flipped = [];
      lockBoard = false;
    }, 700);
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
  const m = String(Math.floor(timerSec / 60)).padStart(2, '0');
  const s = String(timerSec % 60).padStart(2, '0');
  overlayTitle.textContent = '🎉 恭喜通关！';
  overlayMsg.textContent = `用时 ${m}:${s} | 步数 ${moves}`;
  overlay.style.display = 'flex';
}

restartBtn.addEventListener('click', init);
init();
