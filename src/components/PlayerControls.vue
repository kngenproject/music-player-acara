<template>
  <div class="player-controls">
    <!-- Track Info -->
    <div class="track-info">
      <div class="track-name-wrap">
        <div class="track-name-scroll" :class="{ scrolling: trackName && trackName.length > 26 }">
          <span>{{ trackName || 'Belum ada lagu' }}</span>
          <span v-if="trackName && trackName.length > 26" aria-hidden="true">{{ trackName }}</span>
        </div>
      </div>
    </div>

    <!-- Seek Bar -->
    <div class="seek-wrap">
      <span class="time">{{ formatTime(currentTime) }}</span>
      <div class="seek-bar" @click="onSeek" @touchstart.prevent="onSeekTouch" ref="seekRef">
        <div class="seek-track">
          <div class="seek-fill" :style="{ width: progressPercent + '%' }"></div>
          <div class="seek-thumb" :style="{ left: progressPercent + '%' }"></div>
        </div>
      </div>
      <span class="time right">{{ formatTime(duration) }}</span>
    </div>

    <!-- Main Controls -->
    <div class="main-controls">
      <button class="ctrl-btn" @click="$emit('prev')" :disabled="!hasTrack" aria-label="Sebelumnya">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
        </svg>
      </button>

      <button class="ctrl-btn play-btn" @click="$emit('toggle-play')" :disabled="!hasTrack" aria-label="Play/Pause">
        <svg v-if="!isPlaying" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>

      <button class="ctrl-btn" @click="$emit('next')" :disabled="!hasTrack" aria-label="Berikutnya">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zm2-8.14 5.12 2.64L8 15.14V9.86zM16 6h2v12h-2z"/>
        </svg>
      </button>
    </div>

    <!-- Mode + Fade row -->
    <div class="bottom-row">
      <div class="mode-controls">
        <button class="mode-btn" :class="{ active: isShuffling }" @click="$emit('toggle-shuffle')" title="Shuffle" aria-label="Shuffle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
          </svg>
        </button>
        <button class="mode-btn" :class="{ active: isLooping }" @click="$emit('toggle-loop')" title="Loop lagu" aria-label="Loop lagu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
          </svg>
        </button>
        <button class="mode-btn" :class="{ active: isLoopingAll }" @click="$emit('toggle-loop-all')" title="Loop semua" aria-label="Loop semua">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
        </button>
        <button class="mode-btn" :class="{ active: crossfadeEnabled }" @click="$emit('toggle-crossfade')" title="Crossfade" aria-label="Crossfade">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M3 18c3-6 6-6 9 0s6 6 9 0"/>
          </svg>
        </button>
      </div>

      <div class="fade-settings">
        <span class="fade-label">IN</span>
        <div class="fade-presets">
          <button v-for="p in presets" :key="p.value"
            class="preset-btn" :class="{ active: fadeInPreset === p.value }"
            @click="$emit('set-fade-in-preset', p.value)">{{ p.label }}</button>
        </div>
        <div class="fade-custom" v-if="fadeInPreset === 'custom'">
          <input type="number" min="0.5" max="30" step="0.5"
            :value="fadeInDuration"
            @input="$emit('set-fade-in-duration', parseFloat($event.target.value))"
            class="custom-input" />
          <span class="fade-unit">s</span>
        </div>
        <span class="fade-val" v-else>{{ fadeInDuration }}s</span>
      </div>
      <div class="fade-settings">
        <span class="fade-label">OUT</span>
        <div class="fade-presets">
          <button v-for="p in presets" :key="p.value"
            class="preset-btn" :class="{ active: fadeOutPreset === p.value }"
            @click="$emit('set-fade-out-preset', p.value)">{{ p.label }}</button>
        </div>
        <div class="fade-custom" v-if="fadeOutPreset === 'custom'">
          <input type="number" min="0.5" max="30" step="0.5"
            :value="fadeOutDuration"
            @input="$emit('set-fade-out-duration', parseFloat($event.target.value))"
            class="custom-input" />
          <span class="fade-unit">s</span>
        </div>
        <span class="fade-val" v-else>{{ fadeOutDuration }}s</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  trackName: String,
  isPlaying: Boolean,
  hasTrack: Boolean,
  currentTime: Number,
  duration: Number,
  progressPercent: Number,
  isLooping: Boolean,
  isLoopingAll: Boolean,
  isShuffling: Boolean,
  crossfadeEnabled: Boolean,
  fadeInPreset: String,
  fadeOutPreset: String,
  fadeInDuration: Number,
  fadeOutDuration: Number,
  formatTime: Function
})

const emit = defineEmits([
  'toggle-play','prev','next',
  'toggle-loop','toggle-loop-all','toggle-shuffle','toggle-crossfade',
  'seek','set-fade-in-preset','set-fade-in-duration','set-fade-out-preset','set-fade-out-duration'
])

const seekRef = ref(null)

const presets = [
  { label: '1s', value: '1' },
  { label: '2s', value: '2' },
  { label: '3s', value: '3' },
  { label: '5s', value: '5' },
  { label: '…',  value: 'custom' }
]

function getSeekRatio(clientX) {
  if (!seekRef.value) return 0
  const rect = seekRef.value.getBoundingClientRect()
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
}

function onSeek(e) {
  emit('seek', getSeekRatio(e.clientX) * props.duration)
}

function onSeekTouch(e) {
  emit('seek', getSeekRatio(e.touches[0].clientX) * props.duration)
}
</script>

<style scoped>
.player-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 18px 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

/* Track Info */
.track-info {
  overflow: hidden;
  text-align: center;
  min-height: 28px;
}

.track-name-wrap {
  overflow: hidden;
  position: relative;
}

.track-name-scroll {
  display: flex;
  gap: 40px;
  white-space: nowrap;
  overflow: hidden;
}

.track-name-scroll span {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.2px;
  flex-shrink: 0;
}

.track-name-scroll.scrolling {
  animation: marquee 12s linear infinite;
}

@keyframes marquee {
  0%, 10%  { transform: translateX(0); }
  90%, 100% { transform: translateX(calc(-50% - 20px)); }
}

/* Seek */
.seek-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time {
  font-size: 11px;
  font-weight: 600;
  color: var(--text2);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  letter-spacing: 0.3px;
}
.time.right { text-align: right; }

.seek-bar {
  flex: 1;
  padding: 10px 0;
  cursor: pointer;
}

.seek-track {
  position: relative;
  height: 5px;
  background: var(--surface3);
  border-radius: 10px;
}

.seek-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent2), var(--accent));
  border-radius: 10px;
  transition: width 0.15s linear;
}

.seek-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 18px; height: 18px;
  background: #fff;
  border-radius: 50%;
  border: 2.5px solid var(--accent);
  box-shadow: 0 0 0 4px var(--accent-glow);
  transition: left 0.15s linear;
}

/* Main Controls */
.main-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.ctrl-btn {
  background: var(--surface2);
  color: var(--text);
  border-radius: 50%;
  width: 52px; height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border2);
}

.ctrl-btn:hover:not(:disabled) { background: var(--surface3); }
.ctrl-btn:disabled { opacity: 0.25; cursor: not-allowed; }

.play-btn {
  background: var(--accent) !important;
  color: #000 !important;
  width: 68px !important; height: 68px !important;
  border: none !important;
  box-shadow: 0 0 0 8px var(--accent-soft), 0 4px 24px rgba(240,180,41,0.35);
}
.play-btn:hover:not(:disabled) {
  box-shadow: 0 0 0 12px var(--accent-soft), 0 4px 32px rgba(240,180,41,0.5);
}

/* Bottom row */
.bottom-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-controls {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.mode-btn {
  background: var(--surface2);
  color: var(--text3);
  border-radius: var(--radius-sm);
  width: 46px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  transition: all 0.15s;
}
.mode-btn:hover { background: var(--surface3); color: var(--text2); }
.mode-btn.active {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: rgba(240,180,41,0.3);
}

/* Fade */
.fade-settings {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface2);
  border-radius: var(--radius-sm);
  padding: 7px 12px;
  border: 1px solid var(--border);
}

.fade-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--text3);
}

.fade-presets {
  display: flex;
  gap: 3px;
  flex: 1;
}

.preset-btn {
  background: var(--surface3);
  color: var(--text2);
  border-radius: var(--radius-xs);
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  flex: 1;
  border: 1px solid transparent;
}
.preset-btn:hover { background: var(--surface4); color: var(--text); }
.preset-btn.active {
  background: var(--accent);
  color: #000;
}

.fade-val {
  font-size: 12px;
  color: var(--accent);
  font-weight: 700;
  min-width: 26px;
  text-align: right;
}

.fade-custom {
  display: flex;
  align-items: center;
  gap: 3px;
}

.custom-input {
  background: var(--surface3);
  color: var(--text);
  border: 1px solid var(--border2);
  border-radius: var(--radius-xs);
  padding: 3px 6px;
  width: 48px;
  font-size: 12px;
  font-family: inherit;
  text-align: center;
  outline: none;
}

.fade-unit { font-size: 11px; color: var(--text2); }

/* ── LANDSCAPE: kompak ── */
@media (orientation: landscape) and (max-height: 500px) {
  .player-controls {
    gap: 8px;
    padding: 10px 16px 10px;
  }

  .track-info { min-height: 22px; }
  .track-name-scroll span { font-size: 15px; }

  .seek-bar { padding: 6px 0; }

  .main-controls { gap: 12px; }
  .ctrl-btn { width: 44px; height: 44px; }
  .play-btn { width: 58px !important; height: 58px !important; }

  .bottom-row { flex-direction: row; align-items: center; gap: 10px; }
  .mode-controls { gap: 4px; }
  .mode-btn { width: 38px; height: 32px; }
  .fade-settings { flex: 1; padding: 5px 10px; }
}
</style>
