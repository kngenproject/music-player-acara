<template>
  <div class="app" @keydown.space.prevent="player.togglePlay()" tabindex="0" ref="appRef">
    <!-- Hidden file inputs -->
    <input type="file" ref="fileInput" multiple accept="audio/*" @change="onFilesSelected" style="display:none" />
    <input type="file" ref="folderInput" webkitdirectory multiple accept="audio/*" @change="onFilesSelected" style="display:none" />

    <!-- Install Banner -->
    <div class="install-banner" v-if="showInstallBanner">
      <span>📲 Install AcaraPlay ke Home Screen</span>
      <button class="install-btn" @click="installPWA">Install</button>
      <button class="close-banner" @click="showInstallBanner = false">✕</button>
    </div>

    <!-- Main Layout -->
    <div class="main-layout">

      <!-- KOLOM KIRI: Volume + Header + Controls (tablet: left panel) -->
      <div class="tablet-left">
        <!-- Volume Slider (kiri di portrait, atas di landscape) -->
        <VolumeSlider
          :volume="player.volume.value"
          :isMuted="player.isMuted.value"
          :isLandscape="isLandscape"
          @update:volume="player.setVolume"
          @toggle-mute="player.toggleMute"
          @fade-in="player.manualFadeIn"
          @fade-out="player.manualFadeOut"
        />

        <!-- Right Content -->
        <div class="right-content">
          <!-- Header -->
          <div class="app-header">
            <div class="app-logo">🎵 AcaraPlay</div>
            <div class="header-status">
              <span class="landscape-badge" v-if="isLandscape">⬛ Tablet</span>
              <span class="pwa-badge" v-if="isPWA">PWA</span>
              <span class="status-dot" :class="{ playing: player.isPlaying.value }"></span>
            </div>
          </div>

          <!-- Player Controls -->
          <PlayerControls
            :trackName="player.currentTrack.value?.name"
            :isPlaying="player.isPlaying.value"
            :hasTrack="player.currentIndex.value >= 0"
            :currentTime="player.currentTime.value"
            :duration="player.duration.value"
            :progressPercent="player.progressPercent.value"
            :isLooping="player.isLooping.value"
            :isLoopingAll="player.isLoopingAll.value"
            :isShuffling="player.isShuffling.value"
            :crossfadeEnabled="player.crossfadeEnabled.value"
            :fadePreset="player.fadePreset.value"
            :fadeDuration="player.fadeDuration.value"
            :formatTime="player.formatTime"
            @toggle-play="player.togglePlay"
            @prev="player.playPrev"
            @next="player.playNext"
            @seek="player.seekTo"
            @toggle-loop="player.isLooping.value = !player.isLooping.value"
            @toggle-loop-all="player.isLoopingAll.value = !player.isLoopingAll.value"
            @toggle-shuffle="player.isShuffling.value = !player.isShuffling.value"
            @toggle-crossfade="player.crossfadeEnabled.value = !player.crossfadeEnabled.value"
            @set-fade-preset="player.setFadePreset"
            @set-fade-duration="player.fadeDuration.value = $event"
          />
        </div>
      </div>

      <!-- KOLOM KANAN: Playlist (muncul penuh di tablet landscape) -->
      <PlaylistPanel
        :playlist="player.playlist.value"
        :currentIndex="player.currentIndex.value"
        :isPlaying="player.isPlaying.value"
        @play-track="(i) => player.loadTrack(i, true)"
        @remove="player.removeTrack"
        @clear="player.clearPlaylist"
        @open-folder="openFolder"
        @add-files="openFiles"
      />

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePlayer } from './composables/usePlayer'
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

function openFiles() { fileInput.value?.click() }
function openFolder() { folderInput.value?.click() }

function onFilesSelected(e) {
  const files = Array.from(e.target.files)
  player.addFiles(files)
  e.target.value = ''
}

function checkOrientation() {
  isLandscape.value = window.innerWidth >= 768 && window.innerWidth > window.innerHeight
}

// Keyboard shortcuts
function onKeydown(e) {
  if (e.target.tagName === 'INPUT') return
  switch(e.key) {
    case ' ': e.preventDefault(); player.togglePlay(); break
    case 'ArrowLeft': e.preventDefault(); player.playPrev(); break
    case 'ArrowRight': e.preventDefault(); player.playNext(); break
    case 'ArrowUp': e.preventDefault(); player.setVolume(Math.min(1, player.volume.value + 0.05)); break
    case 'ArrowDown': e.preventDefault(); player.setVolume(Math.max(0, player.volume.value - 0.05)); break
    case 'm': case 'M': player.toggleMute(); break
    case 'f': case 'F': player.manualFadeOut(); break
    case 'g': case 'G': player.manualFadeIn(); break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', checkOrientation)
  checkOrientation()

  // PWA detection
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isPWA.value = true
  }

  // Install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    showInstallBanner.value = true
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
  if (outcome === 'accepted') {
    showInstallBanner.value = false
    isPWA.value = true
  }
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

.install-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #1a1400, #2a2000);
  border-bottom: 1px solid var(--accent2);
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
}

.close-banner {
  background: transparent;
  color: var(--text2);
  width: 28px;
  height: 28px;
  font-size: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Portrait default: volume kiri, content kanan */
.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* tablet-left = volume panel + right-content, stack vertikal */
.tablet-left {
  display: contents; /* portrait: tidak berubah, elemen langsung ke main-layout */
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--surface);
}

.app-logo {
  font-size: 16px;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.5px;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pwa-badge, .landscape-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 1px;
}

.pwa-badge {
  background: rgba(232,168,56,0.15);
  color: var(--accent);
}

.landscape-badge {
  background: rgba(64,192,112,0.15);
  color: var(--success);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text3);
  transition: background 0.3s;
}
.status-dot.playing {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Tablet Landscape ── */
@media (min-width: 768px) and (orientation: landscape) {
  .main-layout {
    display: grid !important;
    grid-template-columns: 400px 1fr;
    grid-template-rows: 1fr;
  }

  /* tablet-left: kolom kiri, volume di bawah controls */
  .tablet-left {
    display: flex !important;
    flex-direction: column;
    border-right: 1px solid var(--border);
    overflow: hidden;
  }

  /* right-content mengisi sisa kolom kiri */
  .right-content {
    flex: 1;
    order: -1; /* header + controls di atas volume */
  }
}
</style>
