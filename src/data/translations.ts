export interface Translations {
  title: string;
  subtitle: string;
  tagline: string;
  selectLanguage: string;
  playOffline: string;
  playOnline: string;
  singleDeviceModes: string;
  foreheadMode: string;
  foreheadModeDesc: string;
  versusMode: string;
  versusModeDesc: string;
  createRoom: string;
  joinRoom: string;
  roomCode: string;
  enterRoomCode: string;
  enterName: string;
  host: string;
  waitingForHost: string;
  playersJoined: string;
  clueGiverMode: string;
  givingCluesTo: string;
  holding: string;
  hint: string;
  tapScreenInstructions: string;
  tiltInstructions: string;
  back: string;
  exit: string;
  score: string;
  timer: string;
  timesUp: string;
  playAgain: string;
  correct: string;
  pass: string;
  fruits: string;
  candies: string;
  food: string;
  startGame: string;
  selectCategory: string;
  setupRoom: string;
  roomLobby: string;
  joinError: string;
  emptyNameError: string;
  emptyCodeError: string;
  sec: string;
  gameSummary: string;
  p1: string;
  p2: string;
  versusReady: string;
  versusInstruction: string;
  howToPlay: string;
  howToPlayForehead: string;
  howToPlayVersus: string;
  howToPlayOnline: string;
  tiltCalibration: string;
  tiltEnabled: string;
  tiltDisabled: string;
  scoreBoard: string;
  arabicCharacters: string;
  englishCharacters: string;
  famousApps: string;
  hintsLeft: string;
  noHintsLeft: string;
  gameMode: string;
  classicMode: string;
  timedMode: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  credits: string;
  leader: string;
  customRoomCode: string;
  theme: string;
  lightTheme: string;
  darkTheme: string;
  musicOn: string;
  musicOff: string;
  hintUsed: string;
}

export const TRANSLATIONS: Record<"en" | "ar", Translations> = {
  en: {
    title: "Picture Guess Party",
    subtitle: "Hold & Guess Social Game",
    tagline: "The ultimate guessing game for friends and family! Play in English & Arabic.",
    selectLanguage: "اللغة العربية",
    playOffline: "Single Phone (Local Play)",
    playOnline: "Multi-Device Room (WiFi/Online)",
    singleDeviceModes: "Single Phone Modes",
    foreheadMode: "Forehead Clues (Heads Up)",
    foreheadModeDesc: "Hold the phone on your forehead. Friends give you clues!",
    versusMode: "Split Screen Versus",
    versusModeDesc: "2 Players sit opposite. Guess what's on your head by asking questions!",
    createRoom: "Create Room",
    joinRoom: "Join Room",
    roomCode: "Room Code",
    enterRoomCode: "Enter 4-Digit Code",
    enterName: "Your Name",
    host: "Host",
    waitingForHost: "Waiting for host to start...",
    playersJoined: "Players in Room",
    clueGiverMode: "Clue Giver Mode",
    givingCluesTo: "You are giving clues to",
    holding: "who is holding",
    hint: "Hint",
    tapScreenInstructions: "Tap left side to PASS ❌ • Tap right side to CORRECT ✅",
    tiltInstructions: "Tilt Down for Correct ✅ • Tilt Up for Pass ❌",
    back: "Back",
    exit: "Exit Game",
    score: "Score",
    timer: "Timer",
    timesUp: "Time's Up!",
    playAgain: "Play Again",
    correct: "Correct! ✅",
    pass: "Pass ❌",
    fruits: "Fruits 🍎",
    candies: "Candies & Sweets 🍬",
    food: "Food & Meals 🍔",
    startGame: "Start Game",
    selectCategory: "Select Category",
    setupRoom: "Room Settings",
    roomLobby: "Room Lobby",
    joinError: "Room not found or game already started.",
    emptyNameError: "Please enter your name.",
    emptyCodeError: "Please enter a valid 4-digit room code.",
    sec: "s",
    gameSummary: "Round Finished!",
    p1: "Player 1",
    p2: "Player 2",
    versusReady: "Tap Ready to reveal cards!",
    versusInstruction: "Neither player can see their own card! Take turns asking Yes/No questions. Tap your friend's side to mark Correct/Pass.",
    howToPlay: "How to Play",
    howToPlayForehead: "Place the phone on your forehead or chest facing your friends. Your friends will shout or act clues (without saying the word) to help you guess the picture. Tilt the phone or tap the screen to record answers!",
    howToPlayVersus: "Two players hold the phone horizontally between them. Player 1 can only see Player 2's card, and Player 2 can only see Player 1's card. Ask Yes/No questions to guess yours! Mark each other's score by tapping the buttons.",
    howToPlayOnline: "Create a room and have your friends join with their phones. When the round starts, hold your phone under your chin or on your forehead. Your friends' screens will automatically show what you are holding, so they can shout clues! They can also mark you correct instantly from their screen!",
    tiltCalibration: "Tilt Control",
    tiltEnabled: "Tilt Controls Active (Tilt phone down/up)",
    tiltDisabled: "Tilt Controls Off (Tap screen to play)",
    scoreBoard: "Scoreboard",
    arabicCharacters: "Arabic Characters 🕌",
    englishCharacters: "Famous Westerners 🎩",
    famousApps: "Famous Apps 📱",
    hintsLeft: "Hints Left",
    noHintsLeft: "No hints left!",
    gameMode: "Game Mode",
    classicMode: "Classic Mode",
    timedMode: "Timed Mode",
    difficulty: "Difficulty",
    easy: "Easy (3 Hints)",
    medium: "Medium (2 Hints)",
    hard: "Hard (1 Hint)",
    credits: "TRL TEAM FOR DEVELOPMENT",
    leader: "Leader: TAIM",
    customRoomCode: "Custom Code (Optional)",
    theme: "Theme",
    lightTheme: "Light Mode ☀️",
    darkTheme: "Dark Mode 🌙",
    musicOn: "Music On 🎵",
    musicOff: "Music Off 🔇",
    hintUsed: "Hint: ",
  },
  ar: {
    title: "تحدي احزر الصورة",
    subtitle: "لعبة جماعية وتحديات ممتعة",
    tagline: "أقوى لعبة تخمين وحماس للأصدقاء والعائلة! العب باللغة العربية والإنجليزية.",
    selectLanguage: "English",
    playOffline: "جهاز واحد (لعب محلي)",
    playOnline: "غرفة جماعية (عدة أجهزة أونلاين)",
    singleDeviceModes: "أنماط الهاتف الواحد",
    foreheadMode: "تحدي الجبهة (وش اللي علي)",
    foreheadModeDesc: "ضع الهاتف على جبهتك ودع أصدقاءك يعطونك تلميحات!",
    versusMode: "شاشة منقسمة (رأس لرأس)",
    versusModeDesc: "لاعبان يجلسان متقابلين. احزر بطاقتك عبر طرح الأسئلة واللاعب الآخر يصحح لك!",
    createRoom: "إنشاء غرفة",
    joinRoom: "انضمام لغرفة",
    roomCode: "رمز الغرفة",
    enterRoomCode: "أدخل الرمز المكون من 4 أرقام",
    enterName: "اسمك الكريم",
    host: "المستضيف",
    waitingForHost: "بانتظار المستضيف لبدء اللعبة...",
    playersJoined: "اللاعبون في الغرفة",
    clueGiverMode: "وضع معطي التلميحات",
    givingCluesTo: "أنت تعطي تلميحات لـ",
    holding: "الذي يحمل صورة",
    hint: "تلميح",
    tapScreenInstructions: "اضغط على الجانب الأيسر للتخطي ❌ • الجانب الأيمن للصح ✅",
    tiltInstructions: "أمل الهاتف لأسفل للصح ✅ • أمل الهاتف لأعلى للتخطي ❌",
    back: "رجوع",
    exit: "إنهاء اللعبة",
    score: "النقاط",
    timer: "الوقت",
    timesUp: "انتهى الوقت!",
    playAgain: "العب مجدداً",
    correct: "صح! ✅",
    pass: "تخطي ❌",
    fruits: "فواكه 🍎",
    candies: "حلويات وسكاكر 🍬",
    food: "أطعمة ووجبات 🍔",
    startGame: "ابدأ اللعبة",
    selectCategory: "اختر القسم",
    setupRoom: "إعدادات الغرفة",
    roomLobby: "صالة الانتظار",
    joinError: "الغرفة غير موجودة أو بدأت اللعبة بالفعل.",
    emptyNameError: "يرجى كتابة اسمك.",
    emptyCodeError: "يرجى إدخال رمز صحيح من 4 أرقام.",
    sec: "ثانية",
    gameSummary: "انتهت الجولة!",
    p1: "اللاعب 1",
    p2: "اللاعب 2",
    versusReady: "اضغط جاهز للكشف عن البطاقات!",
    versusInstruction: "لا يمكن لأي لاعب رؤية بطاقته الخاصة! تبادلا طرح أسئلة (نعم/لا). اضغط على شاشة صديقك لتسجيل إجابته.",
    howToPlay: "طريقة اللعب",
    howToPlayForehead: "ضع الهاتف على جبهتك أو تحت ذقنك موجهاً الشاشة لأصدقائك. سيقوم أصدقاؤك بالصراخ أو تمثيل تلميحات (دون ذكر الكلمة) لمساعدتك في التخمين. أمل الهاتف أو اضغط على الشاشة لتسجيل الإجابات!",
    howToPlayVersus: "يمسك اللاعبان الهاتف أفقياً بينهما. يرى اللاعب الأول بطاقة اللاعب الثاني فقط، واللاعب الثاني يرى بطاقة الأول فقط. اطرح أسئلة إجابتها نعم/لا لتحزر بطاقتك! اضغط على أزرار شاشة صديقك لتسجيل نقاطه.",
    howToPlayOnline: "أنشئ غرفة ودع أصدقاءك ينضمون من هواتفهم. عند بدء اللعبة، ضع هاتفك على جبهتك أو تحت ذقنك. ستظهر صورتك تلقائياً على شاشات أصدقائك ليعطوك تلميحات! ويمكنهم أيضاً تسجيل إجابتك كـ (صح) مباشرة من هواتفهم!",
    tiltCalibration: "تحكم الإمالة",
    tiltEnabled: "تحكم الإمالة مفعّل (أمل الهاتف لأسفل/أعلى)",
    tiltDisabled: "تحكم الإمالة مقفل (اضغط على الشاشة للعب)",
    scoreBoard: "لوحة النقاط",
    arabicCharacters: "شخصيات عربية 🕌",
    englishCharacters: "شخصيات غربية 🎩",
    famousApps: "تطبيقات مشهورة 📱",
    hintsLeft: "التلميحات المتبقية",
    noHintsLeft: "لم يتبقى تلميحات!",
    gameMode: "نمط اللعبة",
    classicMode: "النمط الكلاسيكي",
    timedMode: "النمط المؤقت",
    difficulty: "درجة الصعوبة",
    easy: "سهل (٣ تلميحات)",
    medium: "متوسط (تلميحان)",
    hard: "صعب (تلميح واحد)",
    credits: "فريق التطوير TRL TEAM FOR DEVELOPMENT",
    leader: "رئيس الفريق: TAIM",
    customRoomCode: "رمز مخصص للغرفة (اختياري)",
    theme: "المظهر",
    lightTheme: "وضع عادي ☀️",
    darkTheme: "وضع ليلي 🌙",
    musicOn: "تشغيل الموسيقى 🎵",
    musicOff: "كتم الموسيقى 🔇",
    hintUsed: "تلميح: ",
  }
};
