export class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSounds();
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initializeSounds() {
    // Create synthetic sounds using Web Audio API
    this.createSyntheticSounds();
  }

  private createSyntheticSounds() {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext)();
      
      // Create mint sound (higher pitched beep)
      const mintSound = this.createBeep(audioContext, 800, 0.1, 'mint');
      this.sounds.set('mint', mintSound);

      // Create drop sound (lower pitched beep)
      const dropSound = this.createBeep(audioContext, 400, 0.15, 'drop');
      this.sounds.set('drop', dropSound);

      // Create milestone sound (celebration tone)
      const milestoneSound = this.createBeep(audioContext, 600, 0.3, 'milestone');
      this.sounds.set('milestone', milestoneSound);

    } catch (error) {
      console.warn('Could not initialize Web Audio API:', error);
    }
  }

  private createBeep(audioContext: AudioContext, frequency: number, duration: number, type: string): HTMLAudioElement {
    // Create a data URL for the audio
    const sampleRate = audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Generate sine wave
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let amplitude = Math.sin(2 * Math.PI * frequency * t);
      
      // Apply envelope (fade out)
      amplitude *= Math.max(0, 1 - t / duration);
      
      // Add some character based on type
      if (type === 'mint') {
        amplitude *= 0.3; // Softer
      } else if (type === 'drop') {
        amplitude *= 0.4; // Medium
      } else if (type === 'milestone') {
        amplitude *= 0.5; // Louder
        amplitude += Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.2; // Add harmonic
      }

      const sample = Math.max(-1, Math.min(1, amplitude)) * 32767;
      view.setInt16(44 + i * 2, sample, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 0.3;
    
    return audio;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  play(soundName: string) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      try {
        sound.currentTime = 0;
        sound.play().catch(error => {
          console.warn(`Could not play sound ${soundName}:`, error);
        });
      } catch (error) {
        console.warn(`Error playing sound ${soundName}:`, error);
      }
    }
  }

  playMint() {
    this.play('mint');
  }

  playDrop() {
    this.play('drop');
  }

  playMilestone() {
    this.play('milestone');
  }
}

// Export a singleton instance
export const soundManager = SoundManager.getInstance(); 