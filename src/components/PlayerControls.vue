<template>
  <div class="player-controls">
    <!-- Track Info -->
    <div class="track-info">
      <div class="track-name-scroll">
        <span :class="{ scrolling: trackName && trackName.length > 28 }">
          {{ trackName || 'Tidak ada lagu' }}
        </span>
      </div>
    </div>

    <!-- Seek Bar -->
    <div class="seek-wrap">
      <span class="time">{{ formatTime(currentTime) }}</span>
      <div class="seek-bar" @click="onSeek" ref="seekRef">
        <div class="seek-track">
          <div class="seek-fill" :style="{ width: progressPercent + '%' }"></div>
          <div class="seek-thumb" :style="{ left: progressPercent + '%' }"></div>
        </div>
      </div>
      <span class="time">{{ formatTime(duration) }}</span>
    </div>

    <!-- Main Controls -->
    <div class="main-controls">
      <button class="ctrl-btn small" @click="$emit('prev')" :disabled="!hasTrack">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
        </svg>
      </button>

      <button class="ctrl-btn play-btn" @click="$emit('toggle-play')" :disabled="!hasTrack">
        <svg v-if="!isPlaying" width="38" height="38" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else width="38" height="38" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>

      <button class="ctrl-btn small" @click="$emit('next')" :disabled="!hasTrack">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zm2-8.14 5.12 2.64L8 15.14V9.86zM16 6h2v12h-2z"/>
        </svg>
      </button>
    </div>

    <!-- Mode Controls -->
    <div class="mode-controls">
      <button class="mode-btn" :class="{ active: isShuffling }" @click="$emit('toggle-shuffle')" title="Shuffle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
        </svg>
      </button>

      <button class="mode-btn" :class="{ active: isLooping }" @click="$emit('toggle-loop')" title="Loop lagu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
        </svg>
      </button>

      <button class="mode-btn" :class="{ active: isLoopingAll }" @click="$emit('toggle-loop-all')" title="Loop semua">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
        </svg>
      </button>

      <button class="mode-btn" :class="{ active: crossfadeEnabled }" @click="$emit('toggle-crossfade')" title="Crossfade">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 18c3-6 6-6 9 0s6 6 9 0"/>
        </svg>
      </button>
    </div>

    <!-- Fade Settings -->
    <div class="fade-settings">
      <span class="fade-label">FADE</span>
      <div class="fade-presets">
        <button
          v-for="p in presets"
          :key="p.value"
          class="preset-btn"
          :class="{ active: fadePreset === p.value }"
          @click="$emit('set-fade-preset', p.value)"
        >{{ p.label }}</button>
      </div>
      <div class="fade-custom" v-if="fadePreset === 'custom'">
        <input
          type="number"
          min="0.5"
          max="30"
          step="0.5"
          :value="fadeDuration"
          @input="$emit('set-fade-duration', parseFloat($event.target.value))"
          class="custom-input"
        />
        <span class="fade-unit">dtk</span>
      </div>
      <span class="fade-val" v-else>{{ fadeDuration }}s</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

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
  fadePreset: String,
  fadeDuration: Number,
  formatTime: Function
})

const emit = defineEmits([
  'toggle-play', 'prev', 'next',
  'toggle-loop', 'toggle-loop-all', 'toggle-shuffle', 'toggle-crossfade',
  'seek', 'set-fade-preset', 'set-fade-duration'
])

const seekRef = ref(null)

const presets = [
  { label: '1s', value: '1' },
  { label: '2s', value: '2' },
  { label: '3s', value: '3' },
  { label: '5s', value: '5' },
  { label: '…', value: 'custom' }
]

function onSeek(e) {
  if (!seekRef.value) return
  const rect = seekRef.value.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  emit('seek', Math.max(0, Math.min(1, ratio)) * props.duration)
}
</script>

<style scoped>
.player-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.track-info {
  text-align: center;
  overflow: hidden;
}

.track-name-scroll {
  overflow: hidden;
  white-space: nowrap;
}

.track-name-scroll span {
  display: inline-block;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.track-name-scroll span.scrolling {
  animation: marquee 10s linear infinite;
}

@keyframes marquee {
  0%, 15% { transform: translateX(0); }
  85%, 100% { transform: translateX(-60%); }
}

.seek-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time {
  font-size: 12px;
  color: var(--text2);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
}

.time:last-child { text-align: right; }

.seek-bar {
  flex: 1;
  padding: 8px 0;
  cursor: pointer;
}

.seek-track {
  position: relative;
  height: 6px;
  background: var(--surface3);
  border-radius: 3px;
}

.seek-fill {
  height: 100%;
  background: linear-gradient(to right, var(--accent2), var(--accent));
  border-radius: 3px;
  transition: width 0.2s linear;
}

.seek-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  border: 2px solid var(--accent);
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  transition: left 0.2s linear;
}

.main-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.ctrl-btn {
  background: var(--surface2);
  color: var(--text);
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctrl-btn:hover:not(:disabled) { background: var(--surface3); }
.ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.ctrl-btn.small { width: 48px; height: 48px; }

.play-btn {
  background: var(--accent) !important;
  color: #000 !important;
  width: 72px !important;
  height: 72px !important;
  box-shadow: 0 4px 20px rgba(232,168,56,0.4);
}
.play-btn:hover:not(:disabled) { background: var(--accent2) !important; box-shadow: 0 4px 24px rgba(232,168,56,0.6); }

.mode-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.mode-btn {
  background: var(--surface2);
  color: var(--text3);
  border-radius: var(--radius-sm);
  width: 44px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.mode-btn:hover { background: var(--surface3); color: var(--text); }
.mode-btn.active { background: rgba(232,168,56,0.15); color: var(--accent); }

.fade-settings {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface2);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}

.fade-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text3);
}

.fade-presets {
  display: flex;
  gap: 4px;
  flex: 1;
}

.preset-btn {
  background: var(--surface3);
  color: var(--text2);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  flex: 1;
}
.preset-btn:hover { background: var(--border); color: var(--text); }
.preset-btn.active { background: var(--accent); color: #000; }

.fade-val {
  font-size: 12px;
  color: var(--accent);
  font-weight: 700;
  min-width: 28px;
  text-align: right;
}

.fade-custom {
  display: flex;
  align-items: center;
  gap: 4px;
}

.custom-input {
  background: var(--surface3);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 6px;
  width: 52px;
  font-size: 13px;
  text-align: center;
  outline: none;
}

.fade-unit {
  font-size: 11px;
  color: var(--text2);
}
</style>
