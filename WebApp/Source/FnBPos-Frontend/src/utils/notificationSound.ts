/**
 * 🔔 NOTIFICATION SOUND UTILITY (Web Audio API Synthesizer)
 * Phát âm thanh chuông "Ding-Dong" êm dịu, chuyên nghiệp cho POS khi có thông báo mới.
 * Hoạt động 100% Offline, không phụ thuộc file mp3 ngoài, 0ms latency.
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * 🎵 Phát âm thanh chuông thông báo POS (Hai nốt Ding-Dong trong trẻo)
 */
export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Nốt 1: "Ding" (E6 - 1318.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.5, now);

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nốt 2: "Dong" (B6 - 1975.5 Hz - cao vút, rõ ràng)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1975.5, now + 0.1);

    gain2.gain.setValueAtTime(0.28, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('[NotificationSound] Không thể phát âm thanh:', err);
  }
}
