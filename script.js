/* ============================================================
   ผีในระบบ — script.js
   เครื่องยนต์เรื่องเล่าแบบแยกสาขา + ระบบเมนูหลัก
   (DIALOGUE_NODES อยู่ใน story.js)
   ============================================================ */

'use strict';

// ────────────────────────────────────────────────────────────────
// DOM REFS
// ────────────────────────────────────────────────────────────────
const els = {
  // Main menu
  mainMenu:         document.getElementById('main-menu'),
  btnNewGame:       document.getElementById('btn-new-game'),
  btnLoadGame:      document.getElementById('btn-load-game'),
  // Game container
  gameContainer:    document.getElementById('game-container'),
  // Dialogue
  dialogueText:     document.getElementById('dialogue-text'),
  speakerName:      document.getElementById('speaker-name'),
  btnNext:          document.getElementById('btn-next'),
  choiceArea:       document.getElementById('choice-area'),
  characterImage:   document.getElementById('character-image'),
  characterWrapper: document.getElementById('character-wrapper'),
  locationText:     document.getElementById('location-text'),
  // Evidence modal
  btnEvidence:       document.getElementById('btn-evidence'),
  evidenceModal:     document.getElementById('evidence-modal'),
  closeEvidence:     document.getElementById('close-evidence'),
  evidenceList:      document.getElementById('evidence-list'),
  presentEvidenceBtn: document.getElementById('present-evidence-btn'),
  // Audit quiz modal
  btnAudit:         document.getElementById('btn-audit'),
  auditModal:       document.getElementById('audit-modal'),
  closeAudit:       document.getElementById('close-audit'),
  // Save / Load (HUD buttons)
  btnSave:          document.getElementById('btn-save'),
  btnLoad:          document.getElementById('btn-load'),
  // Mute
  btnMute:          document.getElementById('btn-mute'),
  // Ethics meter
  ethicsFill:       null,
  ethicsValue:      null,
  // Timer Minigame (removed)
  // Log minigame
  logMinigameModal: document.getElementById('log-minigame-modal'),
  closeLogMinigame: document.getElementById('close-log-minigame'),
  logTableRows:     document.querySelectorAll('#log-table tbody tr'),
  btnConfirmLog:    document.getElementById('btn-confirm-log'),
  // Email minigame
  emailModal:       document.getElementById('email-modal'),
  closeEmailMinigame: document.getElementById('close-email-minigame'),
  emailItems:       document.querySelectorAll('.email-item'),
  // Final score
  submitAuditBtn:   document.getElementById('submit-audit-btn'),
  finalScoreScreen: document.getElementById('final-score-screen'),
  scoreDetails:     document.getElementById('score-details'),
  restartBtn:       document.getElementById('restart-btn'),
};

// ────────────────────────────────────────────────────────────────
// STATE — แหล่งข้อมูลความจริงเดียว
// ────────────────────────────────────────────────────────────────
const DEFAULT_STATE = () => ({
  currentScene:      'start',
  ethicsMeter:       50,
  collectedEvidence: [],
  flags:             {},
  auditLog:          [],
  evidenceItems:     [],
  currentBgm:        null,
  isMuted:           false,
  currentCharacterKey:   'system',
  currentCharacterImage: null,
});

let state = DEFAULT_STATE();

// ────────────────────────────────────────────────────────────────
// MAIN MENU
// ────────────────────────────────────────────────────────────────
function showMainMenu() {
  els.mainMenu.style.display      = 'flex';
  els.gameContainer.style.display = 'none';
  syncMenuControls();
}

function hideMainMenu() {
  els.mainMenu.style.display      = 'none';
  els.gameContainer.style.display = 'flex';
}

function startNewGame() {
  // Reset to a clean slate
  state = DEFAULT_STATE();
  injectEthicsMeter();
  updateMuteBtn();
  els.btnAudit.style.display = 'none';
  renderEvidence();
  addAuditEntry('เริ่มเกมใหม่ — คดีตรวจสอบภายใน', 'ok');
  hideMainMenu();
  goTo('start');
}

function loadGame() {
  try {
    const raw = localStorage.getItem('ghost_save');
    if (!raw) return false;
    const save = JSON.parse(raw);

    // Restore saved scalar fields
    state.currentScene      = save.currentScene      ?? 'start';
    state.ethicsMeter       = save.ethicsMeter       ?? 50;
    state.collectedEvidence = save.collectedEvidence ?? [];
    state.flags             = save.flags             ?? {};

    // Re-hydrate evidenceItems from IDs in story data
    // (evidenceItems are rebuilt on-demand when evidence is re-collected)
    // For a proper load we just clear auditLog and note the load event
    state.auditLog     = [];
    state.evidenceItems = [];

    injectEthicsMeter();
    updateMuteBtn();
    addAuditEntry(`เกมโหลด — ฉาก: ${state.currentScene}`, 'ok');
    goTo(state.currentScene);
    return true;
  } catch (e) {
    console.warn('โหลดเกมล้มเหลว:', e);
    return false;
  }
}

// ── Menu particles ─────────────────────────────────────────
function spawnMenuParticles() {
  const container = document.getElementById('menu-particles');
  if (!container) return;
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'menu-particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${80 + Math.random() * 20}%;
      width: ${1 + Math.random() * 2.5}px;
      height: ${1 + Math.random() * 2.5}px;
      opacity: 0;
      animation-duration: ${6 + Math.random() * 12}s;
      animation-delay: ${Math.random() * 8}s;
    `;
    container.appendChild(p);
  }
}
spawnMenuParticles();

// ── Menu volume controls ────────────────────────────────────
const menuVolSlider = document.getElementById('menu-volume');
const menuMuteToggle = document.getElementById('menu-mute-toggle');
const volValue = document.getElementById('vol-value');
const volIcon = document.getElementById('vol-icon');

function updateVolIcon(vol, muted) {
  if (!volIcon) return;
  if (muted || vol == 0) volIcon.textContent = '🔇';
  else if (vol < 40) volIcon.textContent = '🔈';
  else if (vol < 70) volIcon.textContent = '🔉';
  else volIcon.textContent = '🔊';
}

function applyVolume() {
  if (!menuVolSlider) return;
  const vol = parseInt(menuVolSlider.value);
  const muted = menuMuteToggle?.checked ?? false;
  masterVolume = vol / 100;
  state.isMuted = muted;
  bgmPlayer.muted = muted;
  applyBgmVolume();
  if (volValue) volValue.textContent = vol;
  menuVolSlider.style.setProperty('--vol-pct', vol + '%');
  updateVolIcon(vol, muted);
  updateMuteBtn();
}

if (menuVolSlider) {
  menuVolSlider.addEventListener('input', applyVolume);
}
if (menuMuteToggle) {
  menuMuteToggle.addEventListener('change', applyVolume);
}
if (volIcon) {
  volIcon.addEventListener('click', () => {
    if (menuMuteToggle) {
      menuMuteToggle.checked = !menuMuteToggle.checked;
      applyVolume();
    }
  });
}

// Sync HUD mute button → menu toggle when returning to menu
function syncMenuControls() {
  if (menuVolSlider) {
    const vol = Math.round(masterVolume * 100);
    menuVolSlider.value = vol;
    if (volValue) volValue.textContent = vol;
    menuVolSlider.style.setProperty('--vol-pct', vol + '%');
  }
  if (menuMuteToggle) menuMuteToggle.checked = state.isMuted;
  updateVolIcon(Math.round(masterVolume * 100), state.isMuted);
}

// Start menu BGM on first user interaction (autoplay policy workaround)
let menuBgmStarted = false;
function tryStartMenuBgm() {
  if (menuBgmStarted) return;
  menuBgmStarted = true;
  initAudioGraph();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  setBgm(BGM_MAIN, 'menu');
}
document.addEventListener('click', tryStartMenuBgm, { once: false });
document.addEventListener('keydown', tryStartMenuBgm, { once: false });

els.btnNewGame.addEventListener('click', startNewGame);

els.btnLoadGame.addEventListener('click', () => {
  const ok = loadGame();
  if (ok) {
    hideMainMenu();
  } else {
    alert('ไม่พบข้อมูลเซฟเกม');
  }
});

// ────────────────────────────────────────────────────────────────
// มาตรความซื่อสัตย์
// ────────────────────────────────────────────────────────────────
function injectEthicsMeter() {
  els.ethicsFill  = document.getElementById('ethics-fill');
  els.ethicsValue = document.getElementById('ethics-value');
  updateEthicsMeter();
}

function updateEthicsMeter() {
  if (!els.ethicsFill) return;
  const pct = state.ethicsMeter;
  els.ethicsFill.style.width  = `${pct}%`;
  els.ethicsValue.textContent = pct;
  els.ethicsFill.className    = pct >= 65 ? 'ethics-high'
                              : pct >= 40 ? 'ethics-mid'
                              :             'ethics-low';
}

function adjustEthics(delta) {
  const prev = state.ethicsMeter;
  state.ethicsMeter = Math.max(0, Math.min(100, state.ethicsMeter + delta));
  updateEthicsMeter();
  const sign = delta >= 0 ? '+' : '';
  addAuditEntry(
    `ความซื่อสัตย์: ${sign}${delta}  (${prev} → ${state.ethicsMeter})`,
    delta >= 0 ? 'ok' : 'danger'
  );
}

// ────────────────────────────────────────────────────────────────
// บันทึกการตรวจสอบ
// ────────────────────────────────────────────────────────────────
function addAuditEntry(event, flag = 'ok') {
  const now = new Date();
  const ts  = now.toLocaleTimeString('th-TH', { hour12: false })
            + '.' + String(now.getMilliseconds()).padStart(3, '0');
  state.auditLog.push({ ts, event, flag });
}

// ────────────────────────────────────────────────────────────────
// หลักฐาน
// ────────────────────────────────────────────────────────────────
// Evidence Presentation state
let isPresentingMode  = false;
let expectedEvidence  = '';
let successSceneId    = '';
let failSceneId_ev    = '';
let selectedEvidenceItem = null;

function collectEvidence(item) {
  if (state.collectedEvidence.includes(item.id)) return;
  state.collectedEvidence.push(item.id);
  state.evidenceItems.push(item);
  addAuditEntry(`หลักฐาน: "${item.title}"`, item.flagged ? 'danger' : 'ok');
  renderEvidence();
  flashHudBtn(els.btnEvidence);
  showToast(item);
}

function renderEvidence() {
  selectedEvidenceItem = null;
  if (els.presentEvidenceBtn) {
    els.presentEvidenceBtn.disabled = true;
  }
  if (!state.collectedEvidence.length) {
    els.evidenceList.innerHTML = '<p class="empty-state">ยังไม่มีหลักฐาน</p>';
    return;
  }
  const lookup = new Map(state.evidenceItems.map(e => [e.id, e]));
  els.evidenceList.innerHTML = '';
  state.collectedEvidence.forEach(id => {
    const ev = lookup.get(id);
    if (!ev) return;
    const card = document.createElement('div');
    card.className = `evidence-item ${ev.flagged ? 'flagged' : ''}`;
    card.dataset.evidenceTitle = ev.title;
    card.innerHTML = `
      <div class="ev-tag">${ev.tag || 'รายการ'}</div>
      <div class="ev-title">${ev.title}</div>
      <div class="ev-desc">${ev.description}</div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('#evidence-list .evidence-item').forEach(c => c.classList.remove('selected-evidence'));
      card.classList.add('selected-evidence');
      selectedEvidenceItem = ev.title;
      if (els.presentEvidenceBtn && isPresentingMode) {
        els.presentEvidenceBtn.disabled = false;
      }
    });
    els.evidenceList.appendChild(card);
  });
}

// ────────────────────────────────────────────────────────────────
// ตัวช่วยฉาก / ตัวละคร
// ────────────────────────────────────────────────────────────────
function applyCharacterVisuals() {
  if (state.currentCharacterImage) {
    els.characterImage.src = state.currentCharacterImage;
    els.characterImage.style.display = 'block';
  } else {
    els.characterImage.src = '';
    els.characterImage.style.display = 'none';
  }
}

function setCharacter(key) {
  const k = (key || 'system').toLowerCase();
  state.currentCharacterKey = k;
  els.speakerName.className  = `speaker-${k}`;
  applyCharacterVisuals();
  triggerGlitch(160);
}

function setCharacterSprite(imagePath) {
  const next = imagePath || null;
  if (next === state.currentCharacterImage) return;
  els.characterWrapper.classList.add('sprite-out');
  setTimeout(() => {
    state.currentCharacterImage = next;
    applyCharacterVisuals();
    els.characterWrapper.classList.remove('sprite-out');
    if (next) setCharacterAnimation('enter');
  }, 160);
}

const ANIM_CLASSES = ['anim-enter', 'anim-shake', 'anim-slump', 'anim-sway', 'anim-bounce'];
function setCharacterAnimation(name) {
  els.characterWrapper.classList.remove(...ANIM_CLASSES);
  if (!name) return;
  void els.characterWrapper.offsetWidth; // restart animation
  els.characterWrapper.classList.add(`anim-${name}`);
}

function triggerGlitch(ms = 300) {
  els.characterWrapper.classList.add('glitch');
  setTimeout(() => els.characterWrapper.classList.remove('glitch'), ms);
}

function setSpeaker(name)  { els.speakerName.textContent  = name; }
function setLocation(text) { els.locationText.textContent = text; }

function flashHudBtn(btn) {
  btn.style.color = 'var(--ok)';
  btn.style.borderColor = 'var(--ok)';
  setTimeout(() => { btn.style.color = ''; btn.style.borderColor = ''; }, 1200);
}

// ────────────────────────────────────────────────────────────────
// ระบบเสียง — BGM with Mood Engine (Web Audio filter + rate + volume)
// ────────────────────────────────────────────────────────────────
const BGM_MAIN = 'assets/audio/The_Final_Ledger_Entry_90sec.mp3';

const bgmPlayer  = new Audio();
bgmPlayer.loop   = true;

// Web Audio graph (lazy-init on first gesture)
let audioCtx    = null;
let bgmSource   = null;
let bgmLowpass  = null;

function initAudioGraph() {
  if (audioCtx) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx   = new Ctx();
    bgmSource  = audioCtx.createMediaElementSource(bgmPlayer);
    bgmLowpass = audioCtx.createBiquadFilter();
    bgmLowpass.type = 'lowpass';
    bgmLowpass.frequency.value = 20000; // start wide open
    bgmLowpass.Q.value = 0.7;
    bgmSource.connect(bgmLowpass);
    bgmLowpass.connect(audioCtx.destination);
  } catch (e) {
    console.warn('Web Audio init failed; volume-only fallback:', e);
  }
}

// Mood presets — vol × lowpass × playbackRate
// lp (Hz): ต่ำ = หม่น/อู้อี้ (เหมือนฟังผ่านกำแพง) · สูง = ใส/เต็ม
// rate: ต่ำ = หม่น/ยืด · สูง = กระชับ/ตื่นตัว
const BGM_MOODS = {
  menu:          { vol: 0.55, lp: 6000,  rate: 1.00 }, // เมนู — atmospheric
  intro:         { vol: 0.55, lp: 3200,  rate: 1.00 }, // เริ่มคดี — ลึกลับ
  investigation: { vol: 0.45, lp: 2400,  rate: 0.96 }, // วิเคราะห์ log — ช้าและ focus
  discovery:     { vol: 0.70, lp: 5200,  rate: 1.02 }, // พบเบาะแส — เปิดใส ตื่นเต้น
  sneak:         { vol: 0.48, lp: 1800,  rate: 0.97 }, // แอบส่องอีเมล — อู้อี้ ระมัดระวัง
  confront:      { vol: 0.78, lp: 8500,  rate: 1.03 }, // กำลังเดินไปเผชิญหน้า
  tension:       { vol: 0.88, lp: 12000, rate: 1.04 }, // เผชิญหน้า — ตึงเครียด
  climax:        { vol: 1.00, lp: 20000, rate: 1.07 }, // ยื่นหลักฐาน — peak
  resolution:    { vol: 0.50, lp: 1800,  rate: 0.92 }, // สารภาพ — หม่น เศร้า
  reflection:    { vol: 0.40, lp: 1400,  rate: 0.90 }, // ethics dilemma — เงียบ คิด
  victory:       { vol: 0.48, lp: 4800,  rate: 1.00 }, // good ending — สงบ สบาย
  defeat:        { vol: 0.30, lp: 800,   rate: 0.85 }, // bad ending — พังทลาย
};

let masterVolume    = 0.55;
let sceneMultiplier = 1.0;
let currentMood     = null;

function applyBgmVolume() {
  bgmPlayer.volume = state.isMuted ? 0 : masterVolume * sceneMultiplier;
}

function applyMood(moodName, durationMs = 1400) {
  const mood = BGM_MOODS[moodName];
  if (!mood) return;
  currentMood = moodName;

  // Playback rate (smooth ramp via setInterval — HTMLMediaElement doesn't have AudioParam)
  const startRate = bgmPlayer.playbackRate || 1;
  const steps  = 24;
  const stepMs = durationMs / steps;
  let i = 0;
  const rateTick = setInterval(() => {
    i++;
    bgmPlayer.playbackRate = startRate + (mood.rate - startRate) * (i / steps);
    if (i >= steps) {
      bgmPlayer.playbackRate = mood.rate;
      clearInterval(rateTick);
    }
  }, stepMs);

  // Low-pass filter (Web Audio)
  if (bgmLowpass && audioCtx) {
    const now = audioCtx.currentTime;
    bgmLowpass.frequency.cancelScheduledValues(now);
    bgmLowpass.frequency.setValueAtTime(bgmLowpass.frequency.value, now);
    bgmLowpass.frequency.linearRampToValueAtTime(mood.lp, now + durationMs / 1000);
  }

  // Volume
  crossfadeToVolume(mood.vol);
}

function setBgm(path, mood = 'menu') {
  const m = BGM_MOODS[mood] || BGM_MOODS.menu;
  sceneMultiplier = m.vol;
  if (!path) {
    fadeOutBgm();
    return;
  }
  if (path !== state.currentBgm) {
    state.currentBgm = path;
    bgmPlayer.src    = path;
    bgmPlayer.load();
  }
  bgmPlayer.playbackRate = m.rate;
  if (bgmLowpass) bgmLowpass.frequency.value = m.lp;
  currentMood = mood;
  applyBgmVolume();
  const pp = bgmPlayer.play();
  if (pp) pp.catch(() => {});
}

function fadeOutBgm() {
  const startVol = bgmPlayer.volume;
  let step = 0;
  const tick = setInterval(() => {
    step += 0.08;
    bgmPlayer.volume = Math.max(0, startVol * (1 - step));
    if (step >= 1) {
      clearInterval(tick);
      bgmPlayer.pause();
      bgmPlayer.src    = '';
      state.currentBgm = null;
    }
  }, 60);
}

function crossfadeToVolume(targetMultiplier) {
  const start = sceneMultiplier;
  const delta = targetMultiplier - start;
  const steps = 24;
  let i = 0;
  const tick = setInterval(() => {
    i++;
    sceneMultiplier = start + (delta * i / steps);
    applyBgmVolume();
    if (i >= steps) {
      sceneMultiplier = targetMultiplier;
      applyBgmVolume();
      clearInterval(tick);
    }
  }, 40);
}

function toggleMute() {
  state.isMuted   = !state.isMuted;
  bgmPlayer.muted = state.isMuted;
  updateMuteBtn();
}

function updateMuteBtn() {
  const btn  = els.btnMute;
  const icon = document.getElementById('mute-icon');
  if (!btn) return;
  btn.classList.toggle('muted', state.isMuted);
  btn.setAttribute('aria-pressed', String(state.isMuted));
  btn.title = state.isMuted ? 'เปิดเสียง' : 'ปิดเสียง';
  if (icon) icon.innerHTML = state.isMuted ? '&times;' : '&#9835;';
  if (!state.isMuted && state.currentBgm && bgmPlayer.paused) {
    bgmPlayer.play().catch(() => {});
  }
}

// ────────────────────────────────────────────────────────────────
// ป๊อปอัปแจ้งเตือน — เมื่อเก็บหลักฐาน
// ────────────────────────────────────────────────────────────────
let _toastTimer = null;

function showToast(item) {
  const toast   = document.getElementById('toast');
  const titleEl = document.getElementById('toast-title');
  if (!toast || !titleEl) return;
  clearTimeout(_toastTimer);

  toast.style.borderLeftColor = item.flagged ? 'var(--danger)' : 'var(--ok)';
  document.getElementById('toast-icon').style.color  = item.flagged ? 'var(--danger)' : 'var(--ok)';
  document.getElementById('toast-label').style.color = item.flagged ? 'var(--danger)' : 'var(--ok)';
  titleEl.textContent = item.title;

  toast.classList.remove('toast-show', 'toast-hide');
  void toast.offsetWidth;
  toast.classList.add('toast-show');
  _toastTimer = setTimeout(dismissToast, 3800);
}

function dismissToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.classList.add('toast-hide');
  toast.addEventListener('transitionend', () => {
    toast.classList.remove('toast-show', 'toast-hide');
  }, { once: true });
}

// ────────────────────────────────────────────────────────────────
// เครื่องพิมพ์ดีด & Fast Forward
// ────────────────────────────────────────────────────────────────
let isFastForward = false;
let typingInterval;
let isTyping = false;
let skipTypewriterFn = null;

const btnFastForward = document.getElementById('fast-forward-btn');
if (btnFastForward) {
  btnFastForward.addEventListener('click', () => {
    isFastForward = !isFastForward;
    if (isFastForward) {
      btnFastForward.classList.add('active-ff');
    } else {
      btnFastForward.classList.remove('active-ff');
    }
  });
}

function typeText(text, onDone) {
  clearInterval(typingInterval);
  els.dialogueText.innerHTML = '';
  els.dialogueText.classList.add('typing');

  const finish = () => {
    isTyping = false;
    els.dialogueText.classList.remove('typing');
    if (typeof onDone === 'function') onDone();
  };

  if (isFastForward) {
    els.dialogueText.innerHTML = text;
    finish();
    skipTypewriterFn = null;
  } else {
    isTyping = true;
    let i = 0;
    const SPEED = 26;

    skipTypewriterFn = () => {
      clearInterval(typingInterval);
      els.dialogueText.innerHTML = text;
      finish();
      skipTypewriterFn = null;
    };

    typingInterval = setInterval(() => {
      if (i < text.length) {
        els.dialogueText.innerHTML += text[i++];
      } else {
        clearInterval(typingInterval);
        finish();
        skipTypewriterFn = null;
      }
    }, SPEED);
  }
}

// ────────────────────────────────────────────────────────────────
// แสดงโหนด — ฟังก์ชันแสดงผลหลัก
// ────────────────────────────────────────────────────────────────
function renderScene(sceneId) {
  console.log("Rendering scene:", sceneId);

  if (typeof storyData === 'undefined') {
    console.error("storyData is not defined!");
    return;
  }

  if (!storyData[sceneId]) {
    console.error(`Scene '${sceneId}' is undefined! Falling back to 'start'.`);
    sceneId = 'start';
  }

  const sceneData = storyData[sceneId];
  if (!sceneData) return;

  hideMainMenu();
  state.currentScene = sceneId;

  const dialogueTextEl = document.getElementById('dialogue-text');
  const choicesContainerEl = document.getElementById('choices-container');
  const choiceAreaEl = document.getElementById('choice-area');
  
  if (dialogueTextEl) dialogueTextEl.innerHTML = '';
  if (choicesContainerEl) choicesContainerEl.innerHTML = '';
  if (choiceAreaEl) choiceAreaEl.innerHTML = '';

  if (dialogueTextEl) {
    clearInterval(typingInterval);
    dialogueTextEl.classList.remove('typing');
    dialogueTextEl.innerText = sceneData.text;
  }

  const gameContainerEl = document.getElementById('game-container');
  if (gameContainerEl) {
    if (sceneData.backgroundImage) {
      gameContainerEl.style.backgroundImage = `url('${sceneData.backgroundImage}')`;
      gameContainerEl.style.backgroundColor = "transparent";
    } else {
      gameContainerEl.style.backgroundImage = "none";
      gameContainerEl.style.backgroundColor = "#1e293b";
    }
  }

  if (sceneData.location) setLocation(sceneData.location);
  if (sceneData.character) setCharacter(sceneData.character);
  setSpeaker(sceneData.speaker || sceneData.character || 'ระบบ');

  if ('bgm' in sceneData) {
    setBgm(sceneData.bgm, sceneData.bgmMood || 'menu');
  } else if (sceneData.bgmMood) {
    applyMood(sceneData.bgmMood);
  } else if (sceneData.bgmVolume !== undefined) {
    crossfadeToVolume(sceneData.bgmVolume);
  }
  if ('characterImage' in sceneData) setCharacterSprite(sceneData.characterImage);
  if ('animation' in sceneData) {
    setTimeout(() => setCharacterAnimation(sceneData.animation), 180);
  }

  if (typeof sceneData.onEnter === 'function') sceneData.onEnter(state);

  addAuditEntry(`[${sceneId}] ${sceneData.speaker}: "${sceneData.text.slice(0, 50)}…"`);

  if (sceneData.choices && sceneData.choices.length) {
    renderChoices(sceneData.choices);
  } else {
    els.btnNext.disabled = false;
  }
}

function renderChoices(choices) {
  els.choiceArea.innerHTML = '';
  els.btnNext.disabled = true;

  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className   = 'choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      els.choiceArea.innerHTML = '';
      addAuditEntry(`ทางเลือก: "${choice.text}"`, 'warn');
      if (choice.action === 'openAuditReport') {
        openAuditModal();
        return;
      }
      if (choice.action === 'openLogMinigame') {
        openLogMinigame();
        return;
      }
      if (choice.action === 'openEmailMiniGame') {
        openEmailMiniGame();
        return;
      }
      if (choice.action === 'presentEvidence') {
        const node = DIALOGUE_NODES[state.currentScene];
        isPresentingMode  = true;
        expectedEvidence  = node.requiredEvidence || '';
        successSceneId    = node.successScene    || '';
        failSceneId_ev    = node.failScene       || '';
        renderEvidence(); // rebuild cards with click listeners
        els.evidenceModal.classList.remove('hidden');
        if (els.presentEvidenceBtn) {
          els.presentEvidenceBtn.classList.remove('hidden');
          els.presentEvidenceBtn.disabled = true;
        }
        return;
      }
      if (choice.action === 'accusePerson') {
        adjustEthics(-30);
        showGameAlert(
          'ผิดหลักจรรยาบรรณวิชาชีพ!',
          'หักคะแนนจริยธรรม! หน้าที่ของ IT Auditor คือการนำเสนอ "ข้อเท็จจริง (Facts)" ไม่ใช่การทำหน้าที่ศาลชี้ตัวคนผิด\n\nการกล่าวหาโดยตรงอาจนำไปสู่การฟ้องร้องได้ ควรปล่อยให้เป็นหน้าที่ของฝ่ายกฎหมายและ HR',
          () => { goTo('report_submitted'); }
        );
        return;
      }
      if (choice.action === 'reportFacts') {
        adjustEthics(+10);
        showGameAlert(
          'ยอดเยี่ยมมาก!',
          'การรายงานข้อเท็จจริงอย่างเป็นกลางคือหัวใจสำคัญของ Auditor!\n\nคุณได้ส่งมอบหลักฐานให้ผู้บริหารดำเนินการต่ออย่างถูกต้องและเป็นมืออาชีพ',
          () => { goTo('report_submitted'); }
        );
        return;
      }
      if (choice.action === 'restartGame') {
        state = DEFAULT_STATE();
        showMainMenu();
        return;
      }
      if (typeof choice.onSelect === 'function') choice.onSelect(state);
      const nextId = typeof choice.next === 'function'
        ? choice.next(state) : choice.next;
      goTo(nextId);
    });
    els.choiceArea.appendChild(btn);
  });
}

// ────────────────────────────────────────────────────────────────
// การนำทาง
// ────────────────────────────────────────────────────────────────
function goTo(id) {
  if (!id) { endGame(); return; }
  renderScene(id);
}

function endGame() {
  setCharacter('system');
  setSpeaker('ระบบ');
  const score   = state.ethicsMeter;
  const label   = score >= 65 ? 'ยอดเยี่ยม' : score >= 40 ? 'น่าพอใจ' : 'ถูกบิดเบือน';
  typeText(
    `— สิ้นสุดการตรวจสอบ —\n\nคะแนนความซื่อสัตย์ : ${score}/100  [${label}]\n` +
    `หลักฐานที่เก็บได้   : ${state.collectedEvidence.length} รายการ`,
    () => { els.btnNext.disabled = true; }
  );
}

// ────────────────────────────────────────────────────────────────
// แบบทดสอบ IT Audit Quiz
// ────────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'ความเสี่ยงใดที่เกิดขึ้นในคดีนี้?',
    options: [
      { label: 'A', text: 'SQL Injection', correct: false },
      { label: 'B', text: 'Shared Account & Terminated User', correct: true },
    ],
    successMsg:
      '✅ ถูกต้อง! การที่ OAT_Admin และ MANA_Dev ใช้ IP เดียวกัน (Shared Account) ' +
      'รวมถึงบัญชีของมานะที่ยังคง Active หลังลาออก (Terminated User) ' +
      'ล้วนละเมิดหลัก Logical Access Control ซึ่งกำหนดว่า\n\n' +
      '• แต่ละผู้ใช้ต้องมีบัญชีเฉพาะตัว (Unique User ID)\n' +
      '• บัญชีต้องถูกปิดทันทีเมื่อพ้นสภาพพนักงาน (Timely Revocation)\n\n' +
      'ช่องโหว่นี้ทำให้พี่โอ๊ตสามารถปลอมรอยดิจิทัลโดยใช้บัญชีเก่าของมานะได้',
    failMsg:
      '❌ ยังไม่ถูกต้อง SQL Injection เป็นช่องโหว่ของฐานข้อมูล แต่ในคดีนี้ปัญหาคือ\n' +
      'การใช้บัญชีร่วมกัน (Shared Account) และบัญชีผู้ใช้ที่หมดสัญญาแล้วยังเปิดอยู่\n' +
      '(Terminated User) ซึ่งผิดหลัก Logical Access Control ลองอีกครั้ง!',
  },
];

function renderQuizModal() {
  const container = document.getElementById('audit-content');
  if (!container) return;

  let html = '<div class="quiz-wrapper">';
  QUIZ_QUESTIONS.forEach(q => {
    html += `
      <div class="quiz-question" id="quiz-${q.id}">
        <p class="quiz-q-text">${q.question}</p>
        <div class="quiz-options">
          ${q.options.map(opt => `
            <label class="quiz-option">
              <input type="radio" name="${q.id}" value="${opt.label}" />
              <span class="quiz-option-label">${opt.label}</span>
              <span class="quiz-option-text">${opt.text}</span>
            </label>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="feedback-${q.id}" style="display:none"></div>
      </div>`;
  });
  html += `<button class="quiz-submit-btn" id="quiz-submit">ส่งคำตอบ</button></div>`;
  container.innerHTML = html;

  document.getElementById('quiz-submit').addEventListener('click', () => {
    let allAnswered = true;
    QUIZ_QUESTIONS.forEach(q => {
      const selected   = document.querySelector(`input[name="${q.id}"]:checked`);
      const feedbackEl = document.getElementById(`feedback-${q.id}`);
      if (!selected) {
        allAnswered = false;
        feedbackEl.textContent = '⚠️ กรุณาเลือกคำตอบก่อน';
        feedbackEl.className   = 'quiz-feedback quiz-warn';
        feedbackEl.style.display = 'block';
        return;
      }
      const chosenOpt = q.options.find(o => o.label === selected.value);
      feedbackEl.textContent   = chosenOpt.correct ? q.successMsg : q.failMsg;
      feedbackEl.className     = `quiz-feedback ${chosenOpt.correct ? 'quiz-success' : 'quiz-fail'}`;
      feedbackEl.style.display = 'block';
    });
    if (allAnswered) document.getElementById('quiz-submit').disabled = true;
  });
}

// ────────────────────────────────────────────────────────────────
// ตรรกะโมดัล
// ────────────────────────────────────────────────────────────────
function openModal(modal)  { modal.classList.remove('hidden'); modal.querySelector('.modal-backdrop').onclick = () => closeModal(modal); }
function closeModal(modal) { modal.classList.add('hidden'); }

// ────────────────────────────────────────────────────────────────
// Event listeners
// ────────────────────────────────────────────────────────────────
els.btnMute.addEventListener('click', () => {
  if (state.currentBgm && bgmPlayer.paused && !state.isMuted) bgmPlayer.play().catch(() => {});
  toggleMute();
});

els.btnEvidence.addEventListener('click', () => openModal(els.evidenceModal));
els.closeEvidence.addEventListener('click', () => {
  closeModal(els.evidenceModal);
  // Leave presentation mode when the player dismisses without presenting
  isPresentingMode = false;
  selectedEvidenceItem = null;
  if (els.presentEvidenceBtn) {
    els.presentEvidenceBtn.classList.add('hidden');
    els.presentEvidenceBtn.disabled = true;
  }
});

// Present Evidence button
if (els.presentEvidenceBtn) {
  els.presentEvidenceBtn.addEventListener('click', () => {
    if (selectedEvidenceItem === expectedEvidence) {
      showGameAlert('หลักฐานมัดตัว!', 'นี่แหละคือหลักฐานที่ปฏิเสธไม่ได้!', () => {
        closeModal(els.evidenceModal);
        isPresentingMode = false;
        els.presentEvidenceBtn.classList.add('hidden');
        goTo(successSceneId);
      });
    } else {
      showGameAlert('หลักฐานอ่อนเกินไป!', 'หลักฐานชิ้นนี้ไม่เกี่ยวข้องกัน ลองคิดดูดีๆ', () => {
        closeModal(els.evidenceModal);
        isPresentingMode = false;
        els.presentEvidenceBtn.classList.add('hidden');
        goTo(failSceneId_ev);
      });
    }
  });
}

els.btnAudit.addEventListener('click', () => { renderQuizModal(); openModal(els.auditModal); });
els.closeAudit.addEventListener('click', () => closeModal(els.auditModal));

// HUD save/load (in-game, not the menu)
els.btnSave.addEventListener('click', () => {
  try {
    localStorage.setItem('ghost_save', JSON.stringify({
      currentScene:      state.currentScene,
      ethicsMeter:       state.ethicsMeter,
      collectedEvidence: state.collectedEvidence,
      flags:             state.flags,
    }));
    flashHudBtn(els.btnSave);
  } catch (e) { console.warn('บันทึกเกมล้มเหลว:', e); }
});

els.btnLoad.addEventListener('click', () => {
  const ok = loadGame();
  if (!ok) alert('ไม่พบข้อมูลเซฟเกม');
  else flashHudBtn(els.btnLoad);
});

// Continue button
els.btnNext.addEventListener('click', () => {
  if (isTyping && skipTypewriterFn) { skipTypewriterFn(); return; }
  const node = DIALOGUE_NODES[state.currentScene];
  if (!node) return;
  const nextId = typeof node.next === 'function' ? node.next(state) : node.next;
  goTo(nextId);
});

els.dialogueText.addEventListener('click', () => {
  // Keeping this for backwards compatibility just in case
  if (isTyping && skipTypewriterFn) skipTypewriterFn();
});

document.getElementById('dialogue-box').addEventListener('click', (e) => {
  if (e.target.closest('#choice-area') || e.target.closest('#btn-next')) return;
  if (isTyping && skipTypewriterFn) skipTypewriterFn();
});

document.getElementById('toast-dismiss').addEventListener('click', () => {
  clearTimeout(_toastTimer);
  dismissToast();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal(els.evidenceModal);
    closeModal(els.auditModal);
    closeModal(els.logMinigameModal);
    if(els.emailModal) closeModal(els.emailModal);
  }
});

// ────────────────────────────────────────────────────────────────
// MINIGAME & QUIZ LOGIC
// ────────────────────────────────────────────────────────────────


// ─── Utility: shuffle / random ──────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randTime(hour = 2) {
  const m = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const s = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Log Database Minigame — data-driven, randomized each replay
let selectedLogRows = [];
let logHintsLeft = 2;
const CORRECT_PAIR = ['OAT_Admin', 'MANA_Dev']; // fixed for story continuity

const LOG_USER_POOL = [
  { user: 'NUN_Senior',  action: 'VIEW_REPORT' },
  { user: 'ALICE_Dev',   action: 'READ_API' },
  { user: 'SYS_Cron',    action: 'BACKUP_DB', fixedIp: 'localhost' },
  { user: 'BOB_Sales',   action: 'EXPORT_CSV' },
  { user: 'TONY_QA',     action: 'RUN_TEST' },
  { user: 'LEE_Finance', action: 'VIEW_LEDGER' },
  { user: 'KIM_HR',      action: 'SEARCH_EMP' },
  { user: 'WEB_Service', action: 'FETCH_HOOK', fixedIp: '10.0.0.1' },
];
const SHARED_IP_POOL = ['192.168.1.105', '10.0.0.42', '172.16.3.77', '192.168.2.88'];
const DISTRACTOR_IP_POOL = [
  '192.168.1.50', '10.0.0.44', '172.16.1.20', '192.168.3.12',
  '10.0.1.99', '172.16.2.55', '192.168.4.21', '10.0.2.11',
];

let currentSharedIp = '192.168.1.105';
let logRowEls = [];

function setLogFeedback(msg, kind) {
  const el = document.getElementById('log-feedback');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'mg-feedback' + (msg ? ` show ${kind || ''}` : '');
}

function updateSuspicion() {
  const correctCount = selectedLogRows.filter(u => CORRECT_PAIR.includes(u)).length;
  const pct = Math.min(100, correctCount * 50 - (selectedLogRows.length - correctCount) * 15);
  const safe = Math.max(0, pct);
  document.getElementById('suspicion-fill').style.width = safe + '%';
  document.getElementById('suspicion-value').textContent = safe + '%';
  els.btnConfirmLog.disabled = !(correctCount === 2 && selectedLogRows.length === 2);
}

function buildLogRows() {
  currentSharedIp = pickRandom(SHARED_IP_POOL);
  const distractors = shuffle([...LOG_USER_POOL]).slice(0, 5);
  const noiseIps = shuffle([...DISTRACTOR_IP_POOL]);

  const rows = [
    { user: 'OAT_Admin', ip: currentSharedIp, action: 'PULL_DATA', time: randTime(2) },
    { user: 'MANA_Dev',  ip: currentSharedIp, action: 'PULL_DATA', time: randTime(2) },
  ];
  distractors.forEach((u, i) => {
    rows.push({
      user: u.user,
      ip: u.fixedIp || noiseIps[i],
      action: u.action,
      time: randTime(pickRandom([1, 2, 2, 2, 3])),
    });
  });
  return shuffle(rows);
}

function renderLogTable(rows) {
  const tbody = document.querySelector('#log-table tbody');
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.user = r.user;
    tr.dataset.ip   = r.ip;
    tr.innerHTML = `<td>${r.time}</td><td>${r.user}</td><td>${r.ip}</td><td>${r.action}</td>`;
    tbody.appendChild(tr);
  });
  logRowEls = Array.from(tbody.querySelectorAll('tr'));
  attachLogRowHandlers();
}

function attachLogRowHandlers() {
  logRowEls.forEach(row => {
    row.addEventListener('mouseenter', () => {
      const ip = row.dataset.ip;
      if (!ip || ip === 'localhost') return;
      logRowEls.forEach(r => {
        if (r.dataset.ip === ip) r.classList.add('ip-match');
      });
    });
    row.addEventListener('mouseleave', () => {
      logRowEls.forEach(r => r.classList.remove('ip-match'));
    });
    row.addEventListener('click', () => {
      const user = row.dataset.user;
      const idx = selectedLogRows.indexOf(user);
      if (idx > -1) {
        selectedLogRows.splice(idx, 1);
        row.classList.remove('selected');
      } else {
        if (selectedLogRows.length >= 2) {
          setLogFeedback('เลือกได้แค่ 2 แถวเท่านั้น ยกเลิกแถวก่อนหน้าก่อน', 'hint');
          return;
        }
        selectedLogRows.push(user);
        row.classList.add('selected');
        if (!CORRECT_PAIR.includes(user)) {
          row.classList.add('wrong-pick');
          setTimeout(() => row.classList.remove('wrong-pick'), 400);
          setLogFeedback('แถวนี้ IP ไม่ซ้ำกับใครในตาราง ลองดูคอลัมน์ IP Address อีกที', 'bad');
        } else {
          setLogFeedback('น่าสนใจ... แถวนี้มีอะไรบางอย่าง 🔎', 'good');
        }
      }
      updateSuspicion();
    });
  });
}

function openLogMinigame() {
  els.logMinigameModal.classList.remove('hidden');
  selectedLogRows = [];
  logHintsLeft = 2;
  renderLogTable(buildLogRows());
  els.btnConfirmLog.disabled = true;
  setLogFeedback('');
  updateSuspicion();
  const hintBtn = document.getElementById('btn-log-hint');
  if (hintBtn) {
    hintBtn.disabled = false;
    document.getElementById('hint-count').textContent = `(${logHintsLeft})`;
  }
}

els.closeLogMinigame.addEventListener('click', () => closeModal(els.logMinigameModal));

const btnLogHint = document.getElementById('btn-log-hint');
if (btnLogHint) {
  btnLogHint.addEventListener('click', () => {
    if (logHintsLeft <= 0) return;
    logHintsLeft--;
    document.getElementById('hint-count').textContent = `(${logHintsLeft})`;
    if (logHintsLeft === 1) {
      setLogFeedback('💡 คำใบ้: เรียงจาก IP Address — หา IP ที่ปรากฏ 2 ครั้งจากคนละ User', 'hint');
    } else {
      setLogFeedback(`💡 คำใบ้: IP ${currentSharedIp} คือ IP ที่ถูกใช้ซ้ำ`, 'hint');
      btnLogHint.disabled = true;
    }
  });
}

els.btnConfirmLog.addEventListener('click', () => {
  closeModal(els.logMinigameModal);
  collectEvidence({
    id:          'ev-access-log',
    tag:         'หลักฐานดิจิทัล',
    title:       'Access Log (IP ซ้ำซ้อน)',
    description: `OAT_Admin และ MANA_Dev ล็อกอินจาก IP ${currentSharedIp} เดียวกันในเวลาใกล้เคียงกัน`,
    flagged: true,
  });
  showGameAlert('พบหลักฐาน!', `OAT_Admin และ MANA_Dev ล็อกอินจาก IP ${currentSharedIp} เดียวกันในเวลาใกล้เคียงกัน — น่าสงสัยมาก!`, () => {
    goTo('chapter2_1');
  }, 'success');
});

// ─── Custom game alert (replaces native alert) ──────────────
function showGameAlert(title, message, callback, kind = 'info') {
  const modal = document.getElementById('game-alert');
  const icon = document.getElementById('alert-icon');
  const iconMap = { success: '✓', danger: '✕', warn: '⚠', info: 'ℹ' };
  icon.textContent = iconMap[kind] || 'ℹ';
  icon.className = `alert-icon ${kind}`;
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-message').textContent = message;
  modal.classList.remove('hidden');
  void modal.querySelector('.game-alert-panel').offsetWidth;
  const ok = document.getElementById('alert-ok');
  const done = () => {
    modal.classList.add('hidden');
    ok.removeEventListener('click', done);
    if (callback) callback();
  };
  ok.addEventListener('click', done);
}

// ─── Email Minigame ─────────────────────────────────────────
const EMAIL_DATA = {
  hr: {
    subject: 'HR: แจ้งกำหนดการวันหยุดประจำปี',
    from: 'hr@quantumfintech.co.th',
    external: false,
    time: '10:22',
    body: 'เรียนพนักงานทุกท่าน,\n\nบริษัทขอแจ้งวันหยุดประจำปีตามปฏิทินแนบท้าย ลาพักร้อนต้องยื่นเรื่องล่วงหน้า 7 วัน\n\n— ฝ่ายบุคคล',
    suspect: false,
  },
  system: {
    subject: 'System: Server Update Scheduled',
    from: 'noreply@quantumfintech.co.th',
    external: false,
    time: '13:05',
    body: 'Scheduled maintenance window: Sunday 02:00-04:00.\nServices will be briefly unavailable.\n\n— DevOps',
    suspect: false,
  },
  suspect: {
    subject: 'RE: การประเมินราคาฐานข้อมูลลูกค้า VIP (ด่วน)',
    from: 'J.Doe <ext@protonmail.com>',
    external: true,
    time: '01:47',
    body: 'โอ๊ต ตกลงตามราคาเดิม 50k USDT นะ\nส่งไฟล์ vip_customers.csv ผ่าน channel เดิม ห้ามฝากลง cloud บริษัทเด็ดขาด\n\nถ้าเสร็จคืนนี้ พรุ่งนี้โอนให้ทันที — J.',
    suspect: true,
  },
  promo: {
    subject: 'Lazada: โค้ดส่งฟรีเดือนนี้!',
    from: 'promo@lazada.co.th',
    external: true,
    time: '08:30',
    body: 'ใช้โค้ด FREESHIP20 ก่อนสิ้นเดือน\n(อีเมลโฆษณาที่ส่งมาที่กล่องงาน — ควรไปอยู่ junk แต่ไม่ใช่หลักฐานทุจริต)',
    suspect: false,
  },
  team: {
    subject: 'ประชุมทีมพรุ่งนี้ 9 โมง',
    from: 'พี่นุ่น <noon@quantumfintech.co.th>',
    external: false,
    time: 'เมื่อวาน',
    body: 'ทีม audit ประชุมสั้นๆ ตอนเช้าเรื่องแผนตรวจประจำไตรมาส\nไม่เกิน 30 นาที ห้องประชุม 14B',
    suspect: false,
  },
  invoice: {
    subject: 'Invoice #INV-2048 — AWS Quarterly Billing',
    from: 'billing@amazon.com',
    external: true,
    time: '03:12',
    body: 'Dear Customer,\n\nYour quarterly AWS bill is ready. Amount due: USD 12,480.00\nDue date: end of month. Pay via corporate account as usual.\n\nInvoice: INV-2048\n\n— AWS Billing Team\n(ภายนอก แต่เป็นใบแจ้งหนี้จริงของบริษัท ไม่ใช่การขายข้อมูล)',
    suspect: false,
  },
  vendor: {
    subject: 'Re: ขอรายชื่อผู้ติดต่อฝ่ายจัดซื้อ',
    from: 'sales@techvendor.co.th',
    external: true,
    time: 'เมื่อวาน',
    body: 'สวัสดีครับ รบกวนขอเบอร์ติดต่อฝ่ายจัดซื้อหน่อยครับ เราอยากเสนอราคาซอฟต์แวร์\n\n— Sales Team, TechVendor\n(External vendor ขอข้อมูลทั่วไป ไม่เข้าข่ายทุจริต)',
    suspect: false,
  },
};

let selectedEmail = null;

function renderEmailList(keys) {
  const list = document.querySelector('.email-list');
  if (!list) return;
  list.innerHTML = '';
  keys.forEach(key => {
    const e = EMAIL_DATA[key];
    if (!e) return;
    const senderText = e.from.includes('<')
      ? e.from.split('<')[0].trim()
      : e.from;
    const div = document.createElement('div');
    div.className = 'email-item' + (key === 'suspect' ? ' unread' : '');
    div.dataset.email = key;
    div.innerHTML = `
      <div class="email-subject">${e.subject}</div>
      <div class="email-sender">${senderText} · ${e.time}</div>
    `;
    div.addEventListener('click', () => {
      document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
      div.classList.add('active');
      div.classList.remove('unread');
      selectedEmail = key;
      renderEmailPreview(key);
    });
    list.appendChild(div);
  });
}

function openEmailMiniGame() {
  els.emailModal.classList.remove('hidden');
  selectedEmail = null;
  renderEmailList(shuffle(Object.keys(EMAIL_DATA)));
  document.getElementById('email-preview').innerHTML =
    '<div class="email-empty">📬 เลือกอีเมลด้านซ้ายเพื่ออ่านเนื้อหา แล้วประเมินว่าเป็นอีเมลน่าสงสัยหรือไม่<br><br><span style="opacity:.7">💡 ระวัง: อีเมลจาก external domain ไม่ได้แปลว่าทุจริตเสมอไป ดูเนื้อหาด้วย</span></div>';
}

function renderEmailPreview(key) {
  const e = EMAIL_DATA[key];
  if (!e) return;
  const preview = document.getElementById('email-preview');
  preview.innerHTML = `
    <div class="email-preview-header">
      <div class="email-preview-subject">${e.subject}</div>
      <div class="email-preview-meta">
        จาก: <span class="email-from ${e.external ? 'external' : ''}">${e.from}</span>
        ${e.external ? ' <span style="color:var(--danger)">[EXTERNAL]</span>' : ''} · ${e.time}
      </div>
    </div>
    <div class="email-preview-body">${e.body}</div>
    <div class="email-actions">
      <button class="email-action-btn email-action-safe" data-act="safe">✅ ปลอดภัย (ข้าม)</button>
      <button class="email-action-btn email-action-flag" data-act="flag">🚩 น่าสงสัย — ยื่นเป็นหลักฐาน</button>
    </div>
  `;
  preview.querySelector('[data-act="safe"]').addEventListener('click', () => judgeEmail(key, false));
  preview.querySelector('[data-act="flag"]').addEventListener('click', () => judgeEmail(key, true));
}

function judgeEmail(key, flagged) {
  const e = EMAIL_DATA[key];
  const item = document.querySelector(`.email-item[data-email="${key}"]`);
  if (flagged && e.suspect) {
    item.classList.add('flagged-good');
    showGameAlert('สืบค้นสำเร็จ!', 'พบหลักฐานมัดตัว: พี่โอ๊ตตกลงขายฐานข้อมูล VIP ให้บุคคลภายนอก (J.Doe) ผ่านอีเมล', () => {
      collectEvidence({
        id: 'email_trace',
        tag: 'หลักฐานดิจิทัล',
        title: 'อีเมลตกลงซื้อขายข้อมูล',
        description: 'พบพี่โอ๊ตติดต่อส่งมอบฐานข้อมูลให้คนนอกองค์กร (J.Doe)',
        flagged: true,
      });
      closeModal(els.emailModal);
      goTo('chapter3_1');
    }, 'success');
  } else if (flagged && !e.suspect) {
    adjustEthics(-5);
    item.classList.add('flagged-bad');
    showGameAlert('ผิดพลาด!', 'การยื่นอีเมลปกติเป็นหลักฐานเท่ากับการกล่าวหาโดยไม่มีมูล\nความซื่อสัตย์ลดลง -5\n\nลองอ่านอีเมลฉบับอื่นให้ละเอียด', null, 'danger');
  } else if (!flagged && e.suspect) {
    showGameAlert('รอสักครู่...', 'อีเมลฉบับนี้มีอะไรผิดปกติอยู่นะ ลองอ่านซ้ำอีกครั้ง\n(สังเกตผู้ส่งภายนอก + เนื้อหาเกี่ยวกับการซื้อขายข้อมูล)', null, 'warn');
  } else {
    item.classList.add('flagged-good');
    showGameAlert('ข้ามไป', 'อีเมลนี้ไม่มีอะไรผิดปกติ ลองเช็คฉบับอื่น', null, 'info');
  }
}

if (els.closeEmailMinigame) {
  els.closeEmailMinigame.addEventListener('click', () => closeModal(els.emailModal));
}

// Final Quiz Logic
let quizScore = 0;

function openAuditModal() {
  els.auditModal.classList.remove('hidden');
  document.querySelectorAll('input[name="auditQ1"]').forEach(r => r.checked = false);
}

els.submitAuditBtn.addEventListener('click', () => {
  const selected = document.querySelector('input[name="auditQ1"]:checked');
  if (!selected) {
    alert('กรุณาเลือกคำตอบ');
    return;
  }
  if (selected.value === 'B') quizScore = 50;
  else quizScore = 0;
  
  closeModal(els.auditModal);
  showFinalScore();
});

function showFinalScore() {
  els.gameContainer.style.display = 'none';
  els.finalScoreScreen.classList.remove('hidden');

  const finalEthics = Math.min(Math.max(state.ethicsMeter, 0), 50);
  const totalScore  = finalEthics + quizScore;

  let gradeLetter = '';
  let evalMessage = '';

  if (totalScore >= 90) {
    gradeLetter = 'S';
    evalMessage = 'IT Auditor ระดับพระกาฬ! สมบูรณ์แบบทั้งทักษะและจริยธรรม';
  } else if (totalScore >= 70) {
    gradeLetter = 'A';
    evalMessage = 'ทำงานได้ดีมาก! วิเคราะห์เฉียบขาด';
  } else if (totalScore >= 50) {
    gradeLetter = 'B';
    evalMessage = 'ผ่านมาตรฐาน แต่ต้องระวังการตัดสินใจให้รอบคอบกว่านี้';
  } else {
    gradeLetter = 'F';
    evalMessage = 'คุณละเลยจริยธรรมวิชาชีพ! ต้องทบทวนตัวเองด่วน';
  }

  els.scoreDetails.innerHTML = `
    <div class="score-card">
      <div class="grade-display grade-${gradeLetter}">${gradeLetter}</div>
      <div class="score-row"><span>จริยธรรม (Ethics):</span> <span>${finalEthics} / 50</span></div>
      <div class="score-row"><span>วิเคราะห์คดี (Audit):</span> <span>${quizScore} / 50</span></div>
      <div class="total-row"><span>คะแนนรวม:</span> <span>${totalScore} / 100</span></div>
      <p class="eval-message">${evalMessage}</p>
    </div>
  `;
}

els.restartBtn.addEventListener('click', () => {
  els.finalScoreScreen.classList.add('hidden');
  state = DEFAULT_STATE();
  showMainMenu();
});

// ────────────────────────────────────────────────────────────────
// เริ่มต้นระบบ
// ────────────────────────────────────────────────────────────────
window.onload = () => {
    console.log("Game Engine Loaded. Going to main menu...");
    if (typeof storyData !== 'undefined' && storyData.start) {
        showMainMenu();
    } else {
        console.error("storyData is not defined or 'start' node is missing!");
        document.body.innerHTML += '<div style="color:red; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:9999;">ERROR: storyData NOT FOUND!</div>';
    }
};
