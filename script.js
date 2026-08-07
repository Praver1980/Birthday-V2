const opening = document.querySelector('#opening');
const enterButton = document.querySelector('#enterButton');
const confettiLayer = document.querySelector('#confettiLayer');
const launchButton = document.querySelector('#launchButton');
const cakeButton = document.querySelector('#cakeButton');
const cakeMessage = document.querySelector('#cakeMessage');
const wishDisplay = document.querySelector('#wishDisplay');
const glow = document.querySelector('#cursorGlow');
const colors = ['#ff6e92', '#ffd966', '#b6a1ea', '#a8e5d2', '#ff886d', '#fff'];
const birthdayDeck = document.querySelector('.birthday-deck');
const soundButton = document.querySelector('#soundButton');

function playBirthdayChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const now = context.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, now + index * .12);
    gain.gain.exponentialRampToValueAtTime(.09, now + index * .12 + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, now + index * .12 + .42);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + index * .12);
    oscillator.stop(now + index * .12 + .45);
  });
}

if (birthdayDeck) {
  birthdayDeck.addEventListener('click', (event) => {
    const button = event.target.closest('[data-deck-action]');
    if (!button) return;
    const action = button.dataset.deckAction;
    if (action === 'sparkle') {
      confetti(65);
      birthdayDeck.classList.add('is-excited');
      setTimeout(() => birthdayDeck.classList.remove('is-excited'), 700);
    }
    if (action === 'note') document.querySelector('#letter').scrollIntoView({ behavior: 'smooth' });
    if (action === 'sound') {
      playBirthdayChime();
      soundButton.setAttribute('aria-pressed', 'true');
      soundButton.classList.add('is-playing');
      setTimeout(() => { soundButton.setAttribute('aria-pressed', 'false'); soundButton.classList.remove('is-playing'); }, 1100);
    }
  });
}


let musicContext;
let musicTimer;
let musicPlaying = false;
const softMelody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];

function playSoftNote(frequency) {
  const now = musicContext.currentTime;
  const oscillator = musicContext.createOscillator();
  const gain = musicContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.035, now + .16);
  gain.gain.exponentialRampToValueAtTime(.0001, now + 1.45);
  oscillator.connect(gain).connect(musicContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 1.5);
}

async function toggleSoftMusic() {
  if (musicPlaying) {
    window.clearInterval(musicTimer);
    await musicContext.suspend();
    musicPlaying = false;
    return;
  }
  musicContext ||= new (window.AudioContext || window.webkitAudioContext)();
  await musicContext.resume();
  let noteIndex = 0;
  const playNext = () => { playSoftNote(softMelody[noteIndex]); noteIndex = (noteIndex + 1) % softMelody.length; };
  playNext();
  musicTimer = window.setInterval(playNext, 1500);
  musicPlaying = true;
}

enterButton?.addEventListener('click', (event) => {
  event.preventDefault();
  toggleSoftMusic().catch(() => {});
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  opening?.classList.add('hide');
  confetti(95);
});
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function confetti(amount = 80) {
  if (prefersReducedMotion.matches) amount = Math.min(amount, 10);
  for (let n = 0; n < amount; n++) {
    const bit = document.createElement('i');
    bit.className = 'confetti';
    bit.style.left = `${Math.random() * 100}vw`;
    bit.style.backgroundColor = colors[n % colors.length];
    bit.style.setProperty('--drift', `${(Math.random() - .5) * 230}px`);
    bit.style.animationDelay = `${Math.random() * .45}s`;
    bit.style.borderRadius = Math.random() > .58 ? '50%' : '1px';
    confettiLayer.append(bit);
    setTimeout(() => bit.remove(), 3900);
  }
}



launchButton.addEventListener('click', (event) => {
  event.preventDefault();
  confetti(115);
  launchButton.querySelector('b').textContent = '✦';
  launchButton.firstChild.textContent = 'The celebration has started ';
});

for (const gift of document.querySelectorAll('.present')) {
  gift.addEventListener('click', () => {
    if (gift.classList.contains('opened')) return;
    gift.classList.add('opened');
    gift.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.23) rotate(-8deg)' }, { transform: 'scale(.78)', opacity: .22 }], { duration: 460, fill: 'forwards', easing: 'ease-out' });
    wishDisplay.style.opacity = '0';
    setTimeout(() => { wishDisplay.textContent = gift.dataset.wish; wishDisplay.style.opacity = '1'; wishDisplay.animate([{ transform: 'scale(.85)' }, { transform: 'scale(1)' }], { duration: 280 }); }, 120);
    confetti(26);
  });
}

cakeButton.addEventListener('click', () => { confetti(150); cakeMessage.classList.add('show'); cakeButton.querySelector('.candle i').style.background = '#fff'; cakeButton.querySelector('.candle i').style.boxShadow = '0 0 50px 18px #fff4a9'; });

document.addEventListener('mousemove', (event) => { glow.style.opacity = '.8'; glow.style.left = `${event.clientX}px`; glow.style.top = `${event.clientY}px`; });

const observer = new IntersectionObserver((entries) => entries.forEach((entry, index) => { if (entry.isIntersecting) { entry.target.animate([{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, delay: index * 100, fill: 'forwards', easing: 'cubic-bezier(.2,.8,.2,1)' }); observer.unobserve(entry.target); } }), { threshold: .16 });
document.querySelectorAll('.letter-card,.reason-card,.present,.section-label').forEach((item) => observer.observe(item));
const capsuleButton = document.querySelector('#capsuleButton');
const secretNote = document.querySelector('#secretNote');
if (capsuleButton && secretNote) {
  capsuleButton.addEventListener('click', () => {
    secretNote.classList.toggle('show');
    const isOpen = secretNote.classList.contains('show');
    capsuleButton.firstChild.textContent = isOpen ? 'Keep this note close ' : 'Open the secret note ';
    capsuleButton.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) confetti(42);
  });
}

const starCard = document.querySelector('#starCard');
if (starCard) {
  starCard.addEventListener('click', () => {
    starCard.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.025) rotate(-1deg)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
    confetti(20);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

const storyPages = [...document.querySelectorAll('main > section:not(.marquee)')];
const dotNav = document.createElement('nav');
dotNav.className = 'story-dots';
dotNav.setAttribute('aria-label', 'Birthday story pages');
storyPages.forEach((page, index) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  const heading = page.querySelector('h1, h2');
  const pageName = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : `page ${index + 1}`;
  dot.setAttribute('aria-label', `Go to ${pageName}`);
  dot.title = pageName;
  const label = document.createElement('span');
  label.textContent = String(index + 1).padStart(2, '0');
  dot.append(label);
  dot.addEventListener('click', () => page.scrollIntoView({ behavior: 'smooth' }));
  dotNav.append(dot);
});
document.body.append(dotNav);
const storyDots = [...dotNav.querySelectorAll('button')];
const pageObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const index = storyPages.indexOf(entry.target);
      storyDots.forEach((dot, dotIndex) => dot.classList.toggle('active', index === dotIndex));
    }
  });
}, { threshold: .58 });
storyPages.forEach((page) => pageObserver.observe(page));

const photoCube = document.querySelector('#photoCube');
const cubeStage = document.querySelector('#cubeStage');
let cubeX = -18, cubeY = 28, cubePointerStart;
function renderCube() { if (photoCube) photoCube.style.transform = `rotateX(${cubeX}deg) rotateY(${cubeY}deg)`; }
function turnCube(amount) { cubeY += amount; renderCube(); }
if (photoCube && cubeStage) {
  document.querySelectorAll('.cube-face img').forEach((image) => image.addEventListener('error', () => image.closest('.cube-face').classList.add('is-placeholder')));
  document.querySelector('#cubeBack')?.addEventListener('click', () => turnCube(-90)); document.querySelector('#cubeNext')?.addEventListener('click', () => turnCube(90));
  cubeStage.addEventListener('pointerdown', (event) => { cubePointerStart = { x: event.clientX, y: event.clientY, cubeX, cubeY }; cubeStage.setPointerCapture(event.pointerId); cubeStage.classList.add('is-dragging'); });
  cubeStage.addEventListener('pointermove', (event) => { if (!cubePointerStart) return; cubeY = cubePointerStart.cubeY + (event.clientX - cubePointerStart.x) * .55; cubeX = Math.max(-55, Math.min(35, cubePointerStart.cubeX - (event.clientY - cubePointerStart.y) * .35)); renderCube(); });
  const endCubeDrag = () => { cubePointerStart = null; cubeStage.classList.remove('is-dragging'); }; cubeStage.addEventListener('pointerup', endCubeDrag); cubeStage.addEventListener('pointercancel', endCubeDrag);
  cubeStage.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') turnCube(-25); if (event.key === 'ArrowRight') turnCube(25); }); renderCube();
}
document.querySelector('#backArrow')?.addEventListener('click', () => { const current = storyPages.findIndex((page) => page.getBoundingClientRect().top > -window.innerHeight * .35); storyPages[Math.max(0, current - 1)].scrollIntoView({ behavior: 'smooth', block: 'start' }); });

const finale = document.querySelector('#finale');
const finaleButton = document.querySelector('#finaleButton');
let finaleLaunched = false;
function launchFinale(replay = false) {
  if (!finale) return;
  if (replay) {
    finale.classList.remove('is-launched');
    void finale.offsetWidth; // restart CSS fireworks and firecracker animations
    confetti(180);
  } else if (!finaleLaunched) {
    confetti(180);
    finaleLaunched = true;
  }
  finale.classList.add('is-launched');
}
finaleButton?.addEventListener('click', () => launchFinale(true));
if (finale) new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) launchFinale(); }), { threshold: .45 }).observe(finale);

// Keep the first screen visible for a complete birthday introduction.
window.addEventListener('load', () => {
  const pageLoader = document.querySelector('#pageLoader');
  window.setTimeout(() => pageLoader?.classList.add('is-hidden'), 1640);
});