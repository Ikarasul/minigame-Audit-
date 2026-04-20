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
// ระบบเสียง — BGM
// ────────────────────────────────────────────────────────────────
const bgmPlayer  = new Audio();
bgmPlayer.loop   = true;
bgmPlayer.volume = 0.55;

function setBgm(path) {
  if (!path) {
    bgmPlayer.pause();
    bgmPlayer.src    = '';
    state.currentBgm = null;
    return;
  }
  if (path === state.currentBgm) return;
  state.currentBgm = path;
  bgmPlayer.src    = path;
  bgmPlayer.load();
  bgmPlayer.play().catch(() => {});
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

  if ('bgm' in sceneData) setBgm(sceneData.bgm);
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


// Log Database Minigame
let selectedLogRows = [];
let logHintsLeft = 2;
const CORRECT_PAIR = ['OAT_Admin', 'MANA_Dev'];

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

function openLogMinigame() {
  els.logMinigameModal.classList.remove('hidden');
  selectedLogRows = [];
  logHintsLeft = 2;
  els.logTableRows.forEach(row => row.classList.remove('selected', 'wrong-pick', 'ip-match'));
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

// Hover: highlight other rows with same IP
els.logTableRows.forEach(row => {
  row.addEventListener('mouseenter', () => {
    const ip = row.getAttribute('data-ip');
    if (!ip || ip === 'localhost') return;
    els.logTableRows.forEach(r => {
      if (r.getAttribute('data-ip') === ip) r.classList.add('ip-match');
    });
  });
  row.addEventListener('mouseleave', () => {
    els.logTableRows.forEach(r => r.classList.remove('ip-match'));
  });

  row.addEventListener('click', () => {
    const user = row.getAttribute('data-user');
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
        setLogFeedback('แถวนี้ IP ไม่ซ้ำกับใคร ลองดูคอลัมน์ IP Address อีกที', 'bad');
      } else {
        setLogFeedback('น่าสนใจ... แถวนี้มีอะไรบางอย่าง 🔎', 'good');
      }
    }
    updateSuspicion();
  });
});

const btnLogHint = document.getElementById('btn-log-hint');
if (btnLogHint) {
  btnLogHint.addEventListener('click', () => {
    if (logHintsLeft <= 0) return;
    logHintsLeft--;
    document.getElementById('hint-count').textContent = `(${logHintsLeft})`;
    if (logHintsLeft === 1) {
      setLogFeedback('💡 คำใบ้: เรียงจาก IP Address ดู — มี IP หนึ่งตัวที่ปรากฏ 2 ครั้งจากคนละ User', 'hint');
    } else {
      setLogFeedback('💡 คำใบ้: 192.168.1.105 คือ IP ที่ถูกใช้ซ้ำ', 'hint');
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
    description: 'OAT_Admin และ MANA_Dev ล็อกอินจาก IP เดียวกันในเวลาใกล้เคียงกัน',
    flagged: true,
  });
  showGameAlert('พบหลักฐาน!', 'OAT_Admin และ MANA_Dev ล็อกอินจาก IP 192.168.1.105 เดียวกันในเวลาใกล้เคียงกัน — น่าสงสัยมาก!', () => {
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
};

let selectedEmail = null;

function openEmailMiniGame() {
  els.emailModal.classList.remove('hidden');
  selectedEmail = null;
  document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
  document.getElementById('email-preview').innerHTML =
    '<div class="email-empty">📬 เลือกอีเมลด้านซ้ายเพื่ออ่านเนื้อหา แล้วประเมินว่าเป็นอีเมลน่าสงสัยหรือไม่</div>';
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

document.querySelectorAll('.email-item').forEach(item => {
  item.addEventListener('click', () => {
    const key = item.dataset.email;
    if (!key) return;
    document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    item.classList.remove('unread');
    selectedEmail = key;
    renderEmailPreview(key);
  });
});

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
