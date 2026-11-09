/* ====== PENGATURAN GALERI ======
   Daftar foto galeri. Tambah/kurangi baris sesuai jumlah foto;
   titik navigasi dibuat otomatis. Letakkan file di assets/images/ */
const galleryImages = [
  { src: 'assets/images/galeri-1.webp', alt: 'Galeri Umbul Gemulo 1' },
  { src: 'assets/images/galeri-2.webp', alt: 'Galeri Umbul Gemulo 2' },
  { src: 'assets/images/galeri-3.webp', alt: 'Galeri Umbul Gemulo 3' },
  { src: 'assets/images/galeri-4.webp', alt: 'Galeri Umbul Gemulo 4' },
  { src: 'assets/images/galeri-5.webp', alt: 'Galeri Umbul Gemulo 5' },
  { src: 'assets/images/galeri-6.webp', alt: 'Galeri Umbul Gemulo 6' },
];

/* ====== Placeholder untuk gambar yang belum ada ====== */
function watchImg(img){
  const slot = img.closest('.img-slot');
  const mark = () => slot && slot.classList.add('missing');
  if (img.complete && img.naturalWidth === 0) mark();
  img.addEventListener('error', mark);
}

/* ====== Galeri slider ====== */
const track = document.getElementById('slider-track');
const dotsEl = document.getElementById('dots');
const prev = document.getElementById('prev');
const next = document.getElementById('next');
let index = 0;

galleryImages.forEach((g, gi) => {
  const slide = document.createElement('div');
  slide.className = 'slide img-slot';
  slide.dataset.name = g.src.split('/').pop();
  const img = document.createElement('img');
  img.src = g.src; img.alt = g.alt; img.loading = 'lazy';
  slide.appendChild(img);
  slide.tabIndex = 0;
  slide.setAttribute('role', 'button');
  slide.setAttribute('aria-label', 'Perbesar foto ' + (gi + 1));
  const open = () => { if (!slide.classList.contains('missing')) openLB(gi, slide); };
  slide.addEventListener('click', open);
  slide.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
  track.appendChild(slide);
});

const perView = () => window.innerWidth <= 720 ? 1 : window.innerWidth <= 1100 ? 2 : 3;
const maxIndex = () => Math.max(0, galleryImages.length - perView());

function renderDots(){
  dotsEl.innerHTML = '';
  for (let i = 0; i <= maxIndex(); i++){
    const d = document.createElement('button');
    d.className = 'dot';
    d.setAttribute('aria-label', 'Ke posisi ' + (i + 1));
    d.addEventListener('click', () => go(i));
    dotsEl.appendChild(d);
  }
}
function go(i){
  index = Math.min(Math.max(i, 0), maxIndex());
  const slide = track.children[0];
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  const step = slide.getBoundingClientRect().width + gap;
  track.style.transform = `translateX(${-index * step}px)`;
  [...dotsEl.children].forEach((d, k) => d.classList.toggle('active', k === index));
  prev.disabled = index === 0;
  next.disabled = index === maxIndex();
}
prev.addEventListener('click', () => go(index - 1));
next.addEventListener('click', () => go(index + 1));
window.addEventListener('resize', () => { renderDots(); go(index); });

/* ====== Navbar: latar saat scroll + penanda menu aktif ====== */
const topbar = document.getElementById('topbar');
const links = [...document.querySelectorAll('.nav-links a')];
const sections = links.map(a => document.querySelector(a.getAttribute('href')));
function onScroll(){
  topbar.classList.toggle('scrolled', window.scrollY > 40);
  const y = window.scrollY + window.innerHeight * 0.35;
  let cur = 0;
  sections.forEach((s, i) => { if (s && s.offsetTop <= y) cur = i; });
  links.forEach((a, i) => a.classList.toggle('active', i === cur));
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ====== Init ====== */
document.querySelectorAll('.img-slot img').forEach(watchImg);
renderDots(); go(0); onScroll();


/* ====== Viewer foto (lightbox) ====== */
const lb = document.getElementById('lightbox');
const lbStage = document.getElementById('lb-stage');
const lbImg = document.getElementById('lb-img');
const lbCount = document.getElementById('lb-count');
let lbIndex = 0, lbOpener = null, lbTimer = null, lbDownX = null, lbSwiped = false;

function lbShow(i, animate){
  lbIndex = (i + galleryImages.length) % galleryImages.length;
  lbStage.classList.remove('zoomed');
  lbImg.style.transformOrigin = 'center';
  const apply = () => {
    lbImg.src = galleryImages[lbIndex].src;
    lbImg.alt = galleryImages[lbIndex].alt;
    lbCount.textContent = (lbIndex + 1) + ' / ' + galleryImages.length;
    lbImg.classList.remove('swap');
  };
  if (animate){ lbImg.classList.add('swap'); setTimeout(apply, 180); } else apply();
}
function openLB(i, opener){
  clearTimeout(lbTimer);
  lbOpener = opener || null;
  lb.hidden = false;
  lbShow(i, false);
  requestAnimationFrame(() => lb.classList.add('open'));
  document.body.classList.add('lb-lock');
  document.getElementById('lb-close').focus();
}
function closeLB(){
  lb.classList.remove('open');
  document.body.classList.remove('lb-lock');
  lbTimer = setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, 300);
  if (lbOpener) lbOpener.focus();
}
const lbMove = d => lbShow(lbIndex + d, true);
document.getElementById('lb-close').addEventListener('click', closeLB);
document.getElementById('lb-prev').addEventListener('click', () => lbMove(-1));
document.getElementById('lb-next').addEventListener('click', () => lbMove(1));
lb.addEventListener('click', e => { if (e.target === lb || e.target === lbStage) closeLB(); });

/* klik foto = zoom in/out; saat zoom, geser kursor/jari untuk melihat bagian lain */
const setOrigin = e => {
  const r = lbImg.getBoundingClientRect();
  const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * 100;
  const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1) * 100;
  lbImg.style.transformOrigin = x + '% ' + y + '%';
};
lbImg.addEventListener('click', e => {
  if (lbSwiped){ lbSwiped = false; return; }
  const z = !lbStage.classList.contains('zoomed');
  if (z) setOrigin(e);
  lbStage.classList.toggle('zoomed', z);
});
lbStage.addEventListener('pointermove', e => { if (lbStage.classList.contains('zoomed')) setOrigin(e); });

/* geser kiri/kanan untuk ganti foto (HP) */
lbStage.addEventListener('pointerdown', e => { lbDownX = e.clientX; });
lbStage.addEventListener('pointerup', e => {
  if (lbDownX === null || lbStage.classList.contains('zoomed')){ lbDownX = null; return; }
  const dx = e.clientX - lbDownX; lbDownX = null;
  if (Math.abs(dx) > 50){ lbSwiped = true; lbMove(dx < 0 ? 1 : -1); }
});

document.addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLB();
  else if (e.key === 'ArrowLeft') lbMove(-1);
  else if (e.key === 'ArrowRight') lbMove(1);
  else if (e.key === 'Tab'){
    const f = [...lb.querySelectorAll('button')];
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
});

/* ====== Animasi muncul saat di-scroll ====== */
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  const targets = [...document.querySelectorAll('.tentang-text,.tentang-big,.tentang-small .img-slot,.info-text,.card,.maps-box,.galeri-head,.slider')];
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(el => {
    el.classList.add('reveal');
    el.style.setProperty('--d', ([...el.parentNode.children].indexOf(el) % 4) * 0.1 + 's');
    io.observe(el);
  });
}
