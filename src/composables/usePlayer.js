import { ref, computed, watch, onUnmounted } from 'vue'

const STORAGE_KEY = 'acaraplay_saved_playlists'

// ─── Simpan/load playlist (nama saja, bukan file blob) ───────────────────────
export function getSavedPlaylists() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

export function savePlaylistToStorage(name, tracks) {
  const saved = getSavedPlaylists()
  const entry = {
    id: Date.now(),
    name,
    savedAt: new Date().toISOString(),
    tracks: tracks.map(t => ({ name: t.name, filename: t.filename, size: t.size }))
  }
  const idx = saved.findIndex(s => s.name === name)
  if (idx >= 0) saved[idx] = entry
  else saved.push(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  return entry
}

export function deleteSavedPlaylist(id) {
  const saved = getSavedPlaylists().filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

export function renamePlaylist(id, newName) {
  const saved = getSavedPlaylists()
  const playlist = saved.find(s => s.id === id)
  if (playlist) {
    playlist.name = newName
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    return true
  }
  return false
}

export function getPlaylistById(id) {
  return getSavedPlaylists().find(s => s.id === id)
}

// ─────────────────────────────────────────────────────────────────────────────

export function usePlayer() {
  // playlists: { [id]: { name: string, tracks: Track[] } }
  const playlists = ref({})
  const activePlaylistId = ref(null)
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const volume = ref(0.8)
  const isMuted = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const isLooping = ref(false)
  const isLoopingAll = ref(false)
  const isShuffling = ref(false)
  const fadeInDuration = ref(3)
  const fadeOutDuration = ref(3)
  const fadeInPreset = ref('3')
  const fadeOutPreset = ref('3')
  const crossfadeEnabled = ref(true)

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
    } catch (e) {}
    return audioEl
  }

  function onTimeUpdate() {
    currentTime.value = audioEl?.currentTime || 0
    if (crossfadeEnabled.value && audioEl && duration.value > 0) {
      const timeLeft = duration.value - audioEl.currentTime
      if (timeLeft <= fadeOutDuration.value && timeLeft > 0 && isPlaying.value) {
        if (!crossfadeTimer) { crossfadeTimer = true }
      }
    }
  }

  function onLoaded() { duration.value = audioEl?.duration || 0 }

  function onEnded() {
    crossfadeTimer = null
    if (isLooping.value) { audioEl.currentTime = 0; audioEl.play() }
    else playNext()
  }

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
      audioEl.volume = Math.max(0, Math.min(1, startVol + diff * (step / steps)))
      if (step >= steps) {
        clearInterval(fadeTimer); fadeTimer = null
        audioEl.volume = targetVol
        onDone?.()
      }
    }, interval)
  }

  async function loadTrack(index, autoPlay = true) {
    if (index < 0 || index >= activePlaylist.value.length) return
    currentIndex.value = index
    currentTime.value = 0
    duration.value = 0
    crossfadeTimer = null
    const track = activePlaylist.value[index]
    const el = createAudio()
    el.src = track.url
    if (autoPlay) {
      try {
        if (audioCtx?.state === 'suspended') await audioCtx.resume()
        el.volume = 0
        await el.play()
        isPlaying.value = true
        setupMediaSession(track)
        fadeVolumeTo(isMuted.value ? 0 : volume.value, fadeInDuration.value)
      } catch (e) { console.error('Play error:', e) }
    }
  }

  async function play() {
    if (!audioEl) return
    if (audioCtx?.state === 'suspended') await audioCtx.resume()
    cancelFade()
    audioEl.volume = 0
    await audioEl.play()
    isPlaying.value = true
    const track = activePlaylist.value[currentIndex.value]
    if (track) setupMediaSession(track)
    fadeVolumeTo(isMuted.value ? 0 : volume.value, fadeInDuration.value)
  }

  function pause() {
    if (!audioEl || !isPlaying.value) return
    cancelFade()
    fadeVolumeTo(0, fadeOutDuration.value, () => {
      audioEl?.pause()
      isPlaying.value = false
    })
  }

  function togglePlay() {
    if (isPlaying.value) pause()
    else play()
  }

  function playNext() {
    if (activePlaylist.value.length === 0) return
    let next
    if (isShuffling.value) {
      next = Math.floor(Math.random() * activePlaylist.value.length)
    } else {
      next = currentIndex.value + 1
      if (next >= activePlaylist.value.length) {
        if (isLoopingAll.value) next = 0
        else { isPlaying.value = false; return }
      }
    }
    loadTrack(next, true)
  }

  function playPrev() {
    if (activePlaylist.value.length === 0) return
    if (currentTime.value > 3) { audioEl.currentTime = 0; return }
    let prev = currentIndex.value - 1
    if (prev < 0) prev = isLoopingAll.value ? activePlaylist.value.length - 1 : 0
    loadTrack(prev, isPlaying.value)
  }

  function seekTo(time) {
    if (audioEl) audioEl.currentTime = time
    currentTime.value = time
  }

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
    fadeVolumeTo(0, fadeOutDuration.value, () => {
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
        fadeVolumeTo(isMuted.value ? 0 : volume.value, fadeInDuration.value)
      })
    } else {
      fadeVolumeTo(isMuted.value ? 0 : volume.value, fadeInDuration.value)
    }
  }

  function addFiles(files, folderName = null) {
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
        album: '',
        folderName: folderName || null
      })
    }

    if (!activePlaylistId.value || !playlists.value[activePlaylistId.value]) {
      const id = Date.now()
      playlists.value[id] = { name: folderName || 'Playlist', tracks: [] }
      activePlaylistId.value = id
    }

    playlists.value[activePlaylistId.value].tracks.push(...newTracks)

    if (currentIndex.value === -1 && activePlaylist.value.length > 0) loadTrack(0, false)
  }

  function removeTrack(index) {
    const tracks = playlists.value[activePlaylistId.value]?.tracks
    if (!tracks || !tracks[index]) return
    const removed = tracks[index]
    URL.revokeObjectURL(removed.url)
    tracks.splice(index, 1)
    if (currentIndex.value === index) {
      if (tracks.length === 0) { currentIndex.value = -1; isPlaying.value = false }
      else loadTrack(Math.min(index, tracks.length - 1), isPlaying.value)
    } else if (currentIndex.value > index) {
      currentIndex.value--
    }
  }

  function clearPlaylist() {
    if (!activePlaylistId.value || !playlists.value[activePlaylistId.value]) return
    playlists.value[activePlaylistId.value].tracks.forEach(t => URL.revokeObjectURL(t.url))
    delete playlists.value[activePlaylistId.value]
    const remaining = Object.keys(playlists.value)
    activePlaylistId.value = remaining.length > 0 ? remaining[0] : null
    currentIndex.value = -1
    isPlaying.value = false
    if (audioEl) { audioEl.pause(); audioEl.src = '' }
  }

  function createNewPlaylist(name) {
    const id = Date.now()
    playlists.value[id] = { name: name || 'Playlist Baru', tracks: [] }
    activePlaylistId.value = id
    currentIndex.value = -1
    isPlaying.value = false
    if (audioEl) { audioEl.pause(); audioEl.src = '' }
    return id
  }

  function renameActivePlaylist(newName) {
    if (!activePlaylistId.value || !playlists.value[activePlaylistId.value]) return
    playlists.value[activePlaylistId.value].name = newName
  }

  function switchPlaylist(playlistId) {
    if (!playlists.value[playlistId]) return
    currentIndex.value = -1
    isPlaying.value = false
    if (audioEl) { audioEl.pause(); audioEl.src = '' }
    activePlaylistId.value = playlistId
  }

  function deletePlaylist(playlistId) {
    if (!playlists.value[playlistId]) return
    playlists.value[playlistId].tracks.forEach(t => URL.revokeObjectURL(t.url))
    delete playlists.value[playlistId]
    if (activePlaylistId.value === playlistId) {
      const remaining = Object.keys(playlists.value)
      activePlaylistId.value = remaining.length > 0 ? remaining[0] : null
      currentIndex.value = -1
      isPlaying.value = false
      if (audioEl) { audioEl.pause(); audioEl.src = '' }
    }
  }

  function setFadeInPreset(val) {
    fadeInPreset.value = val
    if (val !== 'custom') fadeInDuration.value = parseFloat(val)
  }

  function setFadeOutPreset(val) {
    fadeOutPreset.value = val
    if (val !== 'custom') fadeOutDuration.value = parseFloat(val)
  }

  const currentTrack = computed(() =>
    currentIndex.value >= 0 && activePlaylist.value ? activePlaylist.value[currentIndex.value] : null
  )

  const activePlaylist = computed(() => {
    if (!activePlaylistId.value || !playlists.value[activePlaylistId.value]) return []
    return playlists.value[activePlaylistId.value].tracks || []
  })

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
    Object.values(playlists.value).forEach(pl => {
      pl.tracks.forEach(t => URL.revokeObjectURL(t.url))
    })
  })

  return {
    playlists, activePlaylistId, activePlaylist, currentIndex, isPlaying, volume, isMuted,
    currentTime, duration, isLooping, isLoopingAll, isShuffling,
    fadeInDuration, fadeOutDuration, fadeInPreset, fadeOutPreset, crossfadeEnabled,
    currentTrack, progressPercent,
    play, pause, togglePlay, playNext, playPrev,
    seekTo, setVolume, toggleMute,
    manualFadeOut, manualFadeIn,
    loadTrack, addFiles, removeTrack, clearPlaylist,
    setFadeInPreset, setFadeOutPreset, formatTime,
    createNewPlaylist, renameActivePlaylist, switchPlaylist, deletePlaylist
  }
}
