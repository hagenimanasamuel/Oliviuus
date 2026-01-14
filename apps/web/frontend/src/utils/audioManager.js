class AudioManager {
  constructor() {
    this.audioElement = null;
    this.isInitialized = false;
    this.userInteracted = false;
    this.volume = 0.7;
    this.isEnabled = true;
    this.isPlaying = false;
    this.currentTrack = null;
    this.tracks = [];
  }

  // Initialize audio system
  init(tracks = []) {
    if (this.isInitialized || typeof Audio === 'undefined') return false;
    
    try {
      this.audioElement = new Audio();
      this.tracks = tracks;
      
      // Configure audio
      this.audioElement.preload = 'metadata';
      this.audioElement.volume = 0; // Start muted
      
      // Set up event listeners
      this.audioElement.addEventListener('canplaythrough', () => {
        console.log('Audio ready to play');
      });
      
      this.audioElement.addEventListener('error', (e) => {
        console.error('Audio error:', e);
      });
      
      this.audioElement.addEventListener('ended', () => {
        this.playNextTrack();
      });
      
      this.isInitialized = true;
      return true;
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  // Handle user interaction to unlock audio
  handleUserInteraction() {
    if (!this.userInteracted) {
      this.userInteracted = true;
      
      // Set up audio context resume for browsers that require it
      if (window.AudioContext || window.webkitAudioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Create a silent buffer and play it
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        
        // Resume audio context
        if (audioContext.state !== 'running') {
          audioContext.resume();
        }
      }
      
      // Try to play audio
      this.tryPlay();
    }
  }

  // Try to play audio
  async tryPlay() {
    if (!this.isInitialized || !this.userInteracted || !this.isEnabled) return false;
    
    try {
      // Set initial track if not set
      if (!this.currentTrack && this.tracks.length > 0) {
        this.currentTrack = this.tracks[0];
        this.audioElement.src = this.currentTrack;
      }
      
      // Set volume
      this.audioElement.volume = this.isEnabled ? this.volume : 0;
      
      // Play
      await this.audioElement.play();
      this.isPlaying = true;
      return true;
      
    } catch (error) {
      console.log('Audio play failed (may need more interaction):', error.message);
      this.isPlaying = false;
      return false;
    }
  }

  // Play specific track
  playTrack(track) {
    if (!this.isInitialized) return false;
    
    try {
      this.currentTrack = track;
      this.audioElement.src = track;
      this.audioElement.currentTime = 0;
      
      if (this.userInteracted && this.isEnabled) {
        this.audioElement.play();
        this.isPlaying = true;
      }
      
      return true;
    } catch (error) {
      console.error('Error playing track:', error);
      return false;
    }
  }

  // Play random track
  playRandomTrack() {
    if (this.tracks.length === 0) return false;
    
    const randomIndex = Math.floor(Math.random() * this.tracks.length);
    return this.playTrack(this.tracks[randomIndex]);
  }

  // Play next track
  playNextTrack() {
    if (this.tracks.length <= 1) return this.playRandomTrack();
    
    const currentIndex = this.tracks.indexOf(this.currentTrack);
    const nextIndex = (currentIndex + 1) % this.tracks.length;
    return this.playTrack(this.tracks[nextIndex]);
  }

  // Set volume
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.audioElement) {
      this.audioElement.volume = this.isEnabled ? this.volume : 0;
    }
  }

  // Toggle mute
  toggleMute() {
    this.isEnabled = !this.isEnabled;
    if (this.audioElement) {
      this.audioElement.volume = this.isEnabled ? this.volume : 0;
    }
  }

  // Pause audio
  pause() {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  // Resume audio
  resume() {
    if (this.audioElement && !this.isPlaying && this.userInteracted && this.isEnabled) {
      this.audioElement.play();
      this.isPlaying = true;
    }
  }

  // Cleanup
  cleanup() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement.src = '';
      this.audioElement = null;
    }
    this.isInitialized = false;
    this.isPlaying = false;
  }
}

// Export singleton instance
const audioManager = new AudioManager();
export default audioManager;