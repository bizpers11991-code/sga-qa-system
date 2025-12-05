import * as React from 'react'

type SoundEffect = 'click' | 'success' | 'error' | 'notification' | 'whoosh' | 'pop';

// Sound effects as base64 data URIs (tiny sounds)
const sounds: Record<SoundEffect, string> = {
  // These are placeholder URLs - in production you'd use actual sound files
  click: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
  success: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
  error: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
  notification: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
  whoosh: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
  pop: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
}

interface SoundEffectsOptions {
  enabled?: boolean;
  volume?: number; // 0 to 1
}

export function useSoundEffects(options: SoundEffectsOptions = {}) {
  const { enabled = true, volume = 0.5 } = options
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const [isMuted, setIsMuted] = React.useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sound_effects_muted') === 'true'
  })

  // Initialize AudioContext on first interaction
  const initAudio = React.useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Play a synthesized beep (works without audio files)
  const playTone = React.useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ) => {
    if (!enabled || isMuted) return

    try {
      const ctx = initAudio()
      if (!ctx) return

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

      // Fade out
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (e) {
      // Audio not supported
    }
  }, [enabled, isMuted, volume, initAudio])

  // Predefined sound effects using synthesized tones
  const play = React.useCallback((effect: SoundEffect) => {
    if (!enabled || isMuted) return

    switch (effect) {
      case 'click':
        playTone(800, 0.05, 'square')
        break
      case 'success':
        playTone(523, 0.1, 'sine') // C5
        setTimeout(() => playTone(659, 0.1, 'sine'), 100) // E5
        setTimeout(() => playTone(784, 0.15, 'sine'), 200) // G5
        break
      case 'error':
        playTone(200, 0.15, 'sawtooth')
        setTimeout(() => playTone(150, 0.2, 'sawtooth'), 150)
        break
      case 'notification':
        playTone(880, 0.1, 'sine')
        setTimeout(() => playTone(1100, 0.1, 'sine'), 100)
        break
      case 'whoosh':
        // Sweeping frequency
        const ctx = initAudio()
        if (ctx) {
          const oscillator = ctx.createOscillator()
          const gainNode = ctx.createGain()
          oscillator.connect(gainNode)
          gainNode.connect(ctx.destination)
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(100, ctx.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.2)
          gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
          oscillator.start(ctx.currentTime)
          oscillator.stop(ctx.currentTime + 0.2)
        }
        break
      case 'pop':
        playTone(400, 0.05, 'sine')
        break
    }
  }, [enabled, isMuted, playTone, initAudio])

  // Toggle mute
  const toggleMute = React.useCallback(() => {
    setIsMuted(prev => {
      const newValue = !prev
      localStorage.setItem('sound_effects_muted', String(newValue))
      return newValue
    })
  }, [])

  return {
    play,
    playTone,
    isMuted,
    toggleMute,
    // Convenience methods
    click: () => play('click'),
    success: () => play('success'),
    error: () => play('error'),
    notification: () => play('notification'),
    whoosh: () => play('whoosh'),
    pop: () => play('pop'),
  }
}

export default useSoundEffects
