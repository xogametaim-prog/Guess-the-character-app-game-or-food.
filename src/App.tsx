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
  Settings,
  Sun,
  Moon,
  Music
} from "lucide-react";
import { CATEGORIES, Category, GameItem } from "./data/categories.js";
import { TRANSLATIONS, Translations } from "./data/translations.js";
import { AmbientSynthesizer } from "./utils/music.js";

// Synthesized sound feedback engine using Web Audio API
function playAudioTone(type: "correct" | "pass" | "countdown" | "gameover" | "hint") {
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
    } else if (type === "hint") {
      // Sparkling rising notes for hint reveal
      osc.type = "sine";
      osc.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
      osc.frequency.setValueAtTime(493.88, ctx.currentTime + 0.08); // B4
      osc.frequency.setValueAtTime(587.33, ctx.currentTime + 0.16); // D5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

// Provide haptic vibration feedback for supported devices
function triggerHapticFeedback(type: "correct" | "pass" | "hint") {
  if (typeof window !== "undefined" && window.navigator && typeof window.navigator.vibrate === "function") {
    try {
      if (type === "correct") {
        window.navigator.vibrate([80, 50, 80]);
      } else if (type === "pass") {
        window.navigator.vibrate(150);
      } else if (type === "hint") {
        window.navigator.vibrate(50);
      }
    } catch (e) {
      // Fail silently
    }
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

// Confetti simulation using pure motion.div particles
function ConfettiOverlay() {
  const colors = ["#FFD93D", "#FF8E9E", "#4F9DA6", "#FF5252", "#9C27B0", "#FF7043", "#3F51B5", "#009688"];
  const particles = Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100, // percentage of screen width
    y: -20 - Math.random() * 50, // initial top offset
    size: Math.random() * 12 + 8, // size in px
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 1.5, // staggered delays
    duration: Math.random() * 2.5 + 2, // drop duration
    rotate: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            x: `${p.x}vw`, 
            y: `${p.y}vh`, 
            rotate: p.rotate,
            opacity: 1 
          }}
          animate={{ 
            y: "110vh", 
            x: `${p.x + (Math.random() * 20 - 10)}vw`,
            rotate: p.rotate + 720,
            opacity: 0
          }}
          transition={{ 
            duration: p.duration, 
            delay: p.delay,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: Math.random() * 2
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  // Config & Localization
  const [lang, setLang] = useState<"en" | "ar">("ar"); // Default to Arabic as requested, or can toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tiltEnabled, setTiltEnabled] = useState(false); // Default false for iframe/universal compatibility
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [gameMode, setGameMode] = useState<"classic" | "timed">("classic");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [customCode, setCustomCode] = useState<string>("");

  const t: Translations = TRANSLATIONS[lang];
  const isRtl = lang === "ar";
  const isDark = theme === "dark";

  // Ambient Synthesizer Ref
  const synthRef = useRef<AmbientSynthesizer | null>(null);

  // Background music effect
  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new AmbientSynthesizer();
    }
    if (musicEnabled) {
      synthRef.current.start();
    } else {
      synthRef.current.stop();
    }
  }, [musicEnabled]);

  // Clean up synthesizer on fully unmounting
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  const getHintLimit = () => {
    if (difficulty === "easy") return 3;
    if (difficulty === "hard") return 1;
    return 2; // medium
  };

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

  // Hints display per-card in Versus Mode
  const [vP1HintRevealed, setVP1HintRevealed] = useState(false);
  const [vP2HintRevealed, setVP2HintRevealed] = useState(false);
  const [vP1HintsUsed, setVP1HintsUsed] = useState<number>(0);
  const [vP2HintsUsed, setVP2HintsUsed] = useState<number>(0);
  const [foreheadHintRevealed, setForeheadHintRevealed] = useState(false);

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

  // Helper to trigger audio and haptic feedback
  const triggerAudio = (type: "correct" | "pass" | "countdown" | "gameover" | "hint") => {
    if (soundEnabled) playAudioTone(type);
    if (type === "correct" || type === "pass" || type === "hint") {
      triggerHapticFeedback(type);
    }
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
    setHintsUsed(0);
    setForeheadHintRevealed(false);
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
    if (gameMode === "classic") return; // No timer in Classic Mode
    if (secondsLeft > 0) {
      const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Time's Up
      triggerAudio("gameover");
      setScreen("SUMMARY");
    }
  }, [secondsLeft, screen, gameMode]);

  // Handle Forehead Tap / Tilt Action
  const handleForeheadAction = (isCorrect: boolean) => {
    const currentItem = foreheadItems[foreheadIndex];
    if (!currentItem) return;

    if (isCorrect) {
      triggerAudio("correct");
      setForeheadScore((prev) => prev + 10);
    } else {
      triggerAudio("pass");
      setForeheadScore((prev) => Math.max(0, prev - 5));
    }

    setForeheadHistory((prev) => [...prev, { item: currentItem, guessed: isCorrect }]);
    setForeheadHintRevealed(false); // Reset hint for next card

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
    setHintsUsed(0);
    setVP1HintsUsed(0);
    setVP2HintsUsed(0);
    setVP1HintRevealed(false);
    setVP2HintRevealed(false);
    setScreen("VERSUS_GAME");
  };

  // Versus mode clock
  useEffect(() => {
    if (screen !== "VERSUS_GAME" || !vRevealed) return;
    if (gameMode === "classic") return; // No timer in Classic Mode
    if (vSecondsLeft > 0) {
      const timer = setTimeout(() => setVSecondsLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      triggerAudio("gameover");
      setScreen("SUMMARY");
    }
  }, [vSecondsLeft, screen, vRevealed, gameMode]);

  // Handle Versus Action
  const handleVersusAction = (targetPlayer: 1 | 2, isCorrect: boolean) => {
    const items = [...activeCategory.items].sort(() => Math.random() - 0.5);

    if (targetPlayer === 1) {
      if (isCorrect) {
        triggerAudio("correct");
        setVPlayer1Score((prev) => prev + 10);
      } else {
        triggerAudio("pass");
        setVPlayer1Score((prev) => Math.max(0, prev - 5));
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
      setVP1HintRevealed(false); // Reset hint for next card
    } else {
      if (isCorrect) {
        triggerAudio("correct");
        setVPlayer2Score((prev) => prev + 10);
      } else {
        triggerAudio("pass");
        setVPlayer2Score((prev) => Math.max(0, prev - 5));
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
      setVP2HintRevealed(false); // Reset hint for next card
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
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-300 ${isDark ? "bg-[#1E1B29] text-white" : "bg-[#FFD93D] text-[#2D3436]"} ${isRtl ? "rtl arabic-font" : "ltr"}`}>
      {/* Background Ambience Pattern matching Artistic Flair */}
      <div className={`absolute inset-0 z-0 transition-colors duration-300 ${isDark ? "bg-[#14121F]" : "bg-[#FFD93D]"}`}></div>
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 opacity-20 z-0 pointer-events-none transition-colors duration-300 ${isDark ? "bg-[#9C27B0]" : "bg-[#FF8E9E]"}`}></div>
      <div className={`absolute bottom-0 left-0 w-80 h-80 rounded-full -ml-40 -mb-40 opacity-20 z-0 pointer-events-none transition-colors duration-300 ${isDark ? "bg-[#00E5FF]" : "bg-[#4F9DA6]"}`}></div>

      {/* Celebratory confetti overlay on game win */}
      {screen === "SUMMARY" && (vPlayer1Item ? (vPlayer1Score !== vPlayer2Score) : (foreheadScore > 0)) && (
        <ConfettiOverlay />
      )}

      {/* Header Utilities */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-20">
        <div className="flex gap-2 flex-wrap">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs font-black ${
              isDark 
                ? "bg-[#2D2A3A] border-white text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:bg-[#3A374A]" 
                : "bg-white border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-[#4F9DA6]" />
            <span>{t.selectLanguage}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            className={`p-1.5 rounded-full border-2 transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
              isDark 
                ? "bg-[#2D2A3A] border-white text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:bg-[#3A374A] active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]" 
                : "bg-white border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            }`}
            title={t.theme}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-[#FFD93D]" />
            ) : (
              <Moon className="h-4 w-4 text-[#4F9DA6]" />
            )}
          </button>

          {/* Music Toggle */}
          <button
            onClick={() => setMusicEnabled((p) => !p)}
            className={`p-1.5 rounded-full border-2 transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
              isDark 
                ? "bg-[#2D2A3A] border-white text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:bg-[#3A374A] active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]" 
                : "bg-white border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            }`}
            title={musicEnabled ? t.musicOn : t.musicOff}
          >
            <Music className={`h-4 w-4 ${musicEnabled ? "text-[#4F9DA6] animate-pulse" : "text-[#FF8E9E]"}`} />
          </button>

          {/* Sound Effect Toggle */}
          <button
            onClick={() => setSoundEnabled((p) => !p)}
            className={`p-1.5 rounded-full border-2 transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
              isDark 
                ? "bg-[#2D2A3A] border-white text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:bg-[#3A374A] active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]" 
                : "bg-white border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            }`}
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 font-black text-xs transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
              isDark 
                ? "bg-[#2D2A3A] border-white text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:bg-[#3A374A] active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]" 
                : "bg-white border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <ArrowLeft className={`h-3.5 w-3.5 ${isDark ? "text-white" : "text-black"} ${isRtl ? "rotate-180" : ""}`} />
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
            className={`w-full max-w-md text-center z-10 flex flex-col items-center p-8 rounded-3xl relative transition-all duration-300 ${
              isDark 
                ? "bg-[#252233] border-4 border-white text-white shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]" 
                : "bg-white border-4 border-black text-[#2D3436] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            }`}
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

            <h1 className={`text-4xl font-black uppercase tracking-tighter leading-none font-display ${isDark ? "text-white" : "text-black"}`}>
              {t.title}
            </h1>
            <p className={`text-base font-bold tracking-wider mt-1.5 ${isDark ? "text-white/80" : "text-[#2D3436] opacity-70"}`}>
              {t.subtitle}
            </p>

            <p className={`text-xs font-semibold mt-4 leading-relaxed max-w-xs ${isDark ? "text-white/60" : "text-[#2D3436]/60"}`}>
              {t.tagline}
            </p>

            {/* Offline play trigger */}
            <div className="w-full space-y-4 mt-8">
              <button
                onClick={() => setScreen("OFFLINE_MODE_SELECT")}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-black transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group border-4 ${
                  isDark
                    ? "bg-[#FFD93D] text-black border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                    : "bg-[#FFD93D] text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
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
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-black transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group border-4 ${
                  isDark
                    ? "bg-[#4F9DA6] text-black border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                    : "bg-[#4F9DA6] text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
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
              className={`mt-6 flex items-center gap-1.5 text-xs font-bold underline hover:opacity-80 transition cursor-pointer ${isDark ? "text-white" : "text-black"}`}
            >
              <Info className="h-3.5 w-3.5" />
              <span>{t.howToPlay}</span>
            </button>

            {/* Version & Team Credits Footer */}
            <div className={`mt-8 pt-4 border-t border-dashed w-full flex flex-col items-center gap-1 ${isDark ? "border-white/10" : "border-black/10"}`}>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isDark ? "bg-white/15 text-white/90" : "bg-black/5 text-black/70"}`}>
                Version 1
              </span>
              <p className={`text-[10px] font-black tracking-wider uppercase mt-1 text-center ${isDark ? "text-white/60" : "text-black/50"}`}>
                {t.credits}
              </p>
              <p className={`text-[10px] font-black uppercase tracking-wide ${isDark ? "text-[#00E5FF]" : "text-[#4F9DA6]"}`}>
                {t.leader}
              </p>
            </div>
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
            className={`w-full max-w-md p-8 rounded-3xl relative transition-all duration-300 ${
              isDark 
                ? "bg-[#252233] border-4 border-white text-white shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]" 
                : "bg-white border-4 border-black text-[#2D3436] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <h2 className={`text-2xl font-black mb-1 text-center uppercase tracking-tight font-display ${isDark ? "text-white" : "text-black"}`}>
              {t.singleDeviceModes}
            </h2>
            <p className={`text-xs font-bold text-center mb-6 ${isDark ? "text-white/70" : "text-[#2D3436]/70"}`}>
              {lang === "en" ? "No internet needed, pass the phone!" : "العب محلياً بدون إنترنت على جهاز واحد!"}
            </p>

            <div className="space-y-4">
              {/* Forehead Mode Card */}
              <button
                onClick={() => {
                  setScreen("CATEGORY_SELECT");
                }}
                className={`w-full p-5 rounded-2xl text-left rtl:text-right transition-all cursor-pointer border-4 group ${
                  isDark
                    ? "bg-[#FFD93D] text-black border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                    : "bg-[#FFD93D] text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(2px,2px,2px,1)]"
                }`}
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
                className={`w-full p-5 rounded-2xl text-left rtl:text-right transition-all cursor-pointer border-4 group ${
                  isDark
                    ? "bg-[#4F9DA6] text-black border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                    : "bg-[#4F9DA6] text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
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
            className={`w-full max-w-md p-8 rounded-3xl relative transition-all duration-300 ${
              isDark 
                ? "bg-[#252233] border-4 border-white text-white shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]" 
                : "bg-white border-4 border-black text-[#2D3436] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <h2 className={`text-3xl font-black mb-1 text-center uppercase tracking-tight font-display ${isDark ? "text-white" : "text-black"}`}>
              {t.selectCategory}
            </h2>
            <p className={`text-xs font-bold text-center mb-6 ${isDark ? "text-white/70" : "text-[#2D3436]/70"}`}>
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
                    className={`w-full flex items-center justify-between p-4 rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-200 border-4 ${
                      isSelected
                        ? (isDark 
                            ? "bg-[#FFD93D] text-black border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]" 
                            : "bg-[#FFD93D] text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]")
                        : (isDark 
                            ? "bg-[#2D2A3A] border-white text-white hover:bg-[#3A374A]" 
                            : "bg-white border-black text-[#2D3436] hover:bg-gray-50")
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 bg-white border-2 border-black rounded-xl">{cat.icon}</span>
                      <div className="text-left rtl:text-right">
                        <p className={`font-black text-sm uppercase ${isSelected ? "text-black" : (isDark ? "text-white" : "text-black")}`}>
                          {lang === "en" ? cat.nameEn : cat.nameAr}
                        </p>
                        <p className={`text-[10px] font-bold ${isSelected ? "text-[#2D3436]/70" : (isDark ? "text-white/60" : "text-[#2D3436]/70")}`}>
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

            {/* Game Settings box */}
            <div className={`mt-6 p-4 rounded-2xl border-2 transition-all duration-300 ${isDark ? "bg-white/5 border-white/20" : "bg-[#4F9DA6]/10 border-black"}`}>
              {/* Game Mode */}
              <div className="mb-4">
                <span className={`text-xs font-black flex items-center justify-between mb-2 uppercase tracking-wide ${isDark ? "text-white" : "text-black"}`}>
                  <span>🎮 {lang === "en" ? "Game Mode" : "نمط اللعبة"}</span>
                  <span className="text-[10px] uppercase font-black opacity-80">{gameMode === "classic" ? (lang === "en" ? "Classic" : "كلاسيكي") : (lang === "en" ? "Timed" : "مؤقت")}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGameMode("classic")}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 ${
                      gameMode === "classic"
                        ? (isDark ? "bg-white border-white text-black" : "bg-black border-black text-white")
                        : (isDark ? "bg-transparent border-white/20 text-white hover:bg-white/10" : "bg-white border-black text-black hover:bg-gray-100")
                    }`}
                  >
                    {lang === "en" ? "Classic" : "كلاسيكي"}
                  </button>
                  <button
                    onClick={() => setGameMode("timed")}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 ${
                      gameMode === "timed"
                        ? (isDark ? "bg-white border-white text-black" : "bg-black border-black text-white")
                        : (isDark ? "bg-transparent border-white/20 text-white hover:bg-white/10" : "bg-white border-black text-black hover:bg-gray-100")
                    }`}
                  >
                    {lang === "en" ? "Timed" : "مؤقت"}
                  </button>
                </div>
              </div>

              {/* Timer selection (only shown if gameMode is timed) */}
              <AnimatePresence>
                {gameMode === "timed" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <label className={`text-xs font-black flex items-center justify-between mb-2 uppercase tracking-wide ${isDark ? "text-white" : "text-black"}`}>
                      <span>⏱️ {lang === "en" ? "Round Duration" : "مدة الجولة"}</span>
                      <span className="font-black text-xs">{timerDuration} {t.sec}</span>
                    </label>
                    <div className="flex gap-2">
                      {[30, 60, 90, 120].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setTimerDuration(sec)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 ${
                            timerDuration === sec
                              ? (isDark ? "bg-white border-white text-black" : "bg-black border-black text-white")
                              : (isDark ? "bg-transparent border-white/20 text-white hover:bg-white/10" : "bg-white border-black text-black hover:bg-gray-100")
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Difficulty Selection (affects clues count) */}
              <div className="mb-4">
                <span className={`text-xs font-black flex items-center justify-between mb-2 uppercase tracking-wide ${isDark ? "text-white" : "text-black"}`}>
                  <span>🧠 {lang === "en" ? "Difficulty" : "الصعوبة (التلميحات)"}</span>
                  <span className="text-[10px] uppercase font-black opacity-80">
                    {difficulty === "easy" && (lang === "en" ? "Easy (3 hints)" : "سهل (3 تلميحات)")}
                    {difficulty === "medium" && (lang === "en" ? "Medium (2 hints)" : "متوسط (تلميحان)")}
                    {difficulty === "hard" && (lang === "en" ? "Hard (1 hint)" : "صعب (تلميح واحد)")}
                  </span>
                </span>
                <div className="flex gap-2">
                  {(["easy", "medium", "hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 ${
                        difficulty === diff
                          ? (isDark ? "bg-white border-white text-black" : "bg-black border-black text-white")
                          : (isDark ? "bg-transparent border-white/20 text-white hover:bg-white/10" : "bg-white border-black text-black hover:bg-gray-100")
                      }`}
                    >
                      {diff === "easy" && (lang === "en" ? "Easy" : "سهل")}
                      {diff === "medium" && (lang === "en" ? "Medium" : "متوسط")}
                      {diff === "hard" && (lang === "en" ? "Hard" : "صعب")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Forehead Mode-specific: Tilt setting toggle */}
              <div className={`flex items-center justify-between border-t-2 pt-3 ${isDark ? "border-white/10" : "border-black/10"}`}>
                <span className={`text-xs font-black uppercase tracking-tight ${isDark ? "text-white" : "text-black"}`}>🔄 {t.tiltCalibration}</span>
                <button
                  onClick={() => setTiltEnabled((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border-2 ${
                    tiltEnabled 
                      ? (isDark ? "bg-white border-white text-black" : "bg-black border-black text-white")
                      : (isDark ? "bg-transparent border-white/20 text-white hover:bg-white/10" : "bg-white border-black text-black hover:bg-gray-100")
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
                className={`flex-1 py-3.5 rounded-2xl text-black font-black text-sm transition-all cursor-pointer uppercase tracking-tight border-4 ${
                  isDark
                    ? "bg-[#FF8E9E] border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                    : "bg-[#FF8E9E] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                👑 {t.foreheadMode}
              </button>
              <button
                onClick={() => startVersusGame()}
                className={`flex-1 py-3.5 rounded-2xl text-black font-black text-sm transition-all cursor-pointer uppercase tracking-tight border-4 ${
                  isDark
                    ? "bg-[#4F9DA6] border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                    : "bg-[#4F9DA6] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
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

                  {/* Gigantic Card Emoji or Image */}
                  {foreheadItems[foreheadIndex].imageUrl ? (
                    <img 
                      src={foreheadItems[foreheadIndex].imageUrl}
                      alt={lang === "en" ? foreheadItems[foreheadIndex].nameEn : foreheadItems[foreheadIndex].nameAr}
                      referrerPolicy="no-referrer"
                      className="w-28 h-28 md:w-32 md:h-32 object-cover rounded-2xl border-4 border-black mb-4 relative z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                  ) : (
                    <span className="text-9xl mb-4 relative z-10 filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                      {foreheadItems[foreheadIndex].emoji}
                    </span>
                  )}

                  {/* Card Name */}
                  <h2 className="text-5xl md:text-6xl font-black text-black relative z-10 tracking-tight uppercase leading-none select-none">
                    {lang === "en" 
                      ? foreheadItems[foreheadIndex].nameEn 
                      : foreheadItems[foreheadIndex].nameAr}
                  </h2>

                  {/* Clue/Hint for friends */}
                  {(() => {
                    const foreheadHintsLeft = Math.max(0, getHintLimit() - hintsUsed);
                    return (
                      <div className="mt-4 relative z-10 w-full max-w-xs flex flex-col items-center">
                        {foreheadHintRevealed ? (
                          <div className="w-full px-4 py-2 bg-[#FF8E9E]/15 border-2 border-black rounded-xl text-center">
                            <p className="text-[10px] text-black font-black uppercase tracking-wider">💡 {t.hintUsed}</p>
                            <p className="text-xs text-black font-bold mt-0.5">
                              {lang === "en" 
                                ? foreheadItems[foreheadIndex].hintEn 
                                : foreheadItems[foreheadIndex].hintAr}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (foreheadHintsLeft > 0) {
                                setHintsUsed((prev) => prev + 1);
                                setForeheadHintRevealed(true);
                                triggerAudio("hint");
                              }
                            }}
                            disabled={foreheadHintsLeft <= 0}
                            className={`w-full py-2 px-4 rounded-xl border-2 border-black text-[11px] font-black uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none ${
                              foreheadHintsLeft > 0 
                                ? "bg-[#FFD93D] text-black hover:bg-[#ffe169] cursor-pointer" 
                                : "bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                            }`}
                          >
                            💡 {foreheadHintsLeft > 0 
                              ? `${t.hint} (${foreheadHintsLeft} ${lang === "en" ? "left" : "متبقي"})` 
                              : t.noHintsLeft}
                          </button>
                        )}
                      </div>
                    );
                  })()}
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
                <div className="flex items-center gap-2">
                  {/* Player 1 Hint Button (Reveals hint for P1's card, which is shown on P2's screen!) */}
                  {vRevealed && !vP1HintRevealed && (
                    <button
                      onClick={() => {
                        const p1HintsLeft = Math.max(0, getHintLimit() - vP1HintsUsed);
                        if (p1HintsLeft > 0) {
                          setVP1HintsUsed((prev) => prev + 1);
                          setVP1HintRevealed(true);
                          triggerAudio("hint");
                        }
                      }}
                      disabled={Math.max(0, getHintLimit() - vP1HintsUsed) <= 0}
                      className="px-2.5 py-1 bg-[#FFD93D] hover:bg-[#ffe169] disabled:bg-gray-100 disabled:text-gray-400 border-2 border-black rounded-lg text-[10px] font-black uppercase transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                    >
                      💡 {Math.max(0, getHintLimit() - vP1HintsUsed) > 0 
                        ? `${t.hint} (${Math.max(0, getHintLimit() - vP1HintsUsed)})` 
                        : "No hints"}
                    </button>
                  )}
                  <span className="text-xs font-black text-black bg-white px-2.5 py-1 rounded-lg border-2 border-black uppercase tracking-wider font-mono">
                    {t.score}: <span className="text-[#4F9DA6] text-sm font-black">{vPlayer1Score}</span>
                  </span>
                </div>
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
                    {vPlayer2Item?.imageUrl ? (
                      <img 
                        src={vPlayer2Item.imageUrl}
                        alt={lang === "en" ? vPlayer2Item.nameEn : vPlayer2Item.nameAr}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 object-cover mx-auto rounded-xl border-2 border-black mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    ) : (
                      <span className="text-5xl block filter drop-shadow-md mb-2">
                        {vPlayer2Item?.emoji}
                      </span>
                    )}
                    <h4 className="text-xl font-black text-black uppercase">
                      {lang === "en" ? vPlayer2Item?.nameEn : vPlayer2Item?.nameAr}
                    </h4>
                    <p className="text-[10px] text-black/70 font-bold uppercase mt-1">{t.p2} {lang === "en" ? "card" : "بطاقة"}</p>
                    
                    {/* Display Player 2's hint here on Player 1's screen so Player 1 can read it */}
                    {vP2HintRevealed && (
                      <div className="mt-2 p-1.5 bg-[#4F9DA6]/15 border-2 border-[#4F9DA6]/30 rounded-xl">
                        <p className="text-[10px] text-black font-bold uppercase">💡 {t.hint}: {lang === "en" ? vPlayer2Item?.hintEn : vPlayer2Item?.hintAr}</p>
                      </div>
                    )}
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
                <div className="flex items-center gap-2">
                  {/* Player 2 Hint Button (Reveals hint for P2's card, which is shown on P1's screen!) */}
                  {vRevealed && !vP2HintRevealed && (
                    <button
                      onClick={() => {
                        const p2HintsLeft = Math.max(0, getHintLimit() - vP2HintsUsed);
                        if (p2HintsLeft > 0) {
                          setVP2HintsUsed((prev) => prev + 1);
                          setVP2HintRevealed(true);
                          triggerAudio("hint");
                        }
                      }}
                      disabled={Math.max(0, getHintLimit() - vP2HintsUsed) <= 0}
                      className="px-2.5 py-1 bg-[#FFD93D] hover:bg-[#ffe169] disabled:bg-gray-100 disabled:text-gray-400 border-2 border-black rounded-lg text-[10px] font-black uppercase transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                    >
                      💡 {Math.max(0, getHintLimit() - vP2HintsUsed) > 0 
                        ? `${t.hint} (${Math.max(0, getHintLimit() - vP2HintsUsed)})` 
                        : "No hints"}
                    </button>
                  )}
                  <span className="text-xs font-black text-black bg-white px-2.5 py-1 rounded-lg border-2 border-black uppercase tracking-wider font-mono">
                    {t.score}: <span className="text-[#4F9DA6] text-sm font-black">{vPlayer2Score}</span>
                  </span>
                </div>
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
                    {vPlayer1Item?.imageUrl ? (
                      <img 
                        src={vPlayer1Item.imageUrl}
                        alt={lang === "en" ? vPlayer1Item.nameEn : vPlayer1Item.nameAr}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 object-cover mx-auto rounded-xl border-2 border-black mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    ) : (
                      <span className="text-5xl block filter drop-shadow-md mb-2">
                        {vPlayer1Item?.emoji}
                      </span>
                    )}
                    <h4 className="text-xl font-black text-black uppercase">
                      {lang === "en" ? vPlayer1Item?.nameEn : vPlayer1Item?.nameAr}
                    </h4>
                    <p className="text-[10px] text-black/70 font-bold uppercase mt-1">{t.p1} {lang === "en" ? "card" : "بطاقة"}</p>
                    
                    {/* Display Player 1's hint here on Player 2's screen so Player 2 can read it */}
                    {vP1HintRevealed && (
                      <div className="mt-2 p-1.5 bg-[#FF8E9E]/15 border-2 border-[#FF8E9E]/30 rounded-xl">
                        <p className="text-[10px] text-black font-bold uppercase">💡 {t.hint}: {lang === "en" ? vPlayer1Item?.hintEn : vPlayer1Item?.hintAr}</p>
                      </div>
                    )}
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
                      {myItem.imageUrl ? (
                        <img 
                          src={myItem.imageUrl}
                          alt={lang === "en" ? myItem.nameEn : myItem.nameAr}
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl border-2 border-black mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        />
                      ) : (
                        <span className="text-8xl md:text-9xl my-2 filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                          {myItem.emoji}
                        </span>
                      )}
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
                                {otherItem.imageUrl ? (
                                  <img 
                                    src={otherItem.imageUrl}
                                    alt={lang === "en" ? otherItem.nameEn : otherItem.nameAr}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 object-cover rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                  />
                                ) : (
                                  <span className="text-2xl">{otherItem.emoji}</span>
                                )}
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
