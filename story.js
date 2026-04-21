// ════════════════════════════════════════════════════════════════
//  GHOST IN THE SYSTEM — DIALOGUE NODES  (Story v3 — Clean)
//  IT Audit Interactive Experience
// ════════════════════════════════════════════════════════════════

const DIALOGUE_NODES = {

  // ── PROLOGUE ────────────────────────────────────────────────
  start: {
    speaker:         'ระบบ',
    character:       'system',
    location:        'สำนักงาน Quantum FinTech — ตี 2',
    backgroundImage: 'assets/images/bg_office_night.jpg',
    bgm:             'assets/audio/The_Final_Ledger_Entry_90sec.mp3',
    bgmMood:         'intro',
    characterImage:  null,
    text:            "คุณคือ 'กาญจน์' IT Auditor รุ่นใหม่ไฟแรงแห่งบริษัท Quantum FinTech...\n\nเวลา 02:00 น. คืนวันหยุด ระบบแจ้งเตือนฉุกเฉินดังขึ้น! มีการดึงข้อมูลลูกค้า VIP ล็อตใหญ่ออกไปจากฐานข้อมูล\n\n[ รหัสคดี: GHOST-001 ]",
    choices: [
      { text: 'รีบเข้าสู่ระบบตรวจสอบ', next: 'prologue_1' },
    ],
  },

  prologue_1: {
    speaker:         'พี่นุ่น (Senior Auditor)',
    character:       'pnoon',
    location:        'สำนักงาน Quantum FinTech — ตี 2',
    backgroundImage: 'assets/images/bg_office_night.jpg',
    bgmMood:         'intro',
    characterImage:  'assets/images/รูปตัวละคร/พี่นุ้น/พี่นุ่น.png',
    text:            'กาญจน์! มาพอดีเลย มีการดึงข้อมูลออกไปจริงๆ เราต้องรีบหาตัวคนทำและปิดช่องโหว่ให้เจอก่อนเช้า เราควรเริ่มแกะรอยจากตรงไหนดี?',
    choices: [
      { text: 'ตรวจสอบ Access Log ล่าสุดของเซิร์ฟเวอร์', next: 'chapter1_1' },
    ],
  },

  // ── CHAPTER 1 : LOG INVESTIGATION ───────────────────────────
  chapter1_1: {
    speaker:         'พี่นุ่น (Senior Auditor)',
    character:       'pnoon',
    location:        'ห้องคอมพิวเตอร์ — ชั้น 14',
    backgroundImage: 'assets/images/bg_computer_screen.jpg',
    bgmMood:         'investigation',
    characterImage:  'assets/images/รูปตัวละคร/พี่นุ้น/ท่าขอร้อง.png',
    text:            'ดีมาก พี่ดึง Log พื้นฐานมาให้แล้ว มีบัญชีของพนักงานหลายคนล็อกอินเข้ามาในช่วงเวลาเกิดเหตุ ลองใช้ทักษะของคุณวิเคราะห์ดูสิว่ามีอะไรผิดปกติไหม?',
    choices: [
      { text: '🔍 เปิดหน้าต่างระบบ Log เพื่อวิเคราะห์', action: 'openLogMinigame' },
    ],
  },

  // ── CHAPTER 2 : EMAIL INVESTIGATION ─────────────────────────
  chapter2_1: {
    speaker:         'กาญจน์',
    character:       'you',
    location:        'ห้องคอมพิวเตอร์ — ชั้น 14',
    backgroundImage: 'assets/images/bg_computer_screen.jpg',
    bgmMood:         'discovery',
    characterImage:  'assets/images/รูปตัวละคร/พระเอก/ท่าสงสัย.png',
    animation:       'bounce',
    text:            'น่าสงสัยมาก... OAT_Admin และ MANA_Dev ล็อกอินจาก IP Address เดียวกันในเวลาใกล้เคียงกัน\n\nแต่เดี๋ยวนะ! พี่มานะลาออกไปเมื่อเดือนที่แล้วนี่ ทำไมบัญชียังใช้งานได้!?',
    onEnter: () => {
      collectEvidence({
        id:          'ev-resign-doc',
        tag:         'เอกสาร HR',
        title:       'Terminated User ที่ยัง Active',
        description: 'MANA_Dev พ้นสภาพพนักงานไป 3 เดือนแล้ว แต่บัญชียังคง Active — ช่องโหว่ User Lifecycle Management',
        flagged: true,
      });
    },
    choices: [
      { text: 'มีคนสวมรอยใช้ Shared Account! ต้องเช็คอีเมลของพี่โอ๊ต', next: 'chapter2_consult' },
    ],
  },

  // ── CHAPTER 2.5 : พี่นุ่น reminds about Confidentiality (ISO 19011) ──
  chapter2_consult: {
    speaker:         'พี่นุ่น (Senior Auditor)',
    character:       'pnoon',
    location:        'ห้องคอมพิวเตอร์ — ชั้น 14',
    backgroundImage: 'assets/images/bg_computer_screen.jpg',
    bgmMood:         'sneak',
    characterImage:  'assets/images/รูปตัวละคร/พี่นุ้น/ท่าขอร้อง.png',
    text:            'เดี๋ยวก่อนกาญจน์ — การเข้า inbox ของพนักงาน แม้จะเพื่อตรวจสอบทุจริต ก็ต้องมีขั้นตอน\n\n[ ISO 19011 — Confidentiality: ข้อมูลที่ได้มาระหว่างการตรวจสอบต้องได้รับการอนุญาตและเก็บรักษาอย่างเหมาะสม ]\n\nฉันขอ authorization ด่วนจาก CISO ได้ แต่ใช้เวลาประมาณ 30 นาที...หรือถ้าไม่รอก็ได้ เวลาคนร้ายกำลังหนีอยู่ เลือกเองนะ',
    choices: [
      { text: '⏳ รอ authorization ก่อน (ช้าแต่ถูกต้อง)', next: 'chapter2_authorized' },
      { text: '⚡ ลุยเลย — ถ้าช้า log อาจโดนลบก่อน', next: 'chapter2_2' },
    ],
  },

  chapter2_authorized: {
    speaker:         'พี่นุ่น (Senior Auditor)',
    character:       'pnoon',
    location:        'ห้องคอมพิวเตอร์ — ชั้น 14',
    backgroundImage: 'assets/images/bg_computer_screen.jpg',
    bgmMood:         'investigation',
    characterImage:  'assets/images/รูปตัวละคร/พี่นุ้น/พี่นุ่น.png',
    text:            'CISO อนุมัติแล้ว! ดีมาก...ไม่ว่าผลจะออกมาอย่างไร หลักฐานที่ได้จะใช้ในกระบวนการทางกฎหมายได้ถูกต้อง ไม่โดนยกฟ้องเพราะกระบวนการได้มาไม่ชอบ\n\nนี่คือความแตกต่างระหว่าง "ผู้ตรวจสอบมืออาชีพ" กับ "คนอยากเป็นฮีโร่"',
    onEnter: () => {
      state.flags.authorizedAccess = true;
      adjustEthics(+5);
    },
    choices: [
      { text: '📂 เปิด Inbox ตรวจสอบ', next: 'chapter2_2' },
    ],
  },

  chapter2_2: {
    speaker:         'ระบบ',
    character:       'system',
    location:        'ห้องคอมพิวเตอร์ — ชั้น 14',
    backgroundImage: 'assets/images/bg_computer_screen.jpg',
    bgmMood:         'sneak',
    characterImage:  null,
    text:            'ในฐานะ Auditor เรามีสิทธิ์เข้าถึงข้อมูลเพื่อการตรวจสอบทุจริต ลองสแกน Inbox ของพี่โอ๊ตดูว่ามีเบาะแสการซื้อขายข้อมูลกับคนนอกหรือไม่',
    choices: [
      { text: '📧 แอบตรวจสอบ Inbox ของพี่โอ๊ต', action: 'openEmailMiniGame' },
    ],
  },

  // ── CHAPTER 2.9 : Review หลักฐานกับพี่นุ่น (Independence principle) ──
  chapter2_review: {
    speaker:         'พี่นุ่น (Senior Auditor)',
    character:       'pnoon',
    location:        'ห้องคอมพิวเตอร์ — ชั้น 14',
    backgroundImage: 'assets/images/bg_computer_screen.jpg',
    bgmMood:         'confront',
    characterImage:  'assets/images/รูปตัวละคร/พี่นุ้น/พี่นุ่น.png',
    text:            'หลักฐานแน่นแล้ว ก่อนที่จะไปเผชิญหน้ากับพี่โอ๊ต — อยากให้ฉันไปด้วยเป็นพยานไหม?\n\n[ ISO 19011 — Independence: การ interview ผู้ถูกตรวจสอบ ควรมีผู้ตรวจสอบอย่างน้อย 2 คน เพื่อป้องกันข้อโต้แย้งภายหลัง ]\n\nแต่ถ้ากาญจน์อยากคุยส่วนตัวก่อน ก็เข้าใจได้ พี่โอ๊ตเป็นรุ่นพี่ที่สนิทกัน',
    choices: [
      {
        text: '👥 ไปด้วยกัน (มีพยาน — ถูกต้องตามหลัก Independence)',
        next: 'chapter3_1',
        onSelect: () => { state.flags.confrontWith = 'team'; adjustEthics(+5); },
      },
      {
        text: '🚶 ไปคนเดียว (อยากให้โอกาสพี่โอ๊ตอธิบาย)',
        next: 'chapter3_1',
        onSelect: () => { state.flags.confrontWith = 'solo'; },
      },
    ],
  },

  // ── CHAPTER 3 : CONFRONTATION ───────────────────────────────
  chapter3_1: {
    speaker:         'กาญจน์',
    character:       'you',
    location:        'ทางเดิน — ชั้น 14',
    backgroundImage: 'assets/images/bg_office_night.jpg',
    bgmMood:         'confront',
    characterImage:  'assets/images/รูปตัวละคร/พระเอก/ท่าสอบสวน.png',
    text:            'ชัดเจนเลย! มีการตกลงราคาฐานข้อมูลลูกค้า VIP จริงๆ เราต้องรีบไปคุยกับพี่โอ๊ตที่ห้องเซิร์ฟเวอร์เพื่อขอคำชี้แจง',
    choices: [
      { text: 'ตรงไปที่ห้องเซิร์ฟเวอร์ทันที', next: 'chapter3_2' },
    ],
  },

  chapter3_2: {
    speaker:         'พี่โอ๊ต (System Admin)',
    character:       'alex',
    location:        'ห้องเซิร์ฟเวอร์ บี — ชั้น 14',
    backgroundImage: 'assets/images/bg_server_room.jpg',
    bgmMood:         'tension',
    characterImage:  'assets/images/รูปตัวละคร/โอ๊ดด/ท่าตอแหล.png',
    animation:       'sway',
    text:            'อ้าว กาญจน์ ดึกป่านนี้มีอะไรล่ะ? ระบบมันรวนนิดหน่อยน่ะ พี่กำลังแก้อยู่ ไม่ได้มีใครดึงข้อมูลอะไรหรอก แหม...',
    choices: [
      { text: 'พี่โอ๊ตครับ มีหลักฐานชี้ว่ามีข้อมูลรั่วไหลจากฝั่งพี่นะครับ', next: 'chapter3_3' },
    ],
  },

  chapter3_3: {
    speaker:          'พี่โอ๊ต (System Admin)',
    character:        'alex',
    location:         'ห้องเซิร์ฟเวอร์ บี — ชั้น 14',
    backgroundImage:  'assets/images/bg_server_room.jpg',
    bgmMood:          'climax',
    characterImage:   'assets/images/รูปตัวละคร/โอ๊ดด/ท่าความแตก.png',
    animation:        'shake',
    text:             'หลักฐานอะไร!? อย่ามากล่าวหากันลอยๆ นะน้อง พี่ทำงานที่นี่มา 5 ปี ไม่เคยมีประวัติเสีย ถ้าไม่มีหลักฐานชัดเจน พี่จะฟ้อง HR นะ!',
    requiredEvidence: 'อีเมลตกลงซื้อขายข้อมูล',
    successScene:     'chapter3_4',
    failScene:        'bad_end',
    choices: [
      { text: '🔍 เปิดกระดานหลักฐาน — ยื่นหลักฐานเด็ด!', action: 'presentEvidence' },
    ],
  },

  chapter3_4: {
    speaker:         'พี่โอ๊ต (System Admin)',
    character:       'alex',
    location:        'ห้องเซิร์ฟเวอร์ บี — ชั้น 14',
    backgroundImage: 'assets/images/bg_server_room.jpg',
    bgmMood:         'resolution',
    characterImage:  'assets/images/รูปตัวละคร/โอ๊ดด/ท่าสารภาพ.png',
    animation:       'slump',
    text:            'พี่... พี่ขอโทษจริงๆ พี่ผิด พี่ยอมรับ\n\nแต่ก่อนจะรายงาน ขอพี่อธิบายเหตุผลหน่อย... มันไม่ใช่เรื่องความโลภ กาญจน์ มันคือ...',
    choices: [
      { text: 'พี่โอ๊ต... เกิดอะไรขึ้นกันแน่?', next: 'chapter3_plea' },
    ],
  },

  chapter3_plea: {
    speaker:         'พี่โอ๊ต (System Admin)',
    character:       'alex',
    location:        'ห้องเซิร์ฟเวอร์ บี — ชั้น 14',
    backgroundImage: 'assets/images/bg_server_room.jpg',
    bgmMood:         'resolution',
    characterImage:  'assets/images/รูปตัวละคร/โอ๊ดด/ท่าสารภาพ.png',
    text:            'แม่พี่เข้า ICU มา 3 เดือน ค่ารักษาเดือนละเกือบ 2 แสน ประกันไม่ครอบคลุม โบนัสที่หวังก็โดนตัดเพราะบริษัทตั้งเป้าใหม่\n\nคนที่ protonmail เสนอ 50,000 ดอลลาร์...พี่รู้ว่ามันผิด แต่ตอนนั้นพี่มองไม่เห็นทางอื่น\n\nกาญจน์ ถ้ารายงาน พี่ตกงานแน่ ขึ้น blacklist วงการ IT ไม่มีใครจ้าง แม่พี่อาจไม่ได้กลับบ้าน...\n\nขอเวลา 1 เดือน พี่จะทยอยคืนข้อมูล (ทั้งที่ส่งไปแล้ว) และลาออกเงียบๆ เอง สัญญา',
    choices: [
      {
        text: '💼 "ผมเสียใจด้วยเรื่องแม่พี่ แต่ลูกค้าที่ข้อมูลรั่วก็มีสิทธิ์ได้รับการปกป้อง"',
        next: 'chapter3_response_firm',
        onSelect: () => { state.flags.mercyResponse = 'firm'; },
      },
      {
        text: '🤐 "พี่โอ๊ต...ผมจะปิดเรื่องให้ พี่ลาออกเงียบๆ ได้เลย"',
        next: 'chapter3_response_soft',
        onSelect: () => {
          state.flags.mercyResponse = 'soft';
          adjustEthics(-25);
        },
      },
      {
        text: '⚖ "ผมยังไม่ตัดสิน จะเขียนรายงานตามข้อเท็จจริง ส่วนบทลงโทษไม่ใช่หน้าที่ผม"',
        next: 'chapter3_response_neutral',
        onSelect: () => { state.flags.mercyResponse = 'neutral'; adjustEthics(+5); },
      },
    ],
  },

  chapter3_response_firm: {
    speaker:         'กาญจน์',
    character:       'you',
    location:        'ห้องเซิร์ฟเวอร์ บี — ชั้น 14',
    backgroundImage: 'assets/images/bg_server_room.jpg',
    bgmMood:         'reflection',
    characterImage:  'assets/images/รูปตัวละคร/พระเอก/ท่าสงสัย.png',
    text:            'ผมเข้าใจสถานการณ์พี่ และเสียใจด้วยจริงๆ ครับ\n\nแต่...ลูกค้า VIP หลายหมื่นคนที่ข้อมูลรั่วออกไป พวกเขาจะต้องเจออะไรบ้าง? phishing? แก๊งคอลเซ็นเตอร์? บางคนอาจเสียเงินมากกว่า 2 แสนต่อเดือน\n\nและถ้าผมปิดเรื่องให้พี่ครั้งนี้ คนอื่นที่หมุนเงินไม่ทันจะเรียนรู้ว่า "ทำแบบนี้ได้"\n\nผมจะเขียนรายงานตรงไปตรงมา — แต่จะประสานฝ่าย HR ให้พิจารณาปัจจัยบรรเทาโทษให้เท่าที่ทำได้ครับ',
    onEnter: () => { adjustEthics(+10); },
    choices: [
      { text: 'กลับไปที่โต๊ะเขียนรายงาน', next: 'chapter4_1' },
    ],
  },

  chapter3_response_soft: {
    speaker:         'กาญจน์',
    character:       'you',
    location:        'ห้องเซิร์ฟเวอร์ บี — ชั้น 14',
    backgroundImage: 'assets/images/bg_server_room.jpg',
    bgmMood:         'defeat',
    characterImage:  'assets/images/รูปตัวละคร/พระเอก/ท่าสงสัย.png',
    text:            '...ก็ได้พี่ ผมจะปิดเรื่อง พี่ลาออกเงียบๆ ไปเถอะ\n\n[⚠ ละเมิดหลัก Integrity + Fair Presentation + Evidence-based Approach]\n[⚠ ความซื่อสัตย์ −25]\n\nข้อมูลลูกค้าที่รั่วไปแล้วไม่มีใครตามคืน ไม่มีใครรับผิด ไม่มีการแจ้งเตือนลูกค้าให้เปลี่ยนรหัส\n\nคุณเดินออกจากห้องเซิร์ฟเวอร์ด้วยใจที่หนักอึ้ง — วันนี้คุณช่วยพี่โอ๊ตรอด แต่อาจทำให้คนอีกหลายหมื่นโดนผลกระทบ',
    choices: [
      { text: 'กลับไปเขียนรายงาน (ปิดข้อเท็จจริง)', next: 'chapter4_1' },
    ],
  },

  chapter3_response_neutral: {
    speaker:         'กาญจน์',
    character:       'you',
    location:        'ห้องเซิร์ฟเวอร์ บี — ชั้น 14',
    backgroundImage: 'assets/images/bg_server_room.jpg',
    bgmMood:         'reflection',
    characterImage:  'assets/images/รูปตัวละคร/พระเอก/ท่าสอบสวน.png',
    text:            'ผมยังไม่ตัดสินครับพี่ — หน้าที่ของผมคือเขียนข้อเท็จจริงและหลักฐาน ส่วนบทลงโทษ ฝ่าย HR และกฎหมายจะเป็นผู้พิจารณา ผมจะไม่แนะนำอะไรเกินหน้าที่\n\n[ หลัก Fair Presentation: auditor ไม่ใช่ศาล ]\n\nกาญจน์หันหลังเดินออกไปในทางเดินที่เงียบสงัด — สิ่งที่เขียนในรายงานต่อจากนี้ จะเป็นตัวชี้ว่าเขาเป็น IT Auditor แบบไหน',
    choices: [
      { text: 'กลับไปที่โต๊ะเขียนรายงาน', next: 'chapter4_1' },
    ],
  },

  // ── CHAPTER 4 : FINAL REPORT (Ethics Dilemma) ───────────────
  chapter4_1: {
    speaker:         'ระบบ',
    character:       'system',
    location:        'ห้องตรวจสอบ — ชั้น 14',
    backgroundImage: 'assets/images/bg_office_desk.jpg',
    bgmMood:         'reflection',
    characterImage:  null,
    text:            'คุณกลับมาที่โต๊ะทำงานพร้อมหลักฐานครบถ้วน ได้เวลาเขียน Audit Report ส่งผู้บริหารแล้ว\n\nคุณจะระบุเนื้อหาในรายงานอย่างไร?',
    choices: [
      { text: "📝 ระบุชื่อในรายงานชัดเจนว่า 'พี่โอ๊ต' เป็นผู้ขโมยข้อมูล", action: 'accusePerson' },
      { text: '📊 รายงานเฉพาะข้อเท็จจริง: พบการใช้ IP ซ้ำซ้อนและอีเมลน่าสงสัย', action: 'reportFacts' },
    ],
  },

  // ── ENDINGS ─────────────────────────────────────────────────
  report_submitted: {
    speaker:         'ระบบ',
    character:       'system',
    location:        'ผลการตรวจสอบ',
    backgroundImage: 'assets/images/bg_office_desk.jpg',
    bgmMood:         'victory',
    characterImage:  null,
    text:            'รายงานผลการตรวจสอบเบื้องต้นถูกส่งตรงถึงผู้บริหารระดับสูงและฝ่ายกฎหมายเรียบร้อยแล้ว\n\nการสืบสวนภายในเริ่มดำเนินการทันทีตามข้อเท็จจริงที่คุณรวบรวมมา...\n\nคดี GHOST-001 ปิดฉากลงอย่างสมบูรณ์!',
    choices: [
      { text: '🏆 ดูผลประเมินการทำงาน IT Auditor ของคุณ', action: 'openAuditReport' },
    ],
  },

  bad_end: {
    speaker:         'ระบบ',
    character:       'system',
    location:        'ผลการตรวจสอบ',
    backgroundImage: 'assets/images/bg_office_desk.jpg',
    bgmMood:         'defeat',
    characterImage:  null,
    text:            '❌ การสืบสวนล้มเหลว!\n\nหลักฐานของคุณอ่อนเกินไป พี่โอ๊ตหาข้ออ้างปัดตกได้ทั้งหมดและแอบลบ Log ทิ้งในภายหลัง\n\nคุณถูกใบเตือนเรื่องการกล่าวหาพนักงานโดยไม่มีหลักฐานชัดเจน...\n\n( GAME OVER )',
    choices: [
      { text: '🔄 เริ่มเกมใหม่', next: 'start' },
    ],
  },

}; // end DIALOGUE_NODES

window.storyData = DIALOGUE_NODES;
