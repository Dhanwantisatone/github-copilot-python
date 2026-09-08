// client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let timerInterval = null;
let seconds = 0;

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) {
      timerDisplay.innerText = `Time: ${m}:${s}`;
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;

      // Calculate 3x3 block alternating parity
      const boxRow = Math.floor(i / 3);
      const boxCol = Math.floor(j / 3);
      const altClass = (boxRow + boxCol) % 2 === 1 ? ' box-alt' : '';
      input.className = 'sudoku-cell' + altClass;

      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        e.target.classList.remove('incorrect');
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  const diffSelect = document.getElementById('difficulty');
  const diff = diffSelect ? diffSelect.value : 'medium';
  const res = await fetch(`/new?difficulty=${diff}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  document.getElementById('message').innerText = '';
  startTimer();
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  let isComplete = true;

  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      if (!val) isComplete = false;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }

  const res = await fetch('/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board })
  });

  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }

  const incorrect = new Set(data.incorrect.map(x => x[0] * SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;

    // Reset base styling while keeping 3x3 block alternate class
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    const boxRow = Math.floor(r / 3);
    const boxCol = Math.floor(c / 3);
    const altClass = (boxRow + boxCol) % 2 === 1 ? ' box-alt' : '';

    inp.className = 'sudoku-cell' + altClass;
    if (incorrect.has(idx)) {
      inp.className += ' incorrect';
    }
  }

  if (incorrect.size === 0 && isComplete) {
    stopTimer();
    msg.style.color = '#028a0f';
    msg.innerText = `🎉 Congratulations! Solved in ${seconds}s!`;
    saveHighScore();
  } else if (incorrect.size === 0) {
    msg.style.color = '#028a0f';
    msg.innerText = 'So far so good! No mistakes found.';
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = `Some cells are incorrect (${incorrect.size} errors).`;
  }
}

async function getHint() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];

  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }

  const res = await fetch('/hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board })
  });

  const data = await res.json();
  if (data.row !== undefined && data.col !== undefined) {
    const idx = data.row * SIZE + data.col;
    const inp = inputs[idx];
    inp.value = data.value;
    inp.disabled = true;
    inp.className += ' prefilled hinted';
    checkSolution();
  }
}

// LocalStorage Leaderboard functions
function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;
  list.innerHTML = '';
  const scores = JSON.parse(localStorage.getItem('sudoku_top10') || '[]');
  scores.slice(0, 10).forEach(entry => {
    const li = document.createElement('li');
    li.innerText = `${entry.name} - ${entry.time}s (${entry.diff})`;
    list.appendChild(li);
  });
}

function saveHighScore() {
  const diffSelect = document.getElementById('difficulty');
  const diff = diffSelect ? diffSelect.value : 'medium';
  const name = prompt('Fastest solve! Enter your name for the leaderboard:', 'Player') || 'Player';
  const scores = JSON.parse(localStorage.getItem('sudoku_top10') || '[]');
  scores.push({ name, time: seconds, diff });
  scores.sort((a, b) => a.time - b.time);
  localStorage.setItem('sudoku_top10', JSON.stringify(scores.slice(0, 10)));
  renderLeaderboard();
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);

  const hintBtn = document.getElementById('hint-btn');
  if (hintBtn) hintBtn.addEventListener('click', getHint);

  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme');
      document.body.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    });
  }

  renderLeaderboard();
  newGame();
});