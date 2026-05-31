<template>
  <div class="app" :class="{ 'is-landscape': isLandscape }"
    @keydown.space.prevent="player.togglePlay()" tabindex="0" ref="appRef">

    <!-- Hidden file inputs -->
    <input type="file" ref="fileInput" multiple accept="audio/*" @change="onFilesSelected" style="display:none" />
    <input type="file" ref="folderInput" webkitdirectory multiple accept="audio/*" @change="onFolderSelected" style="display:none" />

    <!-- Install Banner -->
    <div class="install-banner" v-if="showInstallBanner">
      <span>📲 Install AcaraPlay ke Home Screen</span>
      <button class="install-btn" @click="installPWA">Install</button>
      <button class="close-banner" @click="showInstallBanner = false">✕</button>
    </div>

    <!-- Rename Playlist Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showRenameModal" @click.self="showRenameModal = false">
        <div class="modal">
          <div class="modal-header">
            <span>✏️ Ubah Nama Playlist</span>
            <button class="modal-close" @click="showRenameModal = false">✕</button>
          </div>
          <input class="modal-input" v-model="renamePlaylistName"
            placeholder="Nama playlist baru..."
            @keydown.enter="confirmRename"
            ref="renameInputRef" />
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="showRenameModal = false">Batal</button>
            <button class="modal-btn confirm" @click="confirmRename" :disabled="!renamePlaylistName.trim()">Ubah</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Save Playlist Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showSaveModal" @click.self="showSaveModal = false">
        <div class="modal">
          <div class="modal-header">
            <span>💾 Simpan Playlist</span>
            <button class="modal-close" @click="showSaveModal = false">✕</button>
          </div>
          <input class="modal-input" v-model="savePlaylistName"
            placeholder="Nama playlist..."
            @keydown.enter="confirmSave"
            ref="saveInputRef" />
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="showSaveModal = false">Batal</button>
            <button class="modal-btn confirm" @click="confirmSave" :disabled="!savePlaylistName.trim()">Simpan</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Saved Playlists Drawer -->
    <Teleport to="body">
      <div class="drawer-overlay" v-if="showDrawer" @click.self="showDrawer = false">
        <div class="drawer">
          <div class="drawer-header">
            <span>📂 Playlist Tersimpan</span>
            <button class="modal-close" @click="showDrawer = false">✕</button>
          </div>
          <div class="drawer-list" v-if="savedPlaylists.length">
            <div class="drawer-item" v-for="sp in savedPlaylists" :key="sp.id">
              <div class="drawer-info" @click="loadSavedPlaylist(sp.id, sp.name)">
                <div class="drawer-name">{{ sp.name }}</div>
                <div class="drawer-meta">{{ sp.tracks.length }} lagu · {{ formatSavedDate(sp.savedAt) }}</div>
                <div class="drawer-tracks">
                  <span v-for="t in sp.tracks.slice(0,3)" :key="t.filename" class="drawer-track-chip">{{ t.name }}</span>
                  <span v-if="sp.tracks.length > 3" class="drawer-track-more">+{{ sp.tracks.length - 3 }} lagi</span>
                </div>
              </div>
              <div class="drawer-actions">
                <button class="drawer-act load" @click.stop="loadSavedPlaylist(sp.id, sp.name)" title="Load">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
                </button>
                <button class="drawer-act edit" @click.stop="openRenameModal(sp.id, sp.name)" title="Ubah nama">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button class="drawer-act del" @click.stop="deletePlaylist(sp.id)" title="Hapus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm13-15h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div class="drawer-empty" v-else>
            <p>Belum ada playlist tersimpan</p>
            <small>Simpan playlist aktif dengan tombol 💾</small>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── PORTRAIT ── -->
    <template v-if="!isLandscape">
      <div class="main-layout portrait-layout">
        <VolumeSlider
          :volume="player.volume.value"
          :isMuted="player.isMuted.value"
          :isLandscape="false"
          @update:volume="player.setVolume"
          @toggle-mute="player.toggleMute"
          @fade-in="player.manualFadeIn"
          @fade-out="player.manualFadeOut"
        />
        <div class="right-content">
          <div class="app-header">
            <div class="app-logo">
              <span class="logo-icon">♪</span>
              AcaraPlay
            </div>
            <div class="header-actions">
              <button class="hdr-icon-btn" @click="openSaveModal" title="Simpan Playlist" v-if="player.activePlaylist.value.length">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
              </button>
              <button class="hdr-icon-btn" @click="openDrawer" title="Playlist Tersimpan">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
              </button>
              <span class="pwa-badge" v-if="isPWA">PWA</span>
              <span class="status-dot" :class="{ playing: player.isPlaying.value }"></span>
            </div>
          </div>
          <PlayerControls v-bind="playerControlsProps" v-on="playerControlsEmits" />
          <div v-if="needsRelink" class="relink-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            <span>Playlist ini perlu file audio dipilih ulang</span>
            <button class="relink-btn" @click="relinkPlaylistFiles">Pilih File</button>
          </div>
          <PlaylistPanel v-bind="playlistProps" v-on="playlistEmits" />
        </div>
      </div>
    </template>

    <!-- ── LANDSCAPE ── -->
    <template v-else>
      <div class="main-layout landscape-layout">
        <div class="landscape-left">
          <div class="app-header">
            <div class="app-logo">
              <span class="logo-icon">♪</span>
              AcaraPlay
            </div>
            <div class="header-actions">
              <button class="hdr-icon-btn" @click="openSaveModal" title="Simpan Playlist" v-if="player.activePlaylist.value.length">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
              </button>
              <button class="hdr-icon-btn" @click="openDrawer" title="Playlist Tersimpan">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
              </button>
              <span class="pwa-badge" v-if="isPWA">PWA</span>
              <span class="status-dot" :class="{ playing: player.isPlaying.value }"></span>
            </div>
          </div>
          <PlayerControls v-bind="playerControlsProps" v-on="playerControlsEmits" />
          <VolumeSlider
            :volume="player.volume.value"
            :isMuted="player.isMuted.value"
            :isLandscape="true"
            @update:volume="player.setVolume"
            @toggle-mute="player.toggleMute"
            @fade-in="player.manualFadeIn"
            @fade-out="player.manualFadeOut"
          />
        </div>
        <div class="landscape-playlist-wrap">
          <div v-if="needsRelink" class="relink-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            <span>Playlist ini perlu file audio dipilih ulang</span>
            <button class="relink-btn" @click="relinkPlaylistFiles">Pilih File</button>
          </div>
          <PlaylistPanel v-bind="playlistProps" v-on="playlistEmits" />
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { usePlayer, getSavedPlaylists, savePlaylistToStorage, deleteSavedPlaylist, renamePlaylist } from './composables/usePlayer'
import VolumeSlider from './components/VolumeSlider.vue'
import PlayerControls from './components/PlayerControls.vue'
import PlaylistPanel from './components/PlaylistPanel.vue'

const player = usePlayer()
const appRef = ref(null)
const fileInput = ref(null)
const folderInput = ref(null)
const showInstallBanner = ref(false)
const isPWA = ref(false)
const isLandscape = ref(false)
let deferredPrompt = null

// ── Playlist save/load/rename ──────────────────────────
const showSaveModal = ref(false)
const showRenameModal = ref(false)
const showDrawer = ref(false)
const savePlaylistName = ref('')
const renamePlaylistName = ref('')
const renamePlaylistId = ref(null)
const saveInputRef = ref(null)
const renameInputRef = ref(null)
const savedPlaylists = ref(getSavedPlaylists())

function openSaveModal() {
  savePlaylistName.value = ''
  showSaveModal.value = true
  nextTick(() => saveInputRef.value?.focus())
}

function openRenameModal(id, currentName) {
  renamePlaylistId.value = id
  renamePlaylistName.value = currentName
  showRenameModal.value = true
  nextTick(() => renameInputRef.value?.focus())
}

function openDrawer() {
  savedPlaylists.value = getSavedPlaylists()
  showDrawer.value = true
}

function confirmSave() {
  const name = savePlaylistName.value.trim()
  if (!name) return
  savePlaylistToStorage(name, player.activePlaylist.value)
  savedPlaylists.value = getSavedPlaylists()
  showSaveModal.value = false
}

function confirmRename() {
  const newName = renamePlaylistName.value.trim()
  if (!newName || !renamePlaylistId.value) return
  if (renamePlaylist(renamePlaylistId.value, newName)) {
    savedPlaylists.value = getSavedPlaylists()
    showRenameModal.value = false
  }
}

function deletePlaylist(id) {
  deleteSavedPlaylist(id)
  savedPlaylists.value = getSavedPlaylists()
}

const needsRelink = computed(() =>
  player.activePlaylist.value.length > 0 &&
  player.activePlaylist.value.some(t => !t.url || t.isSavedReference)
)

function relinkPlaylistFiles() {
  const tracks = player.activePlaylist.value
  if (!tracks.length) return
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = 'audio/*'
  input.onchange = () => {
    const files = Array.from(input.files)
    let linkedCount = 0
    tracks.forEach(track => {
      const match = files.find(f => f.name === track.filename)
      if (match) {
        track.url = URL.createObjectURL(match)
        track.isSavedReference = false
        linkedCount++
      }
    })
    if (linkedCount > 0 && player.currentIndex.value < 0) {
      player.loadTrack(0, false)
    } else if (linkedCount > 0 && player.currentIndex.value >= 0) {
      const idx = player.currentIndex.value
      player.loadTrack(idx, false)
    }
  }
  input.click()
}

function loadSavedPlaylist(playlistId, playlistName) {
  const saved = getSavedPlaylists().find(p => p.id === playlistId)
  if (!saved || !saved.tracks.length) return

  const newId = player.createNewPlaylist(playlistName)

  const tracks = saved.tracks.map((t, idx) => ({
    id: Date.now() + idx,
    name: t.name,
    filename: t.filename,
    url: '',
    size: t.size,
    artist: '',
    album: '',
    isSavedReference: true
  }))

  player.playlists.value[newId].tracks = tracks
  showDrawer.value = false
}

function formatSavedDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
// ───────────────────────────────────────────────────────

const playerControlsProps = computed(() => ({
  trackName: player.currentTrack.value?.name,
  isPlaying: player.isPlaying.value,
  hasTrack: player.currentIndex.value >= 0,
  currentTime: player.currentTime.value,
  duration: player.duration.value,
  progressPercent: player.progressPercent.value,
  isLooping: player.isLooping.value,
  isLoopingAll: player.isLoopingAll.value,
  isShuffling: player.isShuffling.value,
  crossfadeEnabled: player.crossfadeEnabled.value,
  fadePreset: player.fadePreset.value,
  fadeDuration: player.fadeDuration.value,
  formatTime: player.formatTime
}))

const playerControlsEmits = {
  'toggle-play': player.togglePlay,
  'prev': player.playPrev,
  'next': player.playNext,
  'seek': player.seekTo,
  'toggle-loop': () => { player.isLooping.value = !player.isLooping.value },
  'toggle-loop-all': () => { player.isLoopingAll.value = !player.isLoopingAll.value },
  'toggle-shuffle': () => { player.isShuffling.value = !player.isShuffling.value },
  'toggle-crossfade': () => { player.crossfadeEnabled.value = !player.crossfadeEnabled.value },
  'set-fade-preset': player.setFadePreset,
  'set-fade-duration': (v) => { player.fadeDuration.value = v }
}

const playlistProps = computed(() => ({
  playlist: player.activePlaylist.value,
  playlists: player.playlists.value,
  activePlaylistId: player.activePlaylistId.value,
  currentIndex: player.currentIndex.value,
  isPlaying: player.isPlaying.value
}))

const playlistEmits = {
  'play-track': (i) => player.loadTrack(i, true),
  'remove': player.removeTrack,
  'clear': player.clearPlaylist,
  'upload-files': () => fileInput.value?.click(),
  'upload-folder': () => folderInput.value?.click(),
  'switch-playlist': player.switchPlaylist,
  'delete-playlist': player.deletePlaylist,
  'new-playlist': () => player.createNewPlaylist('Playlist Baru'),
  'rename-playlist': (name) => player.renameActivePlaylist(name)
}

function onFilesSelected(e) {
  const files = Array.from(e.target.files || [])
  if (!player.activePlaylistId.value) {
    player.createNewPlaylist('Playlist')
  }
  player.addFiles(files, null)
  e.target.value = ''
}

function onFolderSelected(e) {
  const files = Array.from(e.target.files || [])
  if (files.length === 0) return
  const firstPath = files[0].webkitRelativePath || files[0].name
  const folderName = firstPath.split('/')[0] || 'Folder'
  player.createNewPlaylist(folderName)
  player.addFiles(files, folderName)
  e.target.value = ''
}

function checkOrientation() {
  isLandscape.value = window.innerHeight < window.innerWidth
}

function onKeydown(e) {
  if (e.target === saveInputRef.value || e.target === renameInputRef.value) return
  switch (e.code || String.fromCharCode(e.keyCode)) {
    case 'Space': break
    case 'ArrowLeft': e.preventDefault(); player.seekTo(Math.max(0, player.currentTime.value - 5)); break
    case 'ArrowRight': e.preventDefault(); player.seekTo(Math.min(player.duration.value, player.currentTime.value + 5)); break
    case 'ArrowUp': e.preventDefault(); player.setVolume(Math.min(1, player.volume.value + 0.05)); break
    case 'ArrowDown': e.preventDefault(); player.setVolume(Math.max(0, player.volume.value - 0.05)); break
    case 'm': case 'M': player.toggleMute(); break
    case 'f': case 'F': player.manualFadeOut(); break
    case 'g': case 'G': player.manualFadeIn(); break
    case 's': case 'S': if (player.activePlaylist.value.length) openSaveModal(); break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', checkOrientation)
  checkOrientation()
  if (window.matchMedia('(display-mode: standalone)').matches) isPWA.value = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e; showInstallBanner.value = true
  })
  appRef.value?.focus()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', checkOrientation)
})

async function installPWA() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') { showInstallBanner.value = false; isPWA.value = true }
  deferredPrompt = null
}
</script>

<style scoped>
.app {
  height: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  outline: none;
  background: var(--bg);
  overflow: hidden;
}

/* Install banner */
.install-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #0f0c00, #1c1500);
  border-bottom: 1px solid rgba(240,180,41,0.2);
  font-size: 13px;
  color: var(--accent);
  flex-shrink: 0;
}
.install-banner span { flex: 1; }
.install-btn {
  background: var(--accent);
  color: #000;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: inherit;
}
.close-banner {
  background: transparent;
  color: var(--text2);
  width: 28px; height: 28px;
  font-size: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--surface);
}
.app-logo {
  font-size: 15px;
  font-weight: 900;
  color: var(--text);
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.logo-icon {
  font-size: 18px;
  color: var(--accent);
  line-height: 1;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hdr-icon-btn {
  background: var(--surface2);
  color: var(--text2);
  border-radius: var(--radius-sm);
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border2);
  transition: all 0.15s;
}
.hdr-icon-btn:hover { background: var(--surface3); color: var(--text); }

.pwa-badge {
  font-size: 9px;
  font-weight: 800;
  background: var(--accent-soft);
  color: var(--accent);
  padding: 3px 8px;
  border-radius: 20px;
  letter-spacing: 1px;
  border: 1px solid rgba(240,180,41,0.2);
}
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--text3);
  transition: background 0.3s, box-shadow 0.3s;
}
.status-dot.playing {
  background: var(--success);
  box-shadow: 0 0 0 3px var(--success-soft);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

/* Portrait */
.portrait-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Landscape */
.landscape-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 380px 1fr;
  overflow: hidden;
}
.landscape-left {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  overflow: hidden;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  padding: 20px;
  width: min(340px, 90vw);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  animation: modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes modalIn {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}
.modal-close {
  background: var(--surface2);
  color: var(--text2);
  width: 30px; height: 30px;
  border-radius: 50%;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
}
.modal-close:hover { background: var(--surface3); color: var(--text); }
.modal-input {
  background: var(--surface2);
  border: 1.5px solid var(--border2);
  border-radius: var(--radius-sm);
  padding: 11px 14px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}
.modal-input:focus { border-color: var(--accent); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.modal-btn {
  padding: 9px 20px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
}
.modal-btn.cancel { background: var(--surface2); color: var(--text2); border: 1px solid var(--border); }
.modal-btn.cancel:hover { color: var(--text); }
.modal-btn.confirm { background: var(--accent); color: #000; }
.modal-btn.confirm:disabled { opacity: 0.35; cursor: not-allowed; }

/* Drawer */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: flex-end;
  backdrop-filter: blur(4px);
}
.drawer {
  width: 100%;
  max-height: 72vh;
  background: var(--surface);
  border-top: 1px solid var(--border2);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  flex-shrink: 0;
}
.drawer-list { overflow-y: auto; flex: 1; }
.drawer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}
.drawer-item:hover { background: var(--surface2); }
.drawer-item:last-child { border-bottom: none; }
.drawer-info { flex: 1; min-width: 0; cursor: pointer; }
.drawer-name { font-size: 14px; font-weight: 700; color: var(--text); }
.drawer-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }
.drawer-tracks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.drawer-track-chip {
  font-size: 11px;
  color: var(--text2);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 8px;
  max-width: 130px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.drawer-track-more {
  font-size: 11px;
  color: var(--accent);
  padding: 2px 4px;
  font-weight: 600;
}
.drawer-actions { display: flex; gap: 4px; flex-shrink: 0; }
.drawer-act {
  background: transparent;
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  color: var(--text3);
  transition: all 0.15s;
  flex-shrink: 0;
}
.drawer-act.load:hover { background: var(--success-soft); color: var(--success); border-color: rgba(56,193,114,0.2); }
.drawer-act.edit:hover { background: var(--accent-soft); color: var(--accent); border-color: rgba(240,180,41,0.2); }
.drawer-act.del:hover  { background: var(--danger-soft); color: var(--danger); border-color: rgba(232,85,85,0.2); }
.drawer-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--text3);
  text-align: center;
}
.drawer-empty p { font-size: 14px; color: var(--text2); }
.drawer-empty small { font-size: 12px; }

/* Relink banner */
.relink-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(240, 180, 41, 0.12);
  border-bottom: 1px solid rgba(240, 180, 41, 0.25);
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}
.relink-banner svg { flex-shrink: 0; }
.relink-banner span { flex: 1; }
.relink-btn {
  background: var(--accent);
  color: #000;
  font-weight: 700;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  flex-shrink: 0;
}
.relink-btn:hover { opacity: 0.85; }

/* Landscape playlist wrap */
.landscape-playlist-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
</style>
