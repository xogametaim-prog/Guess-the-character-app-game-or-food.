// Ambient Synthesizer using Web Audio API for a relaxing offline-friendly background loop
export class AmbientSynthesizer {
  private ctx: AudioContext | null = null;
  private nodes: { oscs: OscillatorNode[]; gain: GainNode }[] = [];
  private intervalId: any = null;
  private currentChordIdx = 0;
  private isPlaying = false;

  private chords = [
    [130.81, 196.00, 329.63, 493.88], // Cmaj7: C3, G3, E4, B4
    [110.00, 164.81, 261.63, 392.00], // Am7: A2, E3, C4, G4
    [87.31, 130.81, 220.00, 349.23],  // Fmaj7: F2, C3, A3, E4
    [98.00, 146.83, 246.94, 392.00]   // G6: G2, D3, B3, G4
  ];

  start() {
    if (this.isPlaying) return;
    try {
      this.isPlaying = true;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.playChord();
      this.intervalId = setInterval(() => {
        if (!this.isPlaying) return;
        this.currentChordIdx = (this.currentChordIdx + 1) % this.chords.length;
        this.playChord();
      }, 6000);
    } catch (e) {
      console.error("AmbientSynthesizer failed to start:", e);
    }
  }

  private playChord() {
    if (!this.ctx) return;
    
    // Resume context if suspended (common browser security constraint)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const notes = this.chords[this.currentChordIdx];

    // Fade out previous chord nodes slowly
    const fadeOutTime = 2.0;
    this.nodes.forEach(({ oscs, gain }) => {
      try {
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + fadeOutTime);
        setTimeout(() => {
          oscs.forEach(o => { try { o.stop(); } catch(err){} });
        }, fadeOutTime * 1000);
      } catch(e) {}
    });
    this.nodes = [];

    // Create new chord notes
    const oscs: OscillatorNode[] = [];
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    
    // Smooth attack over 2 seconds
    masterGain.gain.linearRampToValueAtTime(0.03, now + 2.0);
    masterGain.connect(this.ctx.destination);

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      
      // Warm tones: Sine for low base notes, triangle for higher notes
      osc.type = idx < 2 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      
      // Rich chorus: Add slight random detuning
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

      osc.connect(masterGain);
      osc.start(now);
      oscs.push(osc);
    });

    this.nodes.push({ oscs, gain: masterGain });
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    const fadeOut = 0.8;
    const now = this.ctx?.currentTime || 0;
    this.nodes.forEach(({ oscs, gain }) => {
      try {
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + fadeOut);
        setTimeout(() => {
          oscs.forEach(o => { try { o.stop(); } catch(err){} });
        }, fadeOut * 1000);
      } catch(e) {}
    });
    this.nodes = [];
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
