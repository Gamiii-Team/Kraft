/* ===== Theme toggle ===== */
const themeBtn = document.getElementById('themeToggle');
const body = document.body;

function applyTheme(mode) {
  body.setAttribute('data-theme', mode);
  themeBtn.textContent = mode === 'dark' ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem('theme', mode);
}

const saved = localStorage.getItem('theme');
if (saved) applyTheme(saved);
else applyTheme('dark');

themeBtn.addEventListener('click', () => {
  const current = body.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ===== Filter bubbles ===== */
const filterInput = document.getElementById('filterInput');
const bubblesContainer = document.getElementById('bubbles');
const hiddenInput = document.getElementById('unwantedWords');
let excluded = [];

function renderBubbles() {
  bubblesContainer.innerHTML = '';
  excluded.forEach(word => {
    const span = document.createElement('span');
    span.className = 'bubble';
    span.setAttribute('aria-label', 'Excluded keyword: ' + word);
    span.innerHTML = word + ' <button type="button" class="remove" aria-label="Remove ' + word + '" onclick="removeBubble(\'' + word.replace(/'/g,"\\'") + '\')">×</button>';
    bubblesContainer.appendChild(span);
  });
  hiddenInput.value = JSON.stringify(excluded);
}

function removeBubble(word) {
  excluded = excluded.filter(w => w !== word);
  renderBubbles();
}

filterInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = filterInput.value.trim().toLowerCase();
    if (val && !excluded.includes(val)) {
      excluded.push(val);
      renderBubbles();
    }
    filterInput.value = '';
  }
});

/* Make removeBubble global for inline onclick */
window.removeBubble = removeBubble;

/* ===== Form submit ===== */
document.getElementById('uploadForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fileInput = document.getElementById('fileInput');
  if (!fileInput.files.length) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('unwanted_words_json', JSON.stringify(excluded));

  const resultsPanel = document.querySelector('.results-panel');
  resultsPanel.hidden = false;
  document.getElementById('keywords').innerHTML = '<p style="color:var(--text-muted)">Processing…</p>';
  document.getElementById('fileName').textContent = '';

  try {
    const res = await fetch('http://localhost:8000/extract-keywords', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Server error: ' + res.status);
    const data = await res.json();

    document.getElementById('fileName').textContent = data.filename ? 'File: ' + data.filename : '';
    const grid = document.getElementById('keywords');
    grid.innerHTML = '';
    if (!data.keywords || data.keywords.length === 0) {
      grid.innerHTML = '<div class="keyword-card"><h3>No keywords found</h3><div class="score">—</div></div>';
    } else {
      data.keywords.forEach(k => {
        const card = document.createElement('div');
        card.className = 'keyword-card';
        card.innerHTML = '<h3>' + escapeHtml(k.keyword) + '</h3><div class="score">Score: ' + k.score + '</div>';
        grid.appendChild(card);
      });
    }
  } catch (err) {
    document.getElementById('keywords').innerHTML = '<div class="keyword-card"><h3>Error</h3><div class="score">' + escapeHtml(err.message) + '</div></div>';
  }
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
