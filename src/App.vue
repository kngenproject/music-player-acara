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
    <div class="modal-overlay" v-if="showRenameModal" @click.self="showRenameModal = false">
      <div class="modal">
        <div class="modal-header">
          <span>✏️ Ubah Nama Playlist</span>
          <button class="modal-close" @click="showRenameModal = false">✕</button>
        </div>
        <input
          class="modal-input"
          v-model="renamePlaylistName"
          placeholder="Nama playlist baru..."
          @keydown.enter="confirmRename"
          ref="renameInputRef"
        />
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showRenameModal = false">Batal</button>
          <button class="modal-btn confirm" @click="confirmRename" :disabled="!renamePlaylistName.trim()">Ubah</button>
        </div>
      </div>
    </div>

    <!-- Save Playlist Modal -->
    <div class="modal-overlay" v-if="showSaveModal" @click.self="showSaveModal = false">
      <div class="modal">
        <div class="modal-header">
          <span>💾 Simpan Playlist</span>
          <button class="modal-close" @click="showSaveModal = false">✕</button>
        </div>
        <input
          class="modal-input"
          v-model="savePlaylistName"
          placeholder="Nama playlist..."
          @keydown.enter="confirmSave"
          ref="saveInputRef"
        />
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showSaveModal = false">Batal</button>
          <button class="modal-btn confirm" @click="confirmSave" :disabled="!savePlaylistName.trim()">Simpan</button>
        </div>
      </div>
    </div>

    <!-- Saved Playlists Drawer -->
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
              <button class="drawer-load" @click.stop="loadSavedPlaylist(sp.id, sp.name)" title="Load">📂</button>
              <button class="drawer-edit" @click.stop="openRenameModal(sp.id, sp.name)" title="Ubah nama">✏️</button>
              <button class="drawer-del" @click.stop="deletePlaylist(sp.id)" title="Hapus">🗑️</button>
            </div>
          </div>
        </div>
        <div class="drawer-empty" v-else>
          <p>Belum ada playlist tersimpan</p>
          <small>Simpan playlist aktif dengan tombol 💾</small>
        </div>
      </div>
    </div>

    <!-- ── PORTRAIT layout ── -->
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
            <div class="app-logo">🎵 AcaraPlay</div>
            <div class="header-actions">
              <button class="hdr-icon-btn" @click="openSaveModal" title="Simpan Playlist" v-if="player.activePlaylist.value.length">💾</button>
              <button class="hdr-icon-btn" @click="openDrawer" title="Playlist Tersimpan">📂</button>
              <span class="pwa-badge" v-if="isPWA">PWA</span>
              <span class="status-dot" :class="{ playing: player.isPlaying.value }"></span>
            </div>
          </div>
          <PlayerControls v-bind="playerControlsProps" v-on="playerControlsEmits" />
          <PlaylistPanel v-bind="playlistProps" v-on="playlistEmits" />
        </div>
      </div>
    </template>

    <!-- ── LANDSCAPE layout ── -->
    <template v-else>
      <div class="main-layout landscape-layout">

        <!-- Kolom kiri: header + controls + volume strip -->
        <div class="landscape-left">
          <div class="app-header">
            <div class="app-logo">🎵 AcaraPlay</div>
            <div class="header-actions">
              <button class="hdr-icon-btn" @click="openSaveModal" title="Simpan Playlist" v-if="player.activePlaylist.value.length">💾</button>
              <button class="hdr-icon-btn" @click="openDrawer" title="Playlist Tersimpan">📂</button>
              <span class="landscape-badge">⬛ Tablet</span>
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

        <!-- Kolom kanan: playlist penuh -->
        <PlaylistPanel v-bind="playlistProps" v-on="playlistEmits" />
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

function loadSavedPlaylist(playlistId, playlistName) {
  const saved = getSavedPlaylists().find(p => p.id === playlistId)
  if (!saved || !saved.tracks.length) return
  
  // Create new playlist for loaded data
  const newId = player.createNewPlaylist(playlistName)
  player.switchPlaylist(newId)
  
  // Create placeholder tracks with metadata
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
  
  player.playlists.value[newId] = tracks
  showDrawer.value = false
}

function formatSavedDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
// ───────────────────────────────────────────────────────

// Shared props/emits untuk PlayerControls & PlaylistPanel
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
  'delete-playlist': player.deletePlaylist
}

function onFilesSelected(e) {
  const files = Array.from(e.target.files || [])
  if (!player.activePlaylistId.value) {
    player.createNewPlaylist('Playlist Aktif')
  }
  player.addFiles(files, null)
  e.target.value = ''
}

function onFolderSelected(e) {
  const files = Array.from(e.target.files || [])
  if (files.length === 0) return
  
  // Extract folder name from first file path
  const firstPath = files[0].webkitRelativePath || files[0].name
  const folderName = firstPath.split('/')[0] || 'Folder'
  
  // Create new playlist untuk folder ini
  player.createNewPlaylist(folderName)
  player.addFiles(files, folderName)
  e.target.value = ''
}

function checkOrientation() {
  isLandscape.value = window.innerHeight < window.innerWidth
}

function onKeydown(e) {
  if (e.target === saveInputRef.value || e.target === renameInputRef.value) return
  switch(e.code || String.fromCharCode(e.keyCode)) {
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  outline: none;
  background: var(--bg);
}

/* ── Install banner ── */
.install-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #1a1400, #2a2000);
  border-bottom: 1px solid var(--accent2);
  font-size: 13px; color: var(--accent);
  flex-shrink: 0;
}
.install-banner span { flex: 1; }
.install-btn {
  background: var(--accent); color: #000; font-weight: 700;
  padding: 6px 16px; border-radius: var(--radius-sm); font-size: 12px;
}
.close-banner {
  background: transparent; color: var(--text2);
  width: 28px; height: 28px; font-size: 14px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}

/* ── Header ── */
.app-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0; background: var(--surface);
}
.app-logo { font-size: 16px; font-weight: 800; color: var(--accent); letter-spacing: -0.5px; }
.header-actions { display: flex; align-items: center; gap: 8px; }

.hdr-icon-btn {
  background: var(--surface2); border-radius: var(--radius-sm);
  width: 34px; height: 34px; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
}
.hdr-icon-btn:hover { background: var(--surface3); }

.pwa-badge {
  font-size: 10px; font-weight: 700;
  background: rgba(232,168,56,0.15); color: var(--accent);
  padding: 2px 8px; border-radius: 10px; letter-spacing: 1px;
}
.landscape-badge {
  font-size: 10px; font-weight: 700;
  background: rgba(64,192,112,0.15); color: var(--success);
  padding: 2px 8px; border-radius: 10px; letter-spacing: 1px;
}
.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--text3); transition: background 0.3s;
}
.status-dot.playing {
  background: var(--success); box-shadow: 0 0 6px var(--success);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* ── Portrait layout ── */
.portrait-layout {
  flex: 1; display: flex; overflow: hidden;
}
.right-content {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
}

/* ── Landscape layout ── */
.landscape-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 400px 1fr;
  overflow: hidden;
}
.landscape-left {
  display: flex; flex-direction: column;
  border-right: 1px solid var(--border);
  overflow: hidden;
}

/* ── Modal: simpan/ubah playlist ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  width: min(340px, 90vw);
  display: flex; flex-direction: column; gap: 14px;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 15px; font-weight: 700; color: var(--text);
}
.modal-close {
  background: transparent; color: var(--text2);
  width: 28px; height: 28px; border-radius: 50%; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.modal-close:hover { background: var(--surface2); color: var(--text); }
.modal-input {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 10px 14px;
  color: var(--text); font-size: 14px; outline: none;
  font-family: inherit;
}
.modal-input:focus { border-color: var(--accent); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.modal-btn {
  padding: 8px 18px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 700;
}
.modal-btn.cancel { background: var(--surface2); color: var(--text2); }
.modal-btn.cancel:hover { color: var(--text); }
.modal-btn.confirm { background: var(--accent); color: #000; }
.modal-btn.confirm:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Drawer: daftar playlist tersimpan ── */
.drawer-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: flex-end;
}
.drawer {
  width: 100%;
  max-height: 70vh;
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-radius: var(--radius) var(--radius) 0 0;
  display: flex; flex-direction: column;
  animation: slideUp 0.22s ease;
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.drawer-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 15px; font-weight: 700; color: var(--text);
  flex-shrink: 0;
}
.drawer-list { overflow-y: auto; flex: 1; padding: 8px 0; }
.drawer-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
}
.drawer-item:last-child { border-bottom: none; }
.drawer-info { flex: 1; min-width: 0; cursor: pointer; }
.drawer-name { font-size: 14px; font-weight: 700; color: var(--text); }
.drawer-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }
.drawer-tracks {
  display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;
}
.drawer-track-chip {
  font-size: 11px; color: var(--text2);
  background: var(--surface2); border-radius: 6px;
  padding: 2px 8px; max-width: 140px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.drawer-track-more {
  font-size: 11px; color: var(--accent); padding: 2px 4px;
}
.drawer-actions {
  display: flex; gap: 4px;
}
.drawer-load {
  background: transparent; color: var(--text3); font-size: 18px;
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.drawer-load:hover { background: rgba(64,192,112,0.15); color: var(--success); }
.drawer-edit {
  background: transparent; color: var(--text3); font-size: 18px;
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.drawer-edit:hover { background: rgba(232,168,56,0.15); color: var(--accent); }
.drawer-del {
  background: transparent; color: var(--text3); font-size: 18px;
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.drawer-del:hover { background: rgba(232,64,64,0.15); color: var(--danger); }
.drawer-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  padding: 40px 20px; color: var(--text3); text-align: center;
}
.drawer-empty p { font-size: 14px; }
.drawer-empty small { font-size: 12px; }
</style>
