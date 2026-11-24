/* File Reader — pembaca dokumen simpel, berjalan 100% di browser */

const $ = (s) => document.querySelector(s);
const dropzone = $('#dropzone');
const viewerWrap = $('#viewerWrap');
const viewer = $('#viewer');
const fileInfo = $('#fileInfo');
const backBtn = $('#backBtn');

// Riwayat untuk navigasi file di dalam ZIP/RAR
let history = [];

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

/* ---------- Jenis file ---------- */
const TYPES = {
  text: ['txt', 'md', 'json', 'xml', 'html', 'htm', 'css', 'js', 'ts', 'py', 'java', 'c', 'cpp', 'h',
         'php', 'sql', 'log', 'ini', 'cfg', 'yml', 'yaml', 'sh', 'bat', 'srt', 'tsv', 'rtf'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'avif'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
  video: ['mp4', 'webm', 'mov', 'mkv', 'ogv'],
  pdf: ['pdf'],
  word: ['docx'],
  excel: ['xlsx', 'xls', 'xlsm', 'ods'],
  csv: ['csv'],
  ppt: ['pptx'],
  zip: ['zip'],
  rar: ['rar'],
};

const ext = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');
const typeOf = (name) => {
  const e = ext(name);
  for (const [t, list] of Object.entries(TYPES)) if (list.includes(e)) return t;
  return 'unknown';
};
const fmtSize = (b) => {
  if (b == null) return '';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
  return `${b.toFixed(i ? 1 : 0)} ${u[i]}`;
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICONS = { text: '📄', image: '🖼️', audio: '🎵', video: '🎬', pdf: '📕', word: '📘', excel: '📗',
  csv: '📗', ppt: '📙', zip: '🗜️', rar: '🗜️', unknown: '📦' };

/* ---------- UI ---------- */
function showViewer(file) {
  dropzone.hidden = true;
  viewerWrap.hidden = false;
  const t = typeOf(file.name);
  fileInfo.innerHTML = `${ICONS[t]} ${esc(file.name)}<small>${fmtSize(file.size)}</small>`;
  backBtn.hidden = history.length === 0;
  viewer.innerHTML = '<div class="loading">Memuat…</div>';
  viewer.scrollTop = 0;
}
function showError(msg) {
  viewer.innerHTML = `<div class="error">${esc(msg)}</div>`;
}
function closeViewer() {
  history = [];
  viewer.innerHTML = '';
  viewerWrap.hidden = true;
  dropzone.hidden = false;
  $('#fileInput').value = '';
}

$('#fileInput').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (f) { history = []; openFile(f); }
});
$('#closeBtn').addEventListener('click', closeViewer);
backBtn.addEventListener('click', () => {
  const prev = history.pop();
  if (prev) openFile(prev, true);
});

['dragenter', 'dragover'].forEach((ev) => document.addEventListener(ev, (e) => {
  e.preventDefault(); dropzone.classList.add('drag');
}));
['dragleave', 'drop'].forEach((ev) => document.addEventListener(ev, (e) => {
  e.preventDefault(); dropzone.classList.remove('drag');
}));
document.addEventListener('drop', (e) => {
  const f = e.dataTransfer.files[0];
  if (f) { history = []; openFile(f); }
});

/* ---------- Router ---------- */
let currentFile = null;

async function openFile(file, fromBack = false) {
  currentFile = file;
  showViewer(file);
  const handlers = {
    text: renderText, image: renderImage, audio: renderMedia, video: renderMedia,
    pdf: renderPdf, word: renderWord, excel: renderExcel, csv: renderCsv,
    ppt: renderPpt, zip: renderZip, rar: renderRar, unknown: renderUnknown,
  };
  try {
    await handlers[typeOf(file.name)](file);
  } catch (err) {
    console.error(err);
    showError('Gagal membuka file: ' + (err.message || err));
  }
}

// Buka file dari dalam arsip, simpan arsip ke riwayat agar bisa "Kembali"
function openInner(innerFile) {
  history.push(currentFile);
  openFile(innerFile);
}

/* ---------- Renderer ---------- */
async function renderText(file) {
  let text = await file.text();
  if (ext(file.name) === 'json') {
    try { text = JSON.stringify(JSON.parse(text), null, 2); } catch (_) { /* biarkan apa adanya */ }
  }
  const pre = document.createElement('pre');
  pre.className = 'text';
  pre.textContent = text;
  viewer.replaceChildren(pre);
}

function renderImage(file) {
  const img = document.createElement('img');
  img.className = 'media';
  img.src = URL.createObjectURL(file);
  img.alt = file.name;
  viewer.replaceChildren(img);
}

function renderMedia(file) {
  const el = document.createElement(typeOf(file.name) === 'audio' ? 'audio' : 'video');
  el.className = 'media';
  el.controls = true;
  el.src = URL.createObjectURL(file);
  viewer.replaceChildren(el);
}

async function renderPdf(file) {
  if (!window.pdfjsLib) throw new Error('Library PDF belum termuat (cek koneksi internet).');
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  viewer.innerHTML = '';
  const width = Math.min(viewer.clientWidth - 32, 900);
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const ratio = window.devicePixelRatio || 1;
    const vp = page.getViewport({ scale: (width / base.width) * ratio });
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page';
    canvas.width = vp.width;
    canvas.height = vp.height;
    canvas.style.width = vp.width / ratio + 'px';
    viewer.appendChild(canvas);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  }
}

async function renderWord(file) {
  if (!window.mammoth) throw new Error('Library Word belum termuat (cek koneksi internet).');
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const div = document.createElement('div');
  div.className = 'doc';
  div.innerHTML = result.value || '<p><i>(Dokumen kosong)</i></p>';
  // Bersihkan elemen berbahaya
  div.querySelectorAll('script, iframe, object, embed').forEach((n) => n.remove());
  viewer.replaceChildren(div);
}

function renderWorkbook(wb) {
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  const show = (name, btn) => {
    tabs.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    sheet.innerHTML = XLSX.utils.sheet_to_html(wb.Sheets[name], { header: '', footer: '' });
  };
  wb.SheetNames.forEach((name, i) => {
    const b = document.createElement('button');
    b.textContent = name;
    b.onclick = () => show(name, b);
    tabs.appendChild(b);
    if (i === 0) setTimeout(() => show(name, b));
  });
  viewer.replaceChildren(...(wb.SheetNames.length > 1 ? [tabs, sheet] : [sheet]));
  if (wb.SheetNames.length === 1) setTimeout(() => {
    sheet.innerHTML = XLSX.utils.sheet_to_html(wb.Sheets[wb.SheetNames[0]], { header: '', footer: '' });
  });
}

async function renderExcel(file) {
  if (!window.XLSX) throw new Error('Library Excel belum termuat (cek koneksi internet).');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  renderWorkbook(wb);
}

async function renderCsv(file) {
  if (!window.XLSX) return renderText(file);
  const text = await file.text();
  const wb = XLSX.read(text, { type: 'string', raw: true });
  renderWorkbook(wb);
}

async function renderPpt(file) {
  if (!window.JSZip) throw new Error('Library ZIP belum termuat (cek koneksi internet).');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
  if (!slideNames.length) throw new Error('Tidak ada slide ditemukan.');

  const parser = new DOMParser();
  const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const out = [];

  for (let i = 0; i < slideNames.length; i++) {
    const path = slideNames[i];
    const xml = parser.parseFromString(await zip.file(path).async('string'), 'application/xml');
    const card = document.createElement('div');
    card.className = 'slide';
    card.innerHTML = `<div class="num">Slide ${i + 1} / ${slideNames.length}</div>`;

    // Teks per paragraf
    let first = true;
    for (const p of xml.getElementsByTagNameNS(A, 'p')) {
      const t = [...p.getElementsByTagNameNS(A, 't')].map((n) => n.textContent).join('');
      if (!t.trim()) continue;
      const el = document.createElement('p');
      el.textContent = t;
      if (first) { el.className = 'title'; first = false; }
      card.appendChild(el);
    }

    // Gambar dari relasi slide
    const relPath = path.replace('slides/', 'slides/_rels/') + '.rels';
    const relFile = zip.file(relPath);
    if (relFile) {
      const rels = parser.parseFromString(await relFile.async('string'), 'application/xml');
      for (const r of rels.getElementsByTagName('Relationship')) {
        if (!/\/image$/.test(r.getAttribute('Type'))) continue;
        const target = r.getAttribute('Target').replace(/^\.\.\//, 'ppt/');
        const imgFile = zip.file(target);
        if (!imgFile) continue;
        const blob = await imgFile.async('blob');
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        card.appendChild(img);
      }
    }
    if (card.children.length === 1) card.insertAdjacentHTML('beforeend', '<p><i>(Slide tanpa teks)</i></p>');
    out.push(card);
  }
  viewer.replaceChildren(...out);
}

function renderArchiveList(entries, onOpen) {
  const ul = document.createElement('ul');
  ul.className = 'archive-list';
  if (!entries.length) ul.innerHTML = '<li>(Arsip kosong)</li>';
  entries.sort((a, b) => a.name.localeCompare(b.name)).forEach((en) => {
    const li = document.createElement('li');
    const t = en.dir ? 'folder' : typeOf(en.name);
    li.className = en.dir ? 'dir' : 'file';
    li.innerHTML = `<span>${en.dir ? '📁' : ICONS[t]}</span>
      <span class="name">${esc(en.name)}</span>
      <span class="size">${en.dir ? '' : fmtSize(en.size)}</span>`;
    if (!en.dir) li.onclick = () => onOpen(en);
    ul.appendChild(li);
  });
  const head = document.createElement('p');
  head.innerHTML = `<b>${entries.filter((e) => !e.dir).length}</b> file — klik untuk membuka.`;
  viewer.replaceChildren(head, ul);
}

async function renderZip(file) {
  if (!window.JSZip) throw new Error('Library ZIP belum termuat (cek koneksi internet).');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(zip.files).map((f) => ({
    name: f.name, dir: f.dir, size: f._data && f._data.uncompressedSize, ref: f,
  }));
  renderArchiveList(entries, async (en) => {
    const data = await en.ref.async('uint8array');
    openInner(new File([data], en.name.split('/').pop()));
  });
}

let unrarModule = null;
let unrarWasm = null;
async function renderRar(file) {
  const base = 'https://cdn.jsdelivr.net/npm/node-unrar-js@2.0.2/esm/';
  if (!unrarModule) unrarModule = await import(base + 'index.esm.js/+esm');
  if (!unrarWasm) unrarWasm = await (await fetch(base + 'js/unrar.wasm')).arrayBuffer();

  const data = await file.arrayBuffer();
  const makeExtractor = (password) =>
    unrarModule.createExtractorFromData({ wasmBinary: unrarWasm, data, password });

  let password;
  let extractor = await makeExtractor();
  const list = extractor.getFileList();
  const headers = [...list.fileHeaders];
  if (list.arcHeader && list.arcHeader.flags && list.arcHeader.flags.headerEncrypted) {
    throw new Error('Arsip RAR terenkripsi tidak didukung.');
  }

  const entries = headers.map((h) => ({
    name: h.name, dir: h.flags.directory, size: h.unpSize, encrypted: h.flags.encrypted,
  }));
  renderArchiveList(entries, async (en) => {
    if (en.encrypted && !password) {
      password = prompt('File ini dilindungi kata sandi. Masukkan kata sandi:') || undefined;
    }
    extractor = await makeExtractor(password);
    const files = [...extractor.extract({ files: [en.name] }).files];
    if (!files.length || !files[0].extraction) return alert('Gagal mengekstrak file.');
    openInner(new File([files[0].extraction], en.name.split(/[\\/]/).pop()));
  });
}

async function renderUnknown(file) {
  const e = ext(file.name);
  const hints = {
    doc: 'Format Word lama (.doc) belum didukung. Simpan ulang sebagai .docx.',
    ppt: 'Format PowerPoint lama (.ppt) belum didukung. Simpan ulang sebagai .pptx.',
    '7z': 'Format 7z belum didukung. Gunakan ZIP atau RAR.',
  };
  if (hints[e]) return showError(hints[e]);

  // Coba tampilkan sebagai teks jika isinya terlihat seperti teks
  const buf = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  const binary = buf.some((b) => b === 0);
  if (!binary) return renderText(file);
  showError(`Format ".${e || '?'}" belum didukung.`);
}
