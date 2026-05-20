const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 80;

// Trust proxy for rate limiting / logging behind nginx
app.set('trust proxy', 1);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (no maxAge so browser always revalidates via ETag)
const staticOpts = { etag: true, lastModified: true };
app.use('/public', express.static(path.join(__dirname, 'public'), staticOpts));
app.use('/games', express.static(path.join(__dirname, 'games'), staticOpts));

function loadGames() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'games.json'), 'utf-8'));
}

// Health check
app.get('/health', (req, res) => res.send('ok'));

app.get('/api/games', (req, res) => {
  res.json(loadGames());
});

app.get('/', (req, res) => {
  let games = loadGames();
  const { category, q } = req.query;

  if (category) {
    games = games.filter(g => g.category === category);
  }
  if (q) {
    const keyword = q.toLowerCase();
    games = games.filter(g =>
      g.title.toLowerCase().includes(keyword) ||
      g.titleEn.toLowerCase().includes(keyword)
    );
  }

  res.render('index', { games, query: req.query });
});

app.get('/game/:id', (req, res) => {
  const games = loadGames();
  const game = games.find(g => g.id === req.params.id);
  if (!game) {
    return res.status(404).render('404', { games });
  }

  const related = games
    .filter(g => g.id !== game.id && g.category === game.category)
    .slice(0, 4);

  res.render('game', { game, related });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 游戏大厅 running at http://0.0.0.0:${PORT}`);
});
