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
      { text: 'มีคนสวมรอยใช้ Shared Account! ต้องเช็คอีเมลของพี่โอ๊ต', next: 'chapter2_2' },
    ],
  },

  chapter2_2: {
    speaker:         'ระบบ',
    character:       'system',
    location:        'ห้องคอมพิวเตอร์ — ชั้น 14',
    backgroundImage: 'assets/images/bg_computer_screen.jpg',
    characterImage:  null,
    text:            'ในฐานะ Auditor เรามีสิทธิ์เข้าถึงข้อมูลเพื่อการตรวจสอบทุจริต ลองสแกน Inbox ของพี่โอ๊ตดูว่ามีเบาะแสการซื้อขายข้อมูลกับคนนอกหรือไม่',
    choices: [
      { text: '📧 แอบตรวจสอบ Inbox ของพี่โอ๊ต', action: 'openEmailMiniGame' },
    ],
  },

  // ── CHAPTER 3 : CONFRONTATION ───────────────────────────────
  chapter3_1: {
    speaker:         'กาญจน์',
    character:       'you',
    location:        'ทางเดิน — ชั้น 14',
    backgroundImage: 'assets/images/bg_office_night.jpg',
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
    characterImage:  'assets/images/รูปตัวละคร/โอ๊ดด/ท่าสารภาพ.png',
    animation:       'slump',
    text:            'พี่... พี่ขอโทษ... ช่วงนี้พี่หมุนเงินไม่ทันจริงๆ พี่แค่กะจะขายข้อมูลชุดเล็กๆ ไม่คิดว่าระบบจะแจ้งเตือน\n\nกาญจน์... พี่ขอร้องล่ะ อย่าเพิ่งรายงานเรื่องนี้ได้ไหม? ถือซะว่าพี่ขอ',
    choices: [
      { text: 'กลับไปเขียนรายงานสรุปคดี', next: 'chapter4_1' },
    ],
  },

  // ── CHAPTER 4 : FINAL REPORT (Ethics Dilemma) ───────────────
  chapter4_1: {
    speaker:         'ระบบ',
    character:       'system',
    location:        'ห้องตรวจสอบ — ชั้น 14',
    backgroundImage: 'assets/images/bg_office_desk.jpg',
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
    characterImage:  null,
    text:            '❌ การสืบสวนล้มเหลว!\n\nหลักฐานของคุณอ่อนเกินไป พี่โอ๊ตหาข้ออ้างปัดตกได้ทั้งหมดและแอบลบ Log ทิ้งในภายหลัง\n\nคุณถูกใบเตือนเรื่องการกล่าวหาพนักงานโดยไม่มีหลักฐานชัดเจน...\n\n( GAME OVER )',
    choices: [
      { text: '🔄 เริ่มเกมใหม่', next: 'start' },
    ],
  },

}; // end DIALOGUE_NODES

window.storyData = DIALOGUE_NODES;
