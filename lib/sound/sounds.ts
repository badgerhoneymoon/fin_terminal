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
    // Load actual sound files
    this.loadSoundFiles();
  }

  private loadSoundFiles() {
    try {
      // Create mint sound (waterdrop sound for chip minting)
      const mintSound = new Audio('/sounds/OS_CASH_perc_water_drop.wav');
      mintSound.volume = 0.2;
      mintSound.preload = 'auto';
      this.sounds.set('mint', mintSound);

      // Create drop sound (cash register sound for chip dropping)
      const dropSound = new Audio('/sounds/CashRegister_S08OF.38.wav');
      dropSound.volume = 0.2;
      dropSound.preload = 'auto';
      this.sounds.set('drop', dropSound);

      // Create milestone sound (same as drop for now, can be customized later)
      const milestoneSound = new Audio('/sounds/CashRegister_S08OF.38.wav');
      milestoneSound.volume = 0.2;
      milestoneSound.preload = 'auto';
      this.sounds.set('milestone', milestoneSound);

      // Create delete sound (BWU sound for clearing/deleting operations)
      const deleteSound = new Audio('/sounds/CashRegister_BWU.73.wav');
      deleteSound.volume = 0.2;
      deleteSound.preload = 'auto';
      this.sounds.set('delete', deleteSound);

      // Create sum sound (BRS sound for when adding numbers to sum with space)
      const sumSound = new Audio('/sounds/BRS_Beep_Cash_Counter_Single.wav');
      sumSound.volume = 0.2;
      sumSound.preload = 'auto';
      this.sounds.set('sum', sumSound);

      // Create negate sound (snap pleaser sound for switching between positive/negative)
      const negateSound = new Audio('/sounds/OS_CASH_snap_pleaser.wav');
      negateSound.volume = 0.2;
      negateSound.preload = 'auto';
      this.sounds.set('negate', negateSound);

    } catch (error) {
      console.warn('Could not load sound files:', error);
    }
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

  playDelete() {
    this.play('delete');
  }

  playSum() {
    this.play('sum');
  }

  playNegate() {
    this.play('negate');
  }
}

// Export a singleton instance
export const soundManager = SoundManager.getInstance(); 