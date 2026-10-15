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

/* ===== Drag & drop + file state ===== */
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');

function clearPreviousResults() {
  document.getElementById('keywords').innerHTML = '';
  document.getElementById('fileName').textContent = '';
}

function updateFileUI() {
  const dropText = document.getElementById('dropText');
  const filePreview = document.getElementById('filePreview');
  const selectedFileName = document.getElementById('selectedFileName');
  if (fileInput.files && fileInput.files.length) {
    dropText.hidden = true;
    filePreview.hidden = false;
    selectedFileName.textContent = fileInput.files[0].name;
    dropArea.classList.add('has-file');
  } else {
    dropText.hidden = false;
    filePreview.hidden = true;
    selectedFileName.textContent = '';
    dropArea.classList.remove('has-file');
  }
}

dropArea.addEventListener('click', () => {
  fileInput.click();
});

dropArea.addEventListener('dragenter', e => {
  e.preventDefault();
  dropArea.classList.add('drag-active');
});

dropArea.addEventListener('dragover', e => {
  e.preventDefault();
  dropArea.classList.add('drag-active');
});

dropArea.addEventListener('dragleave', e => {
  if (!dropArea.contains(e.relatedTarget)) {
    dropArea.classList.remove('drag-active');
  }
});

dropArea.addEventListener('drop', e => {
  e.preventDefault();
  dropArea.classList.remove('drag-active');
  const files = e.dataTransfer.files;
  if (files && files.length) {
    const dt = new DataTransfer();
    for (let i = 0; i < files.length; i++) dt.items.add(files[i]);
    fileInput.files = dt.files;
    updateFileUI();
    clearPreviousResults();
  }
});

fileInput.addEventListener('change', () => {
  updateFileUI();
});

/* ===== Form submit ===== */
document.getElementById('uploadForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fileInput = document.getElementById('fileInput');
  if (!fileInput.files.length) return;
  clearPreviousResults();

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
        card.innerHTML = '<h3>' + escapeHtml(k.keyword) + '</h3><div class="score">Score: ' + (Math.round(parseFloat(k.score) * 1000) / 10) + '% *</div>';
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
