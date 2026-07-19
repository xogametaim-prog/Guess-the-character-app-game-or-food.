import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Globe, 
  Users, 
  Phone, 
  ArrowLeft, 
  Check, 
  X, 
  Volume2, 
  VolumeX, 
  Timer, 
  RotateCcw, 
  HelpCircle, 
  UserPlus, 
  LogOut, 
  Info, 
  ArrowRight,
  Sparkles,
  Gamepad2,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Copy,
  Plus,
  Play,
  Settings
} from "lucide-react";
import { CATEGORIES, Category, GameItem } from "./data/categories.js";
import { TRANSLATIONS, Translations } from "./data/translations.js";

// Synthesized sound feedback engine using Web Audio API
function playAudioTone(type: "correct" | "pass" | "countdown" | "gameover") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "pass") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.22); // D3
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "countdown") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "gameover") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

type Screen = 
  | "HOME" 
  | "HOW_TO_PLAY"
  | "OFFLINE_MODE_SELECT" 
  | "CATEGORY_SELECT" 
  | "FOREHEAD_COUNTDOWN" 
  | "FOREHEAD_GAME" 
  | "VERSUS_GAME" 
  | "ONLINE_SETUP" 
  | "ROOM_LOBBY" 
  | "ONLINE_GAME" 
  | "SUMMARY";

export default function App() {
  // Config & Localization
  const [lang, setLang] = useState<"en" | "ar">("ar"); // Default to Arabic as requested, or can toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tiltEnabled, setTiltEnabled] = useState(false); // Default false for iframe/universal compatibility

  const t: Translations = TRANSLATIONS[lang];
  const isRtl = lang === "ar";

  // App Navigation Flow
  const [screen, setScreen] = useState<Screen>("HOME");

  // Game Settings (Common)
  const [selectedCategory, setSelectedCategory] = useState<string>("fruits");
  const [timerDuration, setTimerDuration] = useState<number>(60);

  // --- Offline: Forehead Mode State ---
  const [foreheadItems, setForeheadItems] = useState<GameItem[]>([]);
  const [foreheadIndex, setForeheadIndex] = useState(0);
  const [foreheadScore, setForeheadScore] = useState(0);
  const [foreheadHistory, setForeheadHistory] = useState<{ item: GameItem; guessed: boolean }[]>([]);
  const [countdownNum, setCountdownNum] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(60);

  // --- Offline: Versus Split Screen State ---
  const [vPlayer1Item, setVPlayer1Item] = useState<GameItem | null>(null);
  const [vPlayer2Item, setVPlayer2Item] = useState<GameItem | null>(null);
  const [vPlayer1Score, setVPlayer1Score] = useState(0);
  const [vPlayer2Score, setVPlayer2Score] = useState(0);
  const [vRevealed, setVRevealed] = useState(false);
  const [vSecondsLeft, setVSecondsLeft] = useState(60);
  const [vHistory, setVHistory] = useState<{ p1: GameItem; p1Guessed: boolean; p2: GameItem; p2Guessed: boolean }[]>([]);

  // --- Online Room State ---
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [roomState, setRoomState] = useState<any>(null);
  const [onlineJoinError, setOnlineJoinError] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // Tilt orientation tracking
  const [tiltStatus, setTiltStatus] = useState<"center" | "correct" | "pass">("center");
  const lastTiltTime = useRef<number>(0);

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  // Helper to trigger audio
  const triggerAudio = (type: "correct" | "pass" | "countdown" | "gameover") => {
    if (soundEnabled) playAudioTone(type);
  };

  // Copy Room Code Helper
  const [copied, setCopied] = useState(false);
  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Toggle Language
  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "ar" : "en"));
  };

  // --- Tilt Control Engine ---
  useEffect(() => {
    if (!tiltEnabled || screen !== "FOREHEAD_GAME") return;

    let initialBeta: number | null = null;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta; // Range: [-180, 180] (Front-back tilt)
      if (beta === null) return;

      if (initialBeta === null) {
        initialBeta = beta;
        return;
      }

      const now = Date.now();
      if (now - lastTiltTime.current < 1500) return; // 1.5s debounce cooldown

      // Portrait chin-holding posture (device upright, facing outward, roughly beta ~ 70-110)
      // Tilt DOWN (correct): Beta increases dramatically (e.g., pointing screen down to floor)
      // Tilt UP (pass): Beta decreases dramatically (e.g., pointing screen up to ceiling)
      const diff = beta - initialBeta;

      if (diff > 35 || beta > 125) {
        // Correct Action
        setTiltStatus("correct");
        lastTiltTime.current = now;
        setTimeout(() => {
          handleForeheadAction(true);
          setTiltStatus("center");
        }, 500);
      } else if (diff < -35 || beta < 55) {
        // Pass Action
        setTiltStatus("pass");
        lastTiltTime.current = now;
        setTimeout(() => {
          handleForeheadAction(false);
          setTiltStatus("center");
        }, 500);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [tiltEnabled, screen, foreheadIndex, foreheadItems]);

  // --- Offline: Start Forehead Countdown ---
  const startForeheadGame = () => {
    // Gather random shuffles from chosen category
    const items = [...activeCategory.items].sort(() => Math.random() - 0.5);
    setForeheadItems(items);
    setForeheadIndex(0);
    setForeheadScore(0);
    setForeheadHistory([]);
    setCountdownNum(3);
    setScreen("FOREHEAD_COUNTDOWN");

    triggerAudio("countdown");
  };

  // Countdown clock effect
  useEffect(() => {
    if (screen !== "FOREHEAD_COUNTDOWN") return;
    if (countdownNum > 1) {
      const timer = setTimeout(() => {
        setCountdownNum((prev) => prev - 1);
        triggerAudio("countdown");
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdownNum === 1) {
      const timer = setTimeout(() => {
        setSecondsLeft(timerDuration);
        setScreen("FOREHEAD_GAME");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdownNum, screen]);

  // Game timer effect
  useEffect(() => {
    if (screen !== "FOREHEAD_GAME") return;
    if (secondsLeft > 0) {
      const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Time's Up
      triggerAudio("gameover");
      setScreen("SUMMARY");
    }
  }, [secondsLeft, screen]);

  // Handle Forehead Tap / Tilt Action
  const handleForeheadAction = (isCorrect: boolean) => {
    const currentItem = foreheadItems[foreheadIndex];
    if (!currentItem) return;

    if (isCorrect) {
      triggerAudio("correct");
      setForeheadScore((prev) => prev + 1);
    } else {
      triggerAudio("pass");
    }

    setForeheadHistory((prev) => [...prev, { item: currentItem, guessed: isCorrect }]);

    if (foreheadIndex + 1 < foreheadItems.length) {
      setForeheadIndex((prev) => prev + 1);
    } else {
      // Finished all 100 cards
      triggerAudio("gameover");
      setScreen("SUMMARY");
    }
  };

  // --- Offline: Versus Screen State ---
  const startVersusGame = () => {
    const items = [...activeCategory.items].sort(() => Math.random() - 0.5);
    setVPlayer1Item(items[0]);
    setVPlayer2Item(items[1]);
    setVPlayer1Score(0);
    setVPlayer2Score(0);
    setVRevealed(false);
    setVHistory([]);
    setVSecondsLeft(timerDuration);
    setScreen("VERSUS_GAME");
  };

  // Versus mode clock
  useEffect(() => {
    if (screen !== "VERSUS_GAME" || !vRevealed) return;
    if (vSecondsLeft > 0) {
      const timer = setTimeout(() => setVSecondsLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      triggerAudio("gameover");
      setScreen("SUMMARY");
    }
  }, [vSecondsLeft, screen, vRevealed]);

  // Handle Versus Action
  const handleVersusAction = (targetPlayer: 1 | 2, isCorrect: boolean) => {
    const items = [...activeCategory.items].sort(() => Math.random() - 0.5);

    if (targetPlayer === 1) {
      if (isCorrect) {
        triggerAudio("correct");
        setVPlayer1Score((prev) => prev + 1);
      } else {
        triggerAudio("pass");
      }
      setVHistory((prev) => [
        ...prev,
        {
          p1: vPlayer1Item!,
          p1Guessed: isCorrect,
          p2: vPlayer2Item!,
          p2Guessed: false,
        },
      ]);
      // Pick another random item not matching player 2's current item
      const nextItem = items.find((it) => it.id !== vPlayer2Item?.id) || items[0];
      setVPlayer1Item(nextItem);
    } else {
      if (isCorrect) {
        triggerAudio("correct");
        setVPlayer2Score((prev) => prev + 1);
      } else {
        triggerAudio("pass");
      }
      setVHistory((prev) => [
        ...prev,
        {
          p1: vPlayer1Item!,
          p1Guessed: false,
          p2: vPlayer2Item!,
          p2Guessed: isCorrect,
        },
      ]);
      const nextItem = items.find((it) => it.id !== vPlayer1Item?.id) || items[1];
      setVPlayer2Item(nextItem);
    }
  };

  // --- Online Room Actions & API Polling ---
  // Online room creation
  const handleCreateOnlineRoom = async () => {
    if (!playerName.trim()) {
      setOnlineJoinError(t.emptyNameError);
      return;
    }
    setIsCreatingRoom(true);
    setOnlineJoinError("");

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName: playerName,
          category: selectedCategory,
          language: lang,
          timerDuration,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoomCode(data.room.code);
        setPlayerId(data.playerId);
        setRoomState(data.room);
        setScreen("ROOM_LOBBY");
      } else {
        setOnlineJoinError("Failed to create room.");
      }
    } catch (e) {
      setOnlineJoinError("Network error. Please try again.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Online room joining
  const handleJoinOnlineRoom = async () => {
    if (!playerName.trim()) {
      setOnlineJoinError(t.emptyNameError);
      return;
    }
    if (!roomCode.trim() || roomCode.length < 4) {
      setOnlineJoinError(t.emptyCodeError);
      return;
    }
    setIsJoiningRoom(true);
    setOnlineJoinError("");

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: roomCode,
          name: playerName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayerId(data.playerId);
        setRoomState(data.room);
        setScreen("ROOM_LOBBY");
      } else {
        setOnlineJoinError(data.message || t.joinError);
      }
    } catch (e) {
      setOnlineJoinError("Network error / الغرفة غير موجودة");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Sync / Poll room state
  useEffect(() => {
    if (screen !== "ROOM_LOBBY" && screen !== "ONLINE_GAME") return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomCode}`);
        const data = await res.json();
        if (data.success) {
          const oldState = roomState;
          setRoomState(data.room);

          // Detect transition to PLAYING
          if (screen === "ROOM_LOBBY" && data.room.gameState === "PLAYING") {
            setScreen("ONLINE_GAME");
            triggerAudio("countdown");
          }

          // Detect transition to ROUND_END
          if (screen === "ONLINE_GAME" && data.room.gameState === "ROUND_END") {
            triggerAudio("gameover");
            setScreen("SUMMARY");
          }
        }
      } catch (err) {
        console.error("Error polling room state:", err);
      }
    }, 1000); // Poll once every second for rapid response

    return () => clearInterval(pollInterval);
  }, [screen, roomCode, roomState]);

  // Host starts the online game
  const handleHostStartGame = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/start`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRoomState(data.room);
        setScreen("ONLINE_GAME");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit card action in online multiplayer
  const handleOnlinePlayerAction = async (targetId: string, action: "correct" | "pass") => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/player-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlayerId: targetId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setRoomState(data.room);
        triggerAudio(action === "correct" ? "correct" : "pass");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Online countdown timer helper
  const getOnlineTimeRemaining = () => {
    if (!roomState || !roomState.roundStartedAt) return timerDuration;
    const elapsed = Math.floor((Date.now() - roomState.roundStartedAt) / 1000);
    const remaining = roomState.timerDuration - elapsed;
    return Math.max(0, remaining);
  };

  const [onlineRemaining, setOnlineRemaining] = useState(60);

  useEffect(() => {
    if (screen !== "ONLINE_GAME" || !roomState) return;

    const timer = setInterval(() => {
      const remaining = getOnlineTimeRemaining();
      setOnlineRemaining(remaining);

      // If timer is expired and I am the host, notify backend
      if (remaining <= 0 && roomState.hostId === playerId) {
        fetch(`/api/rooms/${roomCode}/end`, { method: "POST" });
      }
    }, 500);

    return () => clearInterval(timer);
  }, [screen, roomState, playerId, roomCode]);

  // Back / Exit room
  const handleLeaveOnlineRoom = async () => {
    if (roomCode && playerId) {
      try {
        await fetch(`/api/rooms/${roomCode}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    setRoomCode("");
    setRoomState(null);
    setScreen("HOME");
  };

  const handleOnlineResetLobby = async () => {
    try {
      await fetch(`/api/rooms/${roomCode}/reset`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-300 text-[#2D3436] ${isRtl ? "rtl arabic-font" : "ltr"}`}>
      {/* Background Ambience Pattern matching Artistic Flair */}
      <div className="absolute inset-0 z-0 bg-[#FFD93D]"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8E9E] rounded-full -mr-32 -mt-32 opacity-30 z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#4F9DA6] rounded-full -ml-40 -mb-40 opacity-30 z-0 pointer-events-none"></div>

      {/* Header Utilities */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-20">
        <div className="flex gap-2">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-black bg-white text-xs font-black text-black hover:bg-gray-100 transition shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-[#4F9DA6]" />
            <span>{t.selectLanguage}</span>
          </button>

          {/* Sound Effect Toggle */}
          <button
            onClick={() => setSoundEnabled((p) => !p)}
            className="p-2 rounded-full border-2 border-black bg-white hover:bg-gray-100 transition shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-black"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-[#4F9DA6]" />
            ) : (
              <VolumeX className="h-4 w-4 text-[#FF8E9E]" />
            )}
          </button>
        </div>

        {/* Global Back button (except during live games) */}
        {screen !== "HOME" && 
         screen !== "FOREHEAD_GAME" && 
         screen !== "FOREHEAD_COUNTDOWN" && 
         screen !== "VERSUS_GAME" && 
         screen !== "ONLINE_GAME" && (
          <button
            onClick={() => {
              if (screen === "ROOM_LOBBY") {
                handleLeaveOnlineRoom();
              } else if (screen === "SUMMARY") {
                setScreen("HOME");
              } else {
                setScreen("HOME");
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-black bg-white text-xs text-black font-black hover:bg-gray-100 transition shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <ArrowLeft className={`h-3.5 w-3.5 text-black ${isRtl ? "rotate-180" : ""}`} />
            <span>{t.back}</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* 1. HOME SCREEN */}
        {/* ======================================================== */}
        {screen === "HOME" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md text-center z-10 flex flex-col items-center p-8 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative text-[#2D3436]"
          >
            {/* Crown decoration / Floating Emojis */}
            <div className="absolute -top-10 flex gap-4 text-3xl animate-bounce">
              <span>🍓</span>
              <span>🍬</span>
              <span>🍔</span>
            </div>

            <div className="mt-4 mb-3 p-3.5 bg-[#FF8E9E] text-black border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3">
              <Gamepad2 className="h-10 w-10 text-black" />
            </div>

            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-black font-display">
              {t.title}
            </h1>
            <p className="text-base font-bold tracking-wider text-[#2D3436] opacity-70 mt-1.5">
              {t.subtitle}
            </p>

            <p className="text-xs font-semibold text-[#2D3436]/60 mt-4 leading-relaxed max-w-xs">
              {t.tagline}
            </p>

            {/* Offline play trigger */}
            <div className="w-full space-y-4 mt-8">
              <button
                onClick={() => setScreen("OFFLINE_MODE_SELECT")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#FFD93D] border-4 border-black text-black font-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-white border-2 border-black rounded-xl">📱</span>
                  <div className="text-left rtl:text-right">
                    <p className="font-black text-sm uppercase">{t.playOffline}</p>
                    <p className="text-[10px] text-[#2D3436]/70 font-bold">
                      {lang === "en" ? "Play local party modes" : "العب فوراً مع العائلة بجهاز واحد"}
                    </p>
                  </div>
                </div>
                <ArrowRight className={`h-5 w-5 text-black group-hover:translate-x-1 transition-transform ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
              </button>

              {/* Online Play Trigger */}
              <button
                onClick={() => {
                  setOnlineJoinError("");
                  setScreen("ONLINE_SETUP");
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#4F9DA6] border-4 border-black text-black font-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-white border-2 border-black rounded-xl">👥</span>
                  <div className="text-left rtl:text-right">
                    <p className="font-black text-sm uppercase">{t.playOnline}</p>
                    <p className="text-[10px] text-[#2D3436]/70 font-bold">
                      {lang === "en" ? "Multiplayer phone rooms" : "كل شخص يمسك هاتفه ويخمن!"}
                    </p>
                  </div>
                </div>
                <Users className="h-5 w-5 text-black group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Quick How to Play access */}
            <button
              onClick={() => setScreen("HOW_TO_PLAY")}
              className="mt-6 flex items-center gap-1.5 text-xs text-black font-bold underline hover:opacity-80 transition cursor-pointer"
            >
              <Info className="h-3.5 w-3.5 text-black" />
              <span>{t.howToPlay}</span>
            </button>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 2. HOW TO PLAY INFO SCREEN */}
        {/* ======================================================== */}
        {screen === "HOW_TO_PLAY" && (
          <motion.div
            key="how_to"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg z-10 p-8 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-y-auto max-h-[85vh] custom-scroll text-[#2D3436]"
          >
            <h2 className="text-3xl font-black mb-4 text-black flex items-center gap-2 uppercase tracking-tight">
              <Info className="h-6 w-6 text-black" />
              <span>{t.howToPlay}</span>
            </h2>

            <div className="space-y-6 text-sm">
              <div className="p-4 bg-[#FFD93D]/10 border-2 border-black rounded-2xl">
                <h3 className="font-black text-black mb-2 flex items-center gap-2 uppercase tracking-tight">
                  <span className="text-lg">👑</span> {t.foreheadMode}
                </h3>
                <p className="text-xs leading-relaxed text-[#2D3436]/80 font-bold">{t.howToPlayForehead}</p>
              </div>

              <div className="p-4 bg-[#4F9DA6]/10 border-2 border-black rounded-2xl">
                <h3 className="font-black text-black mb-2 flex items-center gap-2 uppercase tracking-tight">
                  <span className="text-lg">⚔️</span> {t.versusMode}
                </h3>
                <p className="text-xs leading-relaxed text-[#2D3436]/80 font-bold">{t.howToPlayVersus}</p>
              </div>

              <div className="p-4 bg-[#FF8E9E]/10 border-2 border-black rounded-2xl">
                <h3 className="font-black text-black mb-2 flex items-center gap-2 uppercase tracking-tight">
                  <span className="text-lg">🌐</span> {t.playOnline}
                </h3>
                <p className="text-xs leading-relaxed text-[#2D3436]/80 font-bold">{t.howToPlayOnline}</p>
              </div>
            </div>

            <button
              onClick={() => setScreen("HOME")}
              className="w-full mt-6 py-3.5 bg-black text-white hover:bg-white hover:text-black border-2 border-black rounded-full font-black text-sm transition-all cursor-pointer uppercase"
            >
              {lang === "en" ? "Got It!" : "فهمت!"}
            </button>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 3. OFFLINE MODE SELECT */}
        {/* ======================================================== */}
        {screen === "OFFLINE_MODE_SELECT" && (
          <motion.div
            key="offline_select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md p-8 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 text-[#2D3436]"
          >
            <h2 className="text-2xl font-black mb-1 text-black text-center uppercase tracking-tight font-display">
              {t.singleDeviceModes}
            </h2>
            <p className="text-xs text-[#2D3436]/70 font-bold text-center mb-6">
              {lang === "en" ? "No internet needed, pass the phone!" : "العب محلياً بدون إنترنت على جهاز واحد!"}
            </p>

            <div className="space-y-4">
              {/* Forehead Mode Card */}
              <button
                onClick={() => {
                  setScreen("CATEGORY_SELECT");
                }}
                className="w-full p-5 rounded-2xl bg-[#FFD93D] border-4 border-black text-left rtl:text-right transition-all cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl p-2 bg-white border-2 border-black rounded-xl group-hover:scale-110 transition duration-200">👑</span>
                  <div>
                    <h3 className="font-black text-black text-sm uppercase">{t.foreheadMode}</h3>
                    <p className="text-xs text-[#2D3436]/80 mt-1 font-bold leading-relaxed">
                      {t.foreheadModeDesc}
                    </p>
                  </div>
                </div>
              </button>

              {/* Versus Split Screen Card */}
              <button
                onClick={() => {
                  // Direct to Category Select but mark for Versus mode
                  setScreen("CATEGORY_SELECT");
                }}
                className="w-full p-5 rounded-2xl bg-[#4F9DA6] border-4 border-black text-left rtl:text-right transition-all cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl p-2 bg-white border-2 border-black rounded-xl group-hover:scale-110 transition duration-200">⚔️</span>
                  <div>
                    <h3 className="font-black text-black text-sm uppercase">{t.versusMode}</h3>
                    <p className="text-xs text-[#2D3436]/80 mt-1 font-bold leading-relaxed">
                      {t.versusModeDesc}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 4. CATEGORY SELECT SCREEN */}
        {/* ======================================================== */}
        {screen === "CATEGORY_SELECT" && (
          <motion.div
            key="category_select"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-md p-8 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 text-[#2D3436]"
          >
            <h2 className="text-3xl font-black mb-1 text-black text-center uppercase tracking-tight font-display">
              {t.selectCategory}
            </h2>
            <p className="text-xs text-[#2D3436]/70 font-bold text-center mb-6">
              {lang === "en" ? "Each category has exactly 100 high-quality cards!" : "كل قسم يحتوي على 100 بطاقة ممتازة ومنوعة!"}
            </p>

            {/* Category Grid */}
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-[#FFD93D] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white border-2 border-black hover:bg-gray-50 text-[#2D3436]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 bg-white border-2 border-black rounded-xl">{cat.icon}</span>
                      <div className="text-left rtl:text-right">
                        <p className="font-black text-sm text-black uppercase">
                          {lang === "en" ? cat.nameEn : cat.nameAr}
                        </p>
                        <p className="text-[10px] text-[#2D3436]/70 font-bold">
                          {lang === "en" ? "100 unique pictures" : "١٠٠ صورة مميزة"}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="p-1 bg-black border-2 border-white text-white rounded-full text-xs">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Timer Selection setting */}
            <div className="mt-6 p-4 rounded-2xl bg-[#4F9DA6]/10 border-2 border-black">
              <label className="text-xs font-black text-black flex items-center justify-between mb-2 uppercase tracking-wide">
                <span>⏱️ {lang === "en" ? "Round Duration" : "مدة الجولة"}</span>
                <span className="text-black font-black text-xs">{timerDuration} {t.sec}</span>
              </label>
              <div className="flex gap-2">
                {[30, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setTimerDuration(sec)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 ${
                      timerDuration === sec
                        ? "bg-black border-black text-white"
                        : "bg-white border-black text-black hover:bg-gray-100"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Forehead Mode-specific: Tilt setting toggle */}
              <div className="mt-4 flex items-center justify-between border-t-2 border-black/10 pt-3">
                <span className="text-xs text-black font-black uppercase tracking-tight">🔄 {t.tiltCalibration}</span>
                <button
                  onClick={() => setTiltEnabled((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border-2 ${
                    tiltEnabled 
                      ? "bg-black border-black text-white" 
                      : "bg-white border-black text-black hover:bg-gray-100"
                  }`}
                >
                  {tiltEnabled ? t.tiltEnabled : t.tiltDisabled}
                </button>
              </div>
            </div>

            {/* Launch Buttons based on routing path */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => startForeheadGame()}
                className="flex-1 py-3.5 bg-[#FF8E9E] border-4 border-black rounded-2xl text-black font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase tracking-tight"
              >
                👑 {t.foreheadMode}
              </button>
              <button
                onClick={() => startVersusGame()}
                className="flex-1 py-3.5 bg-[#4F9DA6] border-4 border-black rounded-2xl text-black font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase tracking-tight"
              >
                ⚔️ {t.versusMode}
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 5. COUNTDOWN BEFORE GAME */}
        {/* ======================================================== */}
        {screen === "FOREHEAD_COUNTDOWN" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-center z-10"
          >
            <motion.h2
              key={countdownNum}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150 }}
              className="text-[120px] font-black text-black tracking-tighter drop-shadow-[4px_4px_0px_rgba(255,142,158,1)] font-display"
            >
              {countdownNum}
            </motion.h2>
            <p className="text-xl text-black font-black max-w-xs animate-pulse-slow uppercase">
              {t.foreheadModeDesc}
            </p>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 6. OFFLINE FOREHEAD GAME */}
        {/* ======================================================== */}
        {screen === "FOREHEAD_GAME" && (
          <motion.div
            key="forehead_game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-between p-6 z-30 bg-[#FFD93D] border-[12px] border-white"
          >
            {/* Visual indicator of tilt state */}
            {tiltStatus !== "center" && (
              <div className={`absolute inset-0 z-40 flex items-center justify-center transition-all border-[12px] border-white ${
                tiltStatus === "correct" ? "bg-[#4F9DA6]/95" : "bg-[#FF8E9E]/95"
              }`}>
                <span className="text-black text-6xl font-black uppercase tracking-widest animate-bounce">
                  {tiltStatus === "correct" ? t.correct : t.pass}
                </span>
              </div>
            )}

            {/* Top Bar info */}
            <div className="w-full flex justify-between items-center bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black font-bold z-10">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-black" />
                <span className="text-lg font-black tracking-widest">
                  {secondsLeft}s
                </span>
              </div>
              <div className="px-4 py-1 rounded-full bg-[#4F9DA6] border-2 border-black text-xs font-black text-black uppercase">
                {lang === "en" ? activeCategory.nameEn : activeCategory.nameAr}
              </div>
              <div className="text-sm font-black">
                {t.score}: <span className="text-[#4F9DA6] font-black">{foreheadScore}</span>
              </div>
            </div>

            {/* Giant Card Area */}
            <div className="flex-1 w-full flex flex-col items-center justify-center text-center my-6">
              {foreheadItems[foreheadIndex] ? (
                <motion.div
                  key={foreheadIndex}
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-md aspect-[4/3] bg-white border-8 border-black rounded-[36px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-8 relative overflow-hidden text-black"
                >
                  {/* Decorative background grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                  {/* Gigantic Card Emoji */}
                  <span className="text-9xl mb-4 relative z-10 filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                    {foreheadItems[foreheadIndex].emoji}
                  </span>

                  {/* Card Name */}
                  <h2 className="text-5xl md:text-6xl font-black text-black relative z-10 tracking-tight uppercase leading-none select-none">
                    {lang === "en" 
                      ? foreheadItems[foreheadIndex].nameEn 
                      : foreheadItems[foreheadIndex].nameAr}
                  </h2>

                  {/* Clue/Hint for friends */}
                  <div className="mt-4 px-4 py-2 bg-[#FF8E9E]/15 border-2 border-black/20 rounded-xl relative z-10 max-w-xs">
                    <p className="text-[10px] text-black font-black uppercase tracking-wider">{t.hint}</p>
                    <p className="text-xs text-black font-bold mt-0.5">
                      {lang === "en" 
                        ? foreheadItems[foreheadIndex].hintEn 
                        : foreheadItems[foreheadIndex].hintAr}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <p className="text-black font-black text-2xl uppercase">{t.timesUp}</p>
              )}
            </div>

            {/* Interactive Screen-tap Zones (Tapping left passes, tapping right corrects) */}
            <div className="w-full h-24 flex gap-4 z-20">
              <button
                onClick={() => handleForeheadAction(false)}
                className="flex-1 rounded-2xl bg-[#FF8E9E] border-4 border-black text-black font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase"
              >
                <X className="h-6 w-6" />
                <span className="text-sm uppercase tracking-wider">{t.pass}</span>
              </button>
              <button
                onClick={() => handleForeheadAction(true)}
                className="flex-1 rounded-2xl bg-[#4F9DA6] border-4 border-black text-black font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase"
              >
                <Check className="h-6 w-6" />
                <span className="text-sm uppercase tracking-wider">{t.correct}</span>
              </button>
            </div>

            {/* Bottom instruction bar */}
            <p className="text-[10px] text-black font-black text-center mt-3 max-w-sm uppercase tracking-wide opacity-80">
              {tiltEnabled ? t.tiltInstructions : t.tapScreenInstructions}
            </p>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 7. OFFLINE VERSUS GAME */}
        {/* ======================================================== */}
        {screen === "VERSUS_GAME" && (
          <motion.div
            key="versus_game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full flex flex-col justify-between bg-[#FFD93D] z-30 border-[12px] border-white text-[#2D3436]"
          >
            {/* Player 1 Card (Top half - Rotated upside down so Player 1 can read it while sitting opposite!) */}
            <div className="flex-1 rotate-180 flex flex-col justify-between p-4 border-b-4 border-black bg-white relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-black bg-[#FF8E9E] px-2.5 py-1 rounded-lg border-2 border-black uppercase tracking-wider">
                  {t.p1}
                </span>
                <span className="text-xs font-black text-black bg-white px-2.5 py-1 rounded-lg border-2 border-black uppercase tracking-wider">
                  {t.score}: <span className="text-[#4F9DA6] text-sm font-black">{vPlayer1Score}</span>
                </span>
              </div>

              {/* Reveal Check */}
              {!vRevealed ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-black font-bold max-w-xs uppercase tracking-tight">{t.versusInstruction}</p>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-4 bg-white rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-xs w-full">
                    {/* Player 1 sees Player 2's Card! */}
                    <span className="text-5xl block filter drop-shadow-md mb-2">
                      {vPlayer2Item?.emoji}
                    </span>
                    <h4 className="text-xl font-black text-black uppercase">
                      {lang === "en" ? vPlayer2Item?.nameEn : vPlayer2Item?.nameAr}
                    </h4>
                    <p className="text-[10px] text-black/70 font-bold uppercase mt-1">{t.p2} {lang === "en" ? "card" : "بطاقة"}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons for Player 1 to mark Player 2's card */}
              {vRevealed && (
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => handleVersusAction(2, false)}
                    className="flex-1 py-2 rounded-xl bg-[#FF8E9E] border-2 border-black text-black font-black text-xs transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase"
                  >
                    {t.pass}
                  </button>
                  <button
                    onClick={() => handleVersusAction(2, true)}
                    className="flex-1 py-2 rounded-xl bg-[#4F9DA6] border-2 border-black text-black font-black text-xs transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase"
                  >
                    {t.correct}
                  </button>
                </div>
              )}
            </div>

            {/* Middle Bar (Timer and General Options) */}
            <div className="h-14 bg-white border-y-4 border-black flex items-center justify-between px-6 z-10 shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
              <button
                onClick={() => {
                  triggerAudio("gameover");
                  setScreen("SUMMARY");
                }}
                className="p-1 px-3 text-xs font-black rounded-full border-2 border-black bg-[#FF8E9E] text-black hover:bg-gray-100 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase cursor-pointer"
              >
                {t.exit}
              </button>

              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-black" />
                <span className="text-sm font-black text-black tracking-widest font-mono">
                  {vSecondsLeft}s
                </span>
              </div>

              {!vRevealed ? (
                <button
                  onClick={() => {
                    setVRevealed(true);
                    triggerAudio("countdown");
                  }}
                  className="py-1.5 px-4 bg-[#FFD93D] border-2 border-black text-black rounded-xl text-xs font-black animate-pulse cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase"
                >
                  {lang === "en" ? "Ready!" : "جاهز!"}
                </button>
              ) : (
                <span className="text-[10px] text-[#4F9DA6] font-black uppercase tracking-widest animate-pulse border-2 border-[#4F9DA6] px-2 py-0.5 rounded-full">LIVE</span>
              )}
            </div>

            {/* Player 2 Card (Bottom half - Normal readable orientation!) */}
            <div className="flex-1 flex flex-col justify-between p-4 bg-white relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-black bg-[#4F9DA6] px-2.5 py-1 rounded-lg border-2 border-black uppercase tracking-wider">
                  {t.p2}
                </span>
                <span className="text-xs font-black text-black bg-white px-2.5 py-1 rounded-lg border-2 border-black uppercase tracking-wider">
                  {t.score}: <span className="text-[#4F9DA6] text-sm font-black">{vPlayer2Score}</span>
                </span>
              </div>

              {/* Reveal Check */}
              {!vRevealed ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-black font-bold max-w-xs uppercase tracking-tight">{t.versusReady}</p>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-4 bg-white rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-xs w-full">
                    {/* Player 2 sees Player 1's Card! */}
                    <span className="text-5xl block filter drop-shadow-md mb-2">
                      {vPlayer1Item?.emoji}
                    </span>
                    <h4 className="text-xl font-black text-black uppercase">
                      {lang === "en" ? vPlayer1Item?.nameEn : vPlayer1Item?.nameAr}
                    </h4>
                    <p className="text-[10px] text-black/70 font-bold uppercase mt-1">{t.p1} {lang === "en" ? "card" : "بطاقة"}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons for Player 2 to mark Player 1's card */}
              {vRevealed && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleVersusAction(1, false)}
                    className="flex-1 py-2 rounded-xl bg-[#FF8E9E] border-2 border-black text-black font-black text-xs transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase"
                  >
                    {t.pass}
                  </button>
                  <button
                    onClick={() => handleVersusAction(1, true)}
                    className="flex-1 py-2 rounded-xl bg-[#4F9DA6] border-2 border-black text-black font-black text-xs transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase"
                  >
                    {t.correct}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 8. ONLINE ROOM SETUP SCREEN */}
        {/* ======================================================== */}
        {screen === "ONLINE_SETUP" && (
          <motion.div
            key="online_setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md p-8 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 text-[#2D3436]"
          >
            <h2 className="text-3xl font-black mb-1 text-center text-black uppercase tracking-tight font-display">
              {t.playOnline}
            </h2>
            <p className="text-xs text-[#2D3436]/70 font-bold text-center mb-6">
              {lang === "en" ? "Play with everyone using their own phones!" : "العبوا سوياً، كل شخص يشارك من شاشة هاتفه!"}
            </p>

            {onlineJoinError && (
              <div className="p-3 mb-4 rounded-xl bg-[#FF8E9E]/10 border-2 border-black text-[#FF8E9E] font-black text-xs text-center">
                ⚠️ {onlineJoinError}
              </div>
            )}

            <div className="space-y-4">
              {/* Common Name Input */}
              <div>
                <label className="block text-xs font-black text-black mb-1.5 uppercase tracking-wide">
                  👤 {t.enterName}
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder={lang === "en" ? "Ahmad, Sarah, etc..." : "مثال: أحمد، سارة..."}
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-black text-black font-black text-sm outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-y-[-1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  maxLength={12}
                />
              </div>

              {/* Box splitting Create vs Join */}
              <div className="grid grid-cols-1 gap-4 pt-4 border-t-2 border-black/10">
                {/* HOST: Create a Room */}
                <div className="p-4 rounded-2xl bg-[#FF8E9E]/15 border-2 border-black">
                  <h3 className="font-black text-black text-xs mb-2 uppercase tracking-wide">
                    👑 {lang === "en" ? "Host a Room" : "استضافة لعبة جديدة"}
                  </h3>

                  <button
                    onClick={handleCreateOnlineRoom}
                    disabled={isCreatingRoom}
                    className="w-full py-2.5 rounded-xl bg-white border-2 border-black text-black font-black text-xs transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center justify-center gap-2 uppercase"
                  >
                    {isCreatingRoom ? "..." : t.createRoom}
                  </button>
                </div>

                {/* JOINER: Join a Room */}
                <div className="p-4 rounded-2xl bg-[#4F9DA6]/15 border-2 border-black">
                  <h3 className="font-black text-black text-xs mb-2 uppercase tracking-wide">
                    🚪 {lang === "en" ? "Join Existing Room" : "انضمام للعبة حالية"}
                  </h3>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="1234"
                      maxLength={4}
                      className="w-24 px-3 py-2 rounded-lg bg-white border-2 border-black text-black text-center font-black text-sm tracking-widest outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <button
                      onClick={handleJoinOnlineRoom}
                      disabled={isJoiningRoom}
                      className="flex-1 py-2 rounded-lg bg-white border-2 border-black text-black font-black text-xs transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center justify-center uppercase"
                    >
                      {isJoiningRoom ? "..." : t.joinRoom}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 9. ROOM LOBBY SCREEN (WAITING ROOM) */}
        {/* ======================================================== */}
        {screen === "ROOM_LOBBY" && roomState && (
          <motion.div
            key="room_lobby"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-md p-8 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 text-[#2D3436]"
          >
            {/* Room Lobby Header */}
            <div className="text-center mb-6">
              <span className="px-3 py-1 rounded-full bg-[#FF8E9E] border-2 border-black text-xs font-black text-black uppercase">
                {t.roomLobby}
              </span>

              {/* Beautiful Large Room Code Card */}
              <div className="mt-4 p-4 rounded-2xl bg-white border-4 border-black inline-flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[10px] uppercase font-black text-black/50 tracking-wider">
                  {t.roomCode}
                </span>
                <span className="text-4xl font-black text-[#4F9DA6] font-mono tracking-widest my-1 select-all">
                  {roomState.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-100 text-[10px] text-black font-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                >
                  <Copy className="h-3 w-3 text-black" />
                  <span>{copied ? "Copied! / تم النسخ" : "Copy Code"}</span>
                </button>
              </div>
            </div>

            {/* Room Settings (Only editable by Host) */}
            <div className="p-4 mb-6 rounded-2xl bg-[#4F9DA6]/10 border-2 border-black">
              <h3 className="text-xs font-black text-black mb-3 flex items-center gap-1 uppercase tracking-wide">
                <Settings className="h-4 w-4 text-black" />
                <span>{t.setupRoom}</span>
              </h3>

              {roomState.hostId === playerId ? (
                // HOST CONTROL
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-black mb-1 uppercase tracking-wider">
                      {t.selectCategory}
                    </label>
                    <select
                      value={roomState.category}
                      onChange={async (e) => {
                        const cat = e.target.value;
                        const res = await fetch(`/api/rooms/${roomCode}/settings`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ category: cat }),
                        });
                        const data = await res.json();
                        if (data.success) setRoomState(data.room);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-black text-black text-xs font-black focus:border-[#4F9DA6] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {lang === "en" ? c.nameEn : c.nameAr} ({c.icon})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-black mb-1 uppercase tracking-wider">
                        ⏱️ {lang === "en" ? "Time" : "الوقت"}
                      </label>
                      <select
                        value={roomState.timerDuration}
                        onChange={async (e) => {
                          const duration = Number(e.target.value);
                          const res = await fetch(`/api/rooms/${roomCode}/settings`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ timerDuration: duration }),
                          });
                          const data = await res.json();
                          if (data.success) setRoomState(data.room);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-black text-black text-xs font-black focus:border-[#4F9DA6] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <option value={30}>30s</option>
                        <option value={60}>60s</option>
                        <option value={90}>90s</option>
                        <option value={120}>120s</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-black mb-1 uppercase tracking-wider">
                        🌍 {lang === "en" ? "Language" : "اللغة"}
                      </label>
                      <select
                        value={roomState.language}
                        onChange={async (e) => {
                          const l = e.target.value;
                          const res = await fetch(`/api/rooms/${roomCode}/settings`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ language: l }),
                          });
                          const data = await res.json();
                          if (data.success) setRoomState(data.room);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-black text-black text-xs font-black focus:border-[#4F9DA6] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                // GUEST VIEW ONLY
                <div className="space-y-1.5 text-xs text-black font-bold">
                  <div className="flex justify-between">
                    <span className="opacity-70">{t.selectCategory}:</span>
                    <span className="font-black text-black uppercase">
                      {CATEGORIES.find((c) => c.id === roomState.category)?.icon}{" "}
                      {lang === "en" 
                        ? CATEGORIES.find((c) => c.id === roomState.category)?.nameEn 
                        : CATEGORIES.find((c) => c.id === roomState.category)?.nameAr}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">{lang === "en" ? "Round Timer" : "وقت الجولة"}:</span>
                    <span className="font-black text-black">{roomState.timerDuration} {t.sec}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Players Joined List */}
            <div className="mb-6">
              <p className="text-xs font-black text-black mb-2 uppercase tracking-wide flex items-center justify-between">
                <span>👥 {t.playersJoined}</span>
                <span className="text-black font-black text-xs">{roomState.players.length}</span>
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scroll">
                {roomState.players.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4F9DA6] border border-black animate-pulse"></span>
                      <span className="text-sm font-black text-black">{p.name}</span>
                    </div>
                    {p.id === roomState.hostId && (
                      <span className="text-[9px] bg-[#FF8E9E] text-black px-2 py-0.5 rounded-md font-black uppercase tracking-wide border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {t.host}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Game Button */}
            {roomState.hostId === playerId ? (
              <button
                onClick={handleHostStartGame}
                disabled={roomState.players.length < 2}
                className="w-full py-3.5 bg-[#4F9DA6] border-4 border-black rounded-2xl text-black font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-400 disabled:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <Play className="h-4 w-4 text-black" />
                <span>{t.startGame}</span>
              </button>
            ) : (
              <div className="text-center py-3 bg-[#FFD93D]/10 border-2 border-black rounded-2xl flex items-center justify-center gap-2">
                <div className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-black font-black uppercase tracking-wider">{t.waitingForHost}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 10. ONLINE MULTIPLAYER GAME DASHBOARD */}
        {/* ======================================================== */}
        {screen === "ONLINE_GAME" && roomState && (
          <motion.div
            key="online_game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full flex flex-col justify-between p-4 bg-[#FFD93D] z-30 border-[12px] border-white text-[#2D3436]"
          >
            {/* Top Stat Bar */}
            <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black font-black">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-black animate-pulse" />
                <span className="text-sm font-black tracking-widest font-mono">
                  {onlineRemaining}s
                </span>
              </div>
              <div className="px-3 py-1 bg-[#4F9DA6] border-2 border-black rounded-full text-[10px] font-black text-black uppercase tracking-widest">
                {CATEGORIES.find((c) => c.id === roomState.category)?.icon}{" "}
                {lang === "en" 
                  ? CATEGORIES.find((c) => c.id === roomState.category)?.nameEn 
                  : CATEGORIES.find((c) => c.id === roomState.category)?.nameAr}
              </div>
              <button
                onClick={handleLeaveOnlineRoom}
                className="px-2.5 py-1 text-[10px] font-black text-black bg-[#FF8E9E] border-2 border-black rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer uppercase"
              >
                {t.exit}
              </button>
            </div>

            {/* Split Screen layout of game board */}
            <div className="flex-1 w-full my-4 flex flex-col lg:flex-row gap-4 overflow-y-auto custom-scroll">
              
              {/* My active card - The card I hold (Placed on my forehead/under chin facing outward) */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white border-4 border-black rounded-3xl relative overflow-hidden text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="absolute top-3 left-3 bg-[#FF8E9E] px-2.5 py-0.5 rounded-md border-2 border-black text-[9px] font-black uppercase text-black">
                  {lang === "en" ? "Your Card" : "بطاقتك الحالية"}
                </div>

                {/* Hold device instruction */}
                <p className="text-[10px] text-black font-black max-w-xs mb-3 uppercase tracking-wider animate-pulse-slow">
                  👉 {t.howToPlayForehead}
                </p>

                {/* Display my assigned item in giant size facing others */}
                {(() => {
                  const myPlayerObj = roomState.players.find((p: any) => p.id === playerId);
                  const myItem = activeCategory.items.find((it) => it.id === myPlayerObj?.currentItemId);

                  if (!myItem) return <div className="text-xs font-black text-black/50 uppercase tracking-widest">Assigning card...</div>;

                  return (
                    <motion.div 
                      key={myItem.id}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center"
                    >
                      <span className="text-8xl md:text-9xl my-2 filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        {myItem.emoji}
                      </span>
                      <h2 className="text-4xl md:text-5xl font-black text-black tracking-tight uppercase">
                        {lang === "en" ? myItem.nameEn : myItem.nameAr}
                      </h2>
                    </motion.div>
                  );
                })()}

                {/* Self mark controls if they don't have other people marking them */}
                <div className="mt-6 flex gap-2 w-full max-w-xs z-10">
                  <button
                    onClick={() => handleOnlinePlayerAction(playerId, "pass")}
                    className="flex-1 py-1.5 rounded-lg bg-[#FF8E9E] border-2 border-black text-black text-xs font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase cursor-pointer"
                  >
                    {t.pass}
                  </button>
                  <button
                    onClick={() => handleOnlinePlayerAction(playerId, "correct")}
                    className="flex-1 py-1.5 rounded-lg bg-[#4F9DA6] border-2 border-black text-black text-xs font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase cursor-pointer"
                  >
                    {t.correct}
                  </button>
                </div>
              </div>

              {/* Clue Giver Dashboard - Interactive panel to view OTHER players' cards and vote for them */}
              <div className="flex-1 p-4 bg-white border-4 border-black rounded-3xl flex flex-col justify-start shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-[#2D3436]">
                <h3 className="text-xs font-black text-black mb-3 uppercase tracking-wider flex items-center gap-1.5 border-b-2 border-black/10 pb-2">
                  <Users className="h-4 w-4 text-[#4F9DA6]" />
                  <span>{t.clueGiverMode} ({lang === "en" ? "Tap Correct for others" : "اضغط صح لمساعدة أصدقائك"})</span>
                </h3>

                <div className="space-y-3 overflow-y-auto max-h-[40vh] lg:max-h-[55vh] custom-scroll">
                  {roomState.players
                    .filter((p: any) => p.id !== playerId)
                    .map((otherPlayer: any) => {
                      const otherItem = activeCategory.items.find((it) => it.id === otherPlayer.currentItemId);

                      return (
                        <div
                          key={otherPlayer.id}
                          className="p-3 rounded-2xl bg-white border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2"
                        >
                          <div className="text-left rtl:text-right flex-1">
                            <span className="text-[10px] text-[#4F9DA6] font-black block mb-0.5 uppercase tracking-tight">
                              {otherPlayer.name} ({t.score}: {otherPlayer.score})
                            </span>
                            {otherItem ? (
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{otherItem.emoji}</span>
                                <div>
                                  <p className="text-sm font-black text-black uppercase">
                                    {lang === "en" ? otherItem.nameEn : otherItem.nameAr}
                                  </p>
                                  <p className="text-[9px] text-[#2D3436]/70 font-black uppercase tracking-tight">
                                    {t.hint}: {lang === "en" ? otherItem.hintEn : otherItem.hintAr}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-black text-black/50 uppercase tracking-wide">Card guessed!</span>
                            )}
                          </div>

                          {/* Quick validation buttons for other player */}
                          <div className="flex gap-1.5 bg-white p-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ml-2 rtl:mr-2">
                            <button
                              onClick={() => handleOnlinePlayerAction(otherPlayer.id, "pass")}
                              className="p-1.5 rounded-lg text-black hover:bg-[#FF8E9E]/20 transition-all border border-transparent hover:border-black cursor-pointer"
                              title={t.pass}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOnlinePlayerAction(otherPlayer.id, "correct")}
                              className="p-1.5 rounded-lg text-black hover:bg-[#4F9DA6]/20 transition-all border border-transparent hover:border-black cursor-pointer"
                              title={t.correct}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {roomState.players.filter((p: any) => p.id !== playerId).length === 0 && (
                    <div className="text-center py-6 text-xs text-black/50 font-black uppercase tracking-wide">
                      {lang === "en" ? "Waiting for other players to join!" : "بانتظار انضمام بقية اللاعبين للتصحيح لهم!"}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 11. GAME SUMMARY SCREEN */}
        {/* ======================================================== */}
        {screen === "SUMMARY" && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md p-8 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 text-center text-[#2D3436]"
          >
            <div className="mb-4 inline-flex p-3 bg-[#4F9DA6]/20 border-2 border-black rounded-2xl text-black">
              <Sparkles className="h-8 w-8" />
            </div>

            <h2 className="text-3xl font-black text-black uppercase tracking-tight font-display">
              {t.gameSummary}
            </h2>
            <p className="text-xs text-[#2D3436]/70 font-bold mt-1 mb-6">
              {lang === "en" ? "Here are the final standings!" : "إليكم نتائج وتفاصيل الجولة النهائية!"}
            </p>

            {/* Scores Dashboard */}
            <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
              {/* Online Multiplayer Leaderboard */}
              {roomState ? (
                <div className="space-y-2 text-left rtl:text-right">
                  <h3 className="text-xs font-black text-black border-b-2 border-black/10 pb-2 uppercase tracking-wide">
                    👑 {t.scoreBoard}
                  </h3>
                  {roomState.players
                    .sort((a: any, b: any) => b.score - a.score)
                    .map((p: any, idx: number) => (
                      <div key={p.id} className="flex justify-between items-center py-1.5 text-sm font-bold text-black border-b border-black/5 last:border-none">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#4F9DA6] w-4">#{idx + 1}</span>
                          <span className="font-black text-black">{p.name}</span>
                        </div>
                        <span className="font-mono text-black font-black text-sm">{p.score} pt</span>
                      </div>
                    ))}
                </div>
              ) : vPlayer1Item ? (
                // 2 Player Local Versus Mode Summary
                <div className="space-y-4">
                  <div className="flex justify-around items-center">
                    <div className="text-center p-3 rounded-xl bg-[#FF8E9E]/10 border-2 border-black w-[42%] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-xs text-black font-black uppercase tracking-wide">{t.p1}</p>
                      <p className="text-2xl font-black text-black mt-1">{vPlayer1Score}</p>
                    </div>
                    <div className="text-xl font-black text-black">VS</div>
                    <div className="text-center p-3 rounded-xl bg-[#4F9DA6]/10 border-2 border-black w-[42%] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-xs text-black font-black uppercase tracking-wide">{t.p2}</p>
                      <p className="text-2xl font-black text-black mt-1">{vPlayer2Score}</p>
                    </div>
                  </div>

                  <div className="text-sm font-black text-black">
                    {vPlayer1Score > vPlayer2Score ? (
                      <span className="text-[#FF8E9E]">🎉 {lang === "en" ? "Player 1 Wins!" : "اللاعب الأول فاز!"}</span>
                    ) : vPlayer2Score > vPlayer1Score ? (
                      <span className="text-[#4F9DA6]">🎉 {lang === "en" ? "Player 2 Wins!" : "اللاعب الثاني فاز!"}</span>
                    ) : (
                      <span className="text-black/60">🤝 {lang === "en" ? "It's a Tie!" : "تعادل رائع!"}</span>
                    )}
                  </div>
                </div>
              ) : (
                // Single Player Forehead Mode Summary
                <div>
                  <p className="text-xs font-black text-black/50 uppercase tracking-wide">{t.score}</p>
                  <p className="text-5xl font-black text-[#4F9DA6] my-1">{foreheadScore}</p>
                  <p className="text-[10px] text-black/70 font-black uppercase tracking-wide">
                    {lang === "en" ? `Guessed ${foreheadHistory.filter(h => h.guessed).length} of ${foreheadHistory.length} cards` : `تم تخمين ${foreheadHistory.filter(h => h.guessed).length} من أصل ${foreheadHistory.length} بطاقة`}
                  </p>
                </div>
              )}
            </div>

            {/* Recapped Cards History Grid */}
            {(!roomState && foreheadHistory.length > 0) && (
              <div className="mb-6 text-left rtl:text-right">
                <p className="text-xs font-black text-black mb-2 uppercase tracking-wide">
                  📋 {lang === "en" ? "Review Cards" : "مراجعة الكلمات"}
                </p>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto custom-scroll p-1.5 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {foreheadHistory.map((h, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between border-2 border-black font-black ${
                        h.guessed 
                          ? "bg-[#4F9DA6]/15 text-black" 
                          : "bg-[#FF8E9E]/15 text-black"
                      }`}
                    >
                      <span className="truncate max-w-[80px]">
                        {h.item.emoji} {lang === "en" ? h.item.nameEn : h.item.nameAr}
                      </span>
                      <span className="font-black text-sm">{h.guessed ? "✓" : "✗"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options to play again or return */}
            <div className="space-y-3">
              {roomState ? (
                // Multi-device host restart
                roomState.hostId === playerId ? (
                  <button
                    onClick={handleOnlineResetLobby}
                    className="w-full py-3.5 bg-[#4F9DA6] border-4 border-black rounded-2xl text-black font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase"
                  >
                    🔄 {t.playAgain}
                  </button>
                ) : (
                  <div className="text-xs text-[#2D3436]/70 font-black p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide">
                    {lang === "en" ? "Waiting for Host to restart..." : "بانتظار المستضيف لإعادة التشغيل..."}
                  </div>
                )
              ) : vPlayer1Item ? (
                // Local versus play again
                <button
                  onClick={startVersusGame}
                  className="w-full py-3.5 bg-[#4F9DA6] border-4 border-black rounded-2xl text-black font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase"
                >
                  ⚔️ {t.playAgain}
                </button>
              ) : (
                // Local forehead play again
                <button
                  onClick={startForeheadGame}
                  className="w-full py-3.5 bg-[#4F9DA6] border-4 border-black rounded-2xl text-black font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase"
                >
                  👑 {t.playAgain}
                </button>
              )}

              <button
                onClick={() => {
                  if (roomState) {
                    handleLeaveOnlineRoom();
                  } else {
                    setScreen("HOME");
                  }
                }}
                className="w-full py-3.5 bg-white border-4 border-black rounded-2xl text-black font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase"
              >
                🚪 {lang === "en" ? "Back to Main Menu" : "العودة للقائمة الرئيسية"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
