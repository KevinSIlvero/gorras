class SoundService {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      // Lazy init to handle browser autoplay policies
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      } catch (e) {
        console.error('AudioContext not supported', e);
      }
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private ensureContext() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public playPop() {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  public playMiss() {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  public playGameEnd() {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.setValueAtTime(554, now + 0.1); // C#
    oscillator.frequency.setValueAtTime(659, now + 0.2); // E

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.6);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(now + 0.6);
  }
}

export const soundService = new SoundService();