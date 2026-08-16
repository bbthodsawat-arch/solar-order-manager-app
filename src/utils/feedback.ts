import { toast } from 'react-hot-toast';

// Web Audio API Synthesizer for Crisp UI Micro-Reactions
class SoundFeedback {
  private audioCtx: AudioContext | null = null;

  private getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    return this.audioCtx;
  }

  click() {
    try {
      const ctx = this.getContext(); if (!ctx) return;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.04);
    } catch (_) {}
  }

  success() {
    try {
      const ctx = this.getContext(); if (!ctx) return;
      const now = ctx.currentTime; const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.07); osc.frequency.setValueAtTime(783.99, now + 0.14);
      gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.3);
    } catch (_) {}
  }

  cashRegister() {
    try {
      const ctx = this.getContext(); if (!ctx) return;
      const now = ctx.currentTime;
      [659.25, 880, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); const start = now + idx * 0.05;
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, start); gain.gain.setValueAtTime(0.12, start); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(start); osc.stop(start + 0.2);
      });
    } catch (_) {}
  }

  delete() {
    try {
      const ctx = this.getContext(); if (!ctx) return;
      const now = ctx.currentTime; const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(350, now); osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.08);
    } catch (_) {}
  }

  warning() {
    try {
      const ctx = this.getContext(); if (!ctx) return;
      const now = ctx.currentTime; const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.setValueAtTime(300, now); gain.gain.setValueAtTime(0.06, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.15);
    } catch (_) {}
  }
}

const soundEngine = new SoundFeedback();

// Backward-compatible callable facade: existing code can use soundFeedback('success')
// while newer code can continue using soundFeedback.success(), etc.
export const soundFeedback = Object.assign(
  (type: 'success' | 'error' | 'info' | 'warning' | 'cash' | 'delete') => {
    if (type === 'success') soundEngine.success();
    else if (type === 'cash') soundEngine.cashRegister();
    else if (type === 'error' || type === 'warning') soundEngine.warning();
    else if (type === 'delete') soundEngine.delete();
    else soundEngine.click();
  },
  soundEngine
);

export function notifyReaction(type: 'success' | 'error' | 'info' | 'warning' | 'cash' | 'delete', message: string, options?: any) {
  if (type === 'success') { soundEngine.success(); toast.success(message, options); }
  else if (type === 'cash') { soundEngine.cashRegister(); toast.success(message, { ...options, icon: '💰' }); }
  else if (type === 'error') { soundEngine.warning(); toast.error(message, options); }
  else if (type === 'warning') { soundEngine.warning(); toast(message, { ...options, icon: '⚠️' }); }
  else if (type === 'delete') { soundEngine.delete(); toast(message, { ...options, icon: '🗑️' }); }
  else { soundEngine.click(); toast(message, options); }
}
