import { useCallback, useRef, useEffect } from "react";

// Use a Web Audio API approach for reliable cross-browser sound
export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef<boolean>(true);

  // Initialize AudioContext on user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a pleasant notification chime
  const playNotificationSound = useCallback(() => {
    if (!isEnabledRef.current) return;

    try {
      const audioContext = initAudioContext();
      
      // Resume context if suspended (browsers require user interaction)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      
      // Create a pleasant two-tone chime
      const frequencies = [523.25, 659.25]; // C5 and E5 notes
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, currentTime);
        
        // Fade in and out for a gentle sound
        gainNode.gain.setValueAtTime(0, currentTime + index * 0.1);
        gainNode.gain.linearRampToValueAtTime(0.15, currentTime + index * 0.1 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + index * 0.1 + 0.3);
        
        oscillator.start(currentTime + index * 0.1);
        oscillator.stop(currentTime + index * 0.1 + 0.35);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [initAudioContext]);

  // Play a subtle alert sound for price alerts
  const playPriceAlertSound = useCallback(() => {
    if (!isEnabledRef.current) return;

    try {
      const audioContext = initAudioContext();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      
      // Three-tone ascending chime for price alerts
      const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5 notes
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, currentTime);
        
        gainNode.gain.setValueAtTime(0, currentTime + index * 0.08);
        gainNode.gain.linearRampToValueAtTime(0.12, currentTime + index * 0.08 + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + index * 0.08 + 0.25);
        
        oscillator.start(currentTime + index * 0.08);
        oscillator.stop(currentTime + index * 0.08 + 0.3);
      });
    } catch (error) {
      console.error('Error playing price alert sound:', error);
    }
  }, [initAudioContext]);

  // Enable/disable sounds
  const setSoundEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
    
    // Store preference
    try {
      localStorage.setItem('notification_sound_enabled', String(enabled));
    } catch (e) {
      console.error('Error saving sound preference:', e);
    }
  }, []);

  // Load preference on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notification_sound_enabled');
      if (stored !== null) {
        isEnabledRef.current = stored === 'true';
      }
    } catch (e) {
      console.error('Error loading sound preference:', e);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playNotificationSound,
    playPriceAlertSound,
    setSoundEnabled,
    isSoundEnabled: () => isEnabledRef.current,
  };
};

export default useNotificationSound;