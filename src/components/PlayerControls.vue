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

      <div class="play-wrap">
        <div class="play-pause-pair">
          <button class="ctrl-btn pause-btn" @click="$emit('pause')" :disabled="!hasTrack || !isPlaying" aria-label="Pause">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button class="ctrl-btn play-btn" @click="$emit('play')" :disabled="!hasTrack || isPlaying" aria-label="Play">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
        <div class="play-status-dot" :class="{ playing: isPlaying, paused: hasTrack && !isPlaying }"></div>
      </div>

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
        <div class="fade-dot fade-in-dot" :class="{ active: isFadingIn }"></div>
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
        <div class="fade-dot fade-out-dot" :class="{ active: isFadingOut }"></div>
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
  isFadingIn: Boolean,
  isFadingOut: Boolean,
  formatTime: Function
})

const emit = defineEmits([
  'play','pause','prev','next',
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

.play-pause-pair {
  display: flex;
  align-items: center;
  gap: 10px;
}

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
.play-btn:disabled {
  opacity: 0.3 !important;
  cursor: not-allowed;
  box-shadow: none !important;
}

.pause-btn {
  background: var(--surface2) !important;
  color: var(--text) !important;
  width: 52px !important; height: 52px !important;
  border: 1px solid var(--border2) !important;
}
.pause-btn:hover:not(:disabled) { background: var(--surface3) !important; }
.pause-btn:disabled {
  opacity: 0.25 !important;
  cursor: not-allowed;
}

.play-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.play-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--border2);
  transition: background 0.2s, box-shadow 0.2s;
}
.play-status-dot.playing {
  background: var(--success);
  box-shadow: 0 0 0 3px rgba(56,193,114,0.25);
  animation: dot-pulse 0.8s ease-in-out infinite;
}
.play-status-dot.paused {
  background: var(--accent);
  box-shadow: 0 0 0 3px rgba(240,180,41,0.2);
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

/* Titik indikator fade */
.fade-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--border2);
  flex-shrink: 0;
  transition: background 0.2s;
}
.fade-in-dot.active {
  background: var(--success);
  box-shadow: 0 0 0 3px rgba(56,193,114,0.25);
  animation: dot-pulse 0.8s ease-in-out infinite;
}
.fade-out-dot.active {
  background: var(--danger);
  box-shadow: 0 0 0 3px rgba(232,85,85,0.25);
  animation: dot-pulse 0.8s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.75); }
}

/* ══ TABLET PORTRAIT 600px+ ══ */
@media (min-width: 600px) and (orientation: portrait) {
  .player-controls {
    gap: 18px;
    padding: 22px 24px 18px;
  }

  .track-name-scroll span {
    font-size: 21px;
  }

  .time {
    font-size: 13px;
    min-width: 44px;
  }

  .seek-thumb {
    width: 22px; height: 22px;
  }

  .seek-track {
    height: 6px;
  }

  .main-controls {
    gap: 22px;
  }

  .ctrl-btn {
    width: 62px; height: 62px;
  }
  .ctrl-btn svg {
    width: 30px; height: 30px;
  }

  .play-btn {
    width: 82px !important; height: 82px !important;
  }
  .play-btn svg {
    width: 42px !important; height: 42px !important;
  }

  .pause-btn {
    width: 62px !important; height: 62px !important;
  }
  .pause-btn svg {
    width: 32px !important; height: 32px !important;
  }

  .play-pause-pair {
    gap: 14px;
  }

  .mode-btn {
    width: 56px; height: 44px;
  }
  .mode-btn svg {
    width: 22px; height: 22px;
  }

  .fade-settings {
    padding: 9px 16px;
    gap: 10px;
  }

  .fade-label {
    font-size: 10px;
    letter-spacing: 2px;
  }

  .preset-btn {
    padding: 6px 10px;
    font-size: 13px;
  }

  .fade-val {
    font-size: 13px;
    min-width: 30px;
  }

  .custom-input {
    width: 56px;
    font-size: 13px;
    padding: 4px 8px;
  }

  .fade-dot {
    width: 9px; height: 9px;
  }
}

/* ══ TABLET PORTRAIT 768px+ split layout: controls lebih compact ══ */
@media (min-width: 768px) and (orientation: portrait) {
  .player-controls {
    gap: 14px;
    padding: 18px 20px 14px;
  }

  .track-name-scroll span {
    font-size: 18px;
  }

  .main-controls {
    gap: 18px;
  }

  .ctrl-btn {
    width: 56px; height: 56px;
  }
  .ctrl-btn svg {
    width: 26px; height: 26px;
  }

  .play-btn {
    width: 74px !important; height: 74px !important;
  }
  .play-btn svg {
    width: 36px !important; height: 36px !important;
  }

  .pause-btn {
    width: 56px !important; height: 56px !important;
  }
  .pause-btn svg {
    width: 28px !important; height: 28px !important;
  }
}
@media (orientation: landscape) and (max-height: 500px) {
  .player-controls {
    gap: 6px;
    padding: 6px 12px;
  }

  .track-info { min-height: 18px; }
  .track-name-scroll span { font-size: 13px; }

  .seek-wrap { gap: 6px; }
  .time { font-size: 10px; min-width: 28px; }
  .seek-bar { padding: 4px 0; }
  .seek-thumb { width: 14px; height: 14px; }

  .main-controls { gap: 10px; }
  .ctrl-btn { width: 38px; height: 38px; }
  .ctrl-btn svg { width: 20px; height: 20px; }
  .play-btn { width: 50px !important; height: 50px !important; }
  .play-btn svg { width: 26px !important; height: 26px !important; }
  .pause-btn { width: 38px !important; height: 38px !important; }
  .pause-btn svg { width: 20px !important; height: 20px !important; }
  .play-pause-pair { gap: 6px; }

  .bottom-row { flex-direction: row; align-items: center; gap: 6px; }
  .mode-controls { gap: 3px; }
  .mode-btn { width: 32px; height: 28px; }
  .mode-btn svg { width: 14px; height: 14px; }
  .fade-settings { flex: 1; padding: 4px 8px; gap: 5px; }
  .fade-label { font-size: 8px; }
  .preset-btn { padding: 3px 5px; font-size: 10px; }
  .fade-val { font-size: 10px; min-width: 20px; }
}
</style>
