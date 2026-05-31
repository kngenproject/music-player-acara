import { ref, reactive, computed, watch, onUnmounted } from 'vue'

export function usePlayer() {
  // State
  const playlist = ref([])
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const volume = ref(0.8)
  const isMuted = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const isLooping = ref(false)  // loop single
  const isLoopingAll = ref(false) // loop playlist
  const isShuffling = ref(false)
  const fadeDuration = ref(3) // seconds
  const fadePreset = ref('3') // '1','2','3','5','custom'
  const crossfadeEnabled = ref(true)

  // Audio context
  let audioCtx = null
  let gainNode = null
  let audioEl = null
  let fadeTimer = null
  let crossfadeTimer = null

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      gainNode = audioCtx.createGain()
      gainNode.connect(audioCtx.destination)
    }
    return { audioCtx, gainNode }
  }

  function createAudio() {
    if (audioEl) {
      audioEl.pause()
      audioEl.src = ''
      audioEl.removeEventListener('timeupdate', onTimeUpdate)
      audioEl.removeEventListener('ended', onEnded)
      audioEl.removeEventListener('loadedmetadata', onLoaded)
    }
    audioEl = new Audio()
    audioEl.crossOrigin = 'anonymous'
    audioEl.volume = isMuted.value ? 0 : volume.value
    audioEl.addEventListener('timeupdate', onTimeUpdate)
    audioEl.addEventListener('ended', onEnded)
    audioEl.addEventListener('loadedmetadata', onLoaded)

    try {
      const { audioCtx: ctx, gainNode: gain } = getAudioCtx()
      const source = ctx.createMediaElementSource(audioEl)
      source.connect(gain)
    } catch (e) {
      // fallback: audio plays directly
    }
    return audioEl
  }

  function onTimeUpdate() {
    currentTime.value = audioEl?.currentTime || 0
    // Crossfade trigger: 5s before end
    if (crossfadeEnabled.value && audioEl && duration.value > 0) {
      const timeLeft = duration.value - audioEl.currentTime
      if (timeLeft <= fadeDuration.value && timeLeft > 0 && isPlaying.value) {
        if (!crossfadeTimer) {
          crossfadeTimer = true
          // already fading handled by next track fade-in
        }
      }
    }
  }

  function onLoaded() {
    duration.value = audioEl?.duration || 0
  }

  function onEnded() {
    crossfadeTimer = null
    if (isLooping.value) {
      audioEl.currentTime = 0
      audioEl.play()
    } else {
      playNext()
    }
  }

  // Media Session API
  function setupMediaSession(track) {
    if (!navigator.mediaSession) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artist || 'AcaraPlay',
      album: track.album || '',
    })
    navigator.mediaSession.setActionHandler('play', () => play())
    navigator.mediaSession.setActionHandler('pause', () => pause())
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrev())
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext())
  }

  // Fade helpers
  function cancelFade() {
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null }
  }

  function fadeVolumeTo(targetVol, durationSec, onDone) {
    cancelFade()
    if (!audioEl) { onDone?.(); return }
    const steps = 40
    const interval = (durationSec * 1000) / steps
    const startVol = audioEl.volume
    const diff = targetVol - startVol
    let step = 0
    fadeTimer = setInterval(() => {
      step++
      const newVol = startVol + diff * (step / steps)
      audioEl.volume = Math.max(0, Math.min(1, newVol))
      if (step >= steps) {
        clearInterval(fadeTimer)
        fadeTimer = null
        audioEl.volume = targetVol
        onDone?.()
      }
    }, interval)
  }

  // Core controls
  async function loadTrack(index, autoPlay = true) {
    if (index < 0 || index >= playlist.value.length) return
    currentIndex.value = index
    currentTime.value = 0
    duration.value = 0
    crossfadeTimer = null

    const track = playlist.value[index]
    const el = createAudio()
    el.src = track.url

    if (autoPlay) {
      try {
        if (audioCtx?.state === 'suspended') await audioCtx.resume()
        el.volume = 0
        await el.play()
        isPlaying.value = true
        setupMediaSession(track)
        fadeVolumeTo(isMuted.value ? 0 : volume.value, fadeDuration.value)
      } catch (e) {
        console.error('Play error:', e)
      }
    }
  }

  async function play() {
    if (!audioEl) return
    if (audioCtx?.state === 'suspended') await audioCtx.resume()
    cancelFade()
    audioEl.volume = 0
    await audioEl.play()
    isPlaying.value = true
    const track = playlist.value[currentIndex.value]
    if (track) setupMediaSession(track)
    fadeVolumeTo(isMuted.value ? 0 : volume.value, fadeDuration.value)
  }

  function pause() {
    if (!audioEl || !isPlaying.value) return
    cancelFade()
    fadeVolumeTo(0, fadeDuration.value, () => {
      audioEl?.pause()
      isPlaying.value = false
    })
  }

  function togglePlay() {
    if (isPlaying.value) pause()
    else play()
  }

  function playNext() {
    if (playlist.value.length === 0) return
    let next
    if (isShuffling.value) {
      next = Math.floor(Math.random() * playlist.value.length)
    } else {
      next = currentIndex.value + 1
      if (next >= playlist.value.length) {
        if (isLoopingAll.value) next = 0
        else { isPlaying.value = false; return }
      }
    }
    loadTrack(next, true)
  }

  function playPrev() {
    if (playlist.value.length === 0) return
    if (currentTime.value > 3) {
      audioEl.currentTime = 0
      return
    }
    let prev = currentIndex.value - 1
    if (prev < 0) prev = isLoopingAll.value ? playlist.value.length - 1 : 0
    loadTrack(prev, isPlaying.value)
  }

  function seekTo(time) {
    if (audioEl) audioEl.currentTime = time
    currentTime.value = time
  }

  // Volume
  function setVolume(val) {
    volume.value = val
    if (!isMuted.value && audioEl) audioEl.volume = val
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (audioEl) audioEl.volume = isMuted.value ? 0 : volume.value
  }

  function manualFadeOut() {
    cancelFade()
    fadeVolumeTo(0, fadeDuration.value, () => {
      if (audioEl) audioEl.pause()
      isPlaying.value = false
    })
  }

  function manualFadeIn() {
    if (!audioEl) return
    cancelFade()
    if (!isPlaying.value) {
      audioEl.volume = 0
      audioEl.play().then(() => {
        isPlaying.value = true
        fadeVolumeTo(isMuted.value ? 0 : volume.value, fadeDuration.value)
      })
    } else {
      fadeVolumeTo(isMuted.value ? 0 : volume.value, fadeDuration.value)
    }
  }

  // Playlist management
  function addFiles(files) {
    const audioTypes = ['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/flac','audio/aac','audio/m4a','audio/x-m4a','audio/mp4']
    const newTracks = []
    for (const file of files) {
      if (!audioTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a|opus)$/i)) continue
      newTracks.push({
        id: Date.now() + Math.random(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        artist: '',
        album: ''
      })
    }
    playlist.value.push(...newTracks)
    if (currentIndex.value === -1 && playlist.value.length > 0) {
      loadTrack(0, false)
    }
  }

  function removeTrack(index) {
    const removed = playlist.value[index]
    URL.revokeObjectURL(removed.url)
    playlist.value.splice(index, 1)
    if (currentIndex.value === index) {
      if (playlist.value.length === 0) {
        currentIndex.value = -1
        isPlaying.value = false
      } else {
        const newIdx = Math.min(index, playlist.value.length - 1)
        loadTrack(newIdx, isPlaying.value)
      }
    } else if (currentIndex.value > index) {
      currentIndex.value--
    }
  }

  function clearPlaylist() {
    playlist.value.forEach(t => URL.revokeObjectURL(t.url))
    playlist.value = []
    currentIndex.value = -1
    isPlaying.value = false
    if (audioEl) { audioEl.pause(); audioEl.src = '' }
  }

  function setFadePreset(val) {
    fadePreset.value = val
    if (val !== 'custom') fadeDuration.value = parseFloat(val)
  }

  // Computed
  const currentTrack = computed(() =>
    currentIndex.value >= 0 ? playlist.value[currentIndex.value] : null
  )

  const progressPercent = computed(() =>
    duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  )

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  onUnmounted(() => {
    cancelFade()
    playlist.value.forEach(t => URL.revokeObjectURL(t.url))
  })

  return {
    playlist, currentIndex, isPlaying, volume, isMuted,
    currentTime, duration, isLooping, isLoopingAll, isShuffling,
    fadeDuration, fadePreset, crossfadeEnabled,
    currentTrack, progressPercent,
    play, pause, togglePlay, playNext, playPrev,
    seekTo, setVolume, toggleMute,
    manualFadeOut, manualFadeIn,
    loadTrack, addFiles, removeTrack, clearPlaylist,
    setFadePreset, formatTime
  }
}
