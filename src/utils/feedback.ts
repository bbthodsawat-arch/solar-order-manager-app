import { toast, ToastOptions } from 'react-hot-toast';

type SoundType = 'success' | 'error' | 'info' | 'warning' | 'cash' | 'delete';

type FeedbackOptions = ToastOptions & {
  vibrate?: boolean;
};

class SoundFeedback {
  private audioCtx: AudioContext | null = null;
  private getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx?.state === 'suspended') void this.audioCtx.resume();
    return this.audioCtx;
  }
  click() { try { const ctx=this.getContext(); if(!ctx)return; const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type='sine'; osc.frequency.setValueAtTime(600,ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(200,ctx.currentTime+.04); gain.gain.setValueAtTime(.08,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.04); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+.04); } catch {} }
  success() { try { const ctx=this.getContext(); if(!ctx)return; const now=ctx.currentTime; const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type='triangle'; osc.frequency.setValueAtTime(523.25,now); osc.frequency.setValueAtTime(659.25,now+.07); osc.frequency.setValueAtTime(783.99,now+.14); gain.gain.setValueAtTime(.12,now); gain.gain.exponentialRampToValueAtTime(.001,now+.3); osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now+.3); } catch {} }
  cashRegister() { try { const ctx=this.getContext(); if(!ctx)return; const now=ctx.currentTime; [659.25,880,1046.5].forEach((freq,idx)=>{const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,now+idx*.05);gain.gain.setValueAtTime(.12,now+idx*.05);gain.gain.exponentialRampToValueAtTime(.001,now+idx*.05+.2);osc.connect(gain);gain.connect(ctx.destination);osc.start(now+idx*.05);osc.stop(now+idx*.05+.2);}); } catch {} }
  delete() { try { const ctx=this.getContext(); if(!ctx)return; const now=ctx.currentTime; const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(350,now);osc.frequency.exponentialRampToValueAtTime(150,now+.08);gain.gain.setValueAtTime(.1,now);gain.gain.exponentialRampToValueAtTime(.001,now+.08);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.08); } catch {} }
  warning() { try { const ctx=this.getContext(); if(!ctx)return; const now=ctx.currentTime; const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='square';osc.frequency.setValueAtTime(300,now);gain.gain.setValueAtTime(.06,now);gain.gain.exponentialRampToValueAtTime(.001,now+.15);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.15); } catch {} }
  error() { this.warning(); }
  play(type: SoundType) { if(type==='success')this.success(); else if(type==='cash')this.cashRegister(); else if(type==='delete')this.delete(); else if(type==='error'||type==='warning')this.warning(); else this.click(); }
}

const soundController = new SoundFeedback();
export const soundFeedback = Object.assign((type: SoundType) => soundController.play(type), {
  click: () => soundController.click(),
  success: () => soundController.success(),
  cashRegister: () => soundController.cashRegister(),
  delete: () => soundController.delete(),
  warning: () => soundController.warning(),
  error: () => soundController.error(),
  play: (type: SoundType) => soundController.play(type),
});

function haptic(type: SoundType) {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (type === 'error') navigator.vibrate([30, 40, 30]);
    else if (type === 'warning') navigator.vibrate(25);
    else if (type === 'success' || type === 'cash') navigator.vibrate(12);
  } catch {}
}

function buildToastOptions(type: SoundType, options?: FeedbackOptions): ToastOptions {
  const { vibrate: shouldVibrate = true, ...rest } = options || {};
  if (shouldVibrate) haptic(type);

  return {
    duration: type === 'error' ? 4500 : type === 'warning' ? 3500 : 2600,
    position: 'top-center',
    className: 'som-pos-toast',
    ariaProps: { role: type === 'error' ? 'alert' : 'status', 'aria-live': 'polite' },
    ...rest,
  };
}

export function notifyReaction(type: SoundType, message: string, options?: FeedbackOptions) {
  const toastOptions = buildToastOptions(type, options);
  if (type === 'success') { soundController.success(); toast.success(message, toastOptions); }
  else if (type === 'cash') { soundController.cashRegister(); toast.success(message, { ...toastOptions, icon: '💰' }); }
  else if (type === 'error') { soundController.warning(); toast.error(message, toastOptions); }
  else if (type === 'warning') { soundController.warning(); toast(message, { ...toastOptions, icon: '⚠️' }); }
  else if (type === 'delete') { soundController.delete(); toast(message, { ...toastOptions, icon: '🗑️' }); }
  else { soundController.click(); toast(message, toastOptions); }
}
