<template>
  <div class="volume-panel" :class="{ landscape: isLandscape, inline: isInline }">

    <!-- Baris 1: Volume control -->
    <div class="volume-row">
      <button class="mute-btn" @click="$emit('toggle-mute')" :class="{ muted: isMuted }" aria-label="Toggle mute">
        <svg v-if="isMuted" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 19L19 20.27 20.27 19 5.27 4 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
        </svg>
        <svg v-else-if="volume > 0.6" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        <svg v-else-if="volume > 0.2" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
        </svg>
      </button>
      <div class="vol-label">{{ Math.round(volume * 100) }}<span>%</span></div>
      <div class="slider-track-wrap" @click="onTrackClick" @touchstart.prevent="onTrackTouch" ref="trackRef">
        <div class="slider-track">
          <div class="slider-fill" :style="fillStyle"></div>
          <div class="slider-thumb" :style="thumbStyle"
            @mousedown="startDrag"
            @touchstart.prevent="startDrag"
          ></div>
        </div>
      </div>
    </div>

    <!-- Baris 2: Fade buttons -->
    <div class="fade-row">
      <button class="fade-btn fade-in-btn" @click="$emit('fade-in')" title="Fade In" aria-label="Fade In">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
        <span>IN</span>
      </button>
      <button class="fade-btn fade-out-btn" @click="$emit('fade-out')" title="Fade Out" aria-label="Fade Out">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
          <polyline points="17 18 23 18 23 12"/>
        </svg>
        <span>OUT</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  volume: Number,
  isMuted: Boolean,
  isLandscape: { type: Boolean, default: false },
  isInline: { type: Boolean, default: false }
})
const emit = defineEmits(['update:volume','toggle-mute','fade-in','fade-out'])

const trackRef = ref(null)
let dragging = false

const fillStyle = computed(() => ({
  width: props.volume * 100 + '%', height: '100%', top: 0, left: 0, bottom: 'auto', right: 'auto'
}))

const thumbStyle = computed(() => ({
  left: props.volume * 100 + '%', bottom: 'auto', top: '50%', transform: 'translate(-50%, -50%)'
}))

function getVolFromEvent(e) {
  const track = trackRef.value
  if (!track) return props.volume
  const rect = track.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
}

function onTrackClick(e) { emit('update:volume', getVolFromEvent(e)) }
function onTrackTouch(e) { emit('update:volume', getVolFromEvent(e)) }

function startDrag(e) {
  dragging = true
  const move = (ev) => { if (dragging) emit('update:volume', getVolFromEvent(ev)) }
  const up = () => {
    dragging = false
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
    window.removeEventListener('touchmove', move)
    window.removeEventListener('touchend', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
  window.addEventListener('touchmove', move, { passive: false })
  window.addEventListener('touchend', up)
}
</script>

<style scoped>
/* ══ BASE: dua baris horizontal ══ */
.volume-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--surface);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

/* Baris 1: Volume */
.volume-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.mute-btn {
  background: var(--surface2);
  border-radius: 50%;
  width: 38px; height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text2);
  border: 1px solid var(--border2);
  flex-shrink: 0;
  transition: all 0.15s;
}
.mute-btn:hover { background: var(--surface3); color: var(--text); }
.mute-btn.muted { color: var(--text3); }

.vol-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  min-width: 34px;
  text-align: right;
  flex-shrink: 0;
}
.vol-label span { font-size: 9px; opacity: 0.7; }

.slider-track-wrap {
  flex: 1;
  padding: 8px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 16px;
  background: var(--surface3);
  border-radius: 10px;
  overflow: visible;
  border: 1px solid var(--border);
}

.slider-fill {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  background: linear-gradient(90deg, var(--accent2), var(--accent));
  border-radius: 10px;
  transition: width 0.05s;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 26px; height: 26px;
  background: var(--bg);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.6);
  border: 3px solid var(--accent);
  cursor: grab;
  z-index: 2;
  transition: left 0.05s;
}
.slider-thumb:active { cursor: grabbing; transform: translate(-50%, -50%) scale(1.15); }

/* Baris 2: Fade buttons */
.fade-row {
  display: flex;
  gap: 8px;
  padding: 8px 14px;
}

.fade-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.fade-in-btn {
  background: var(--success-soft);
  color: var(--success);
  border-color: rgba(56,193,114,0.15);
}
.fade-in-btn:hover { background: rgba(56,193,114,0.18); }
.fade-out-btn {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: rgba(232,85,85,0.15);
}
.fade-out-btn:hover { background: rgba(232,85,85,0.18); }

/* ══ LANDSCAPE & INLINE: tetap dua baris, padding lebih kecil ══ */
.volume-panel.landscape,
.volume-panel.inline {
  border-top: 1px solid var(--border);
}
.volume-panel.landscape .volume-row,
.volume-panel.inline .volume-row {
  padding: 8px 14px;
}
.volume-panel.landscape .fade-row,
.volume-panel.inline .fade-row {
  padding: 6px 14px;
}
.volume-panel.landscape .fade-btn,
.volume-panel.inline .fade-btn {
  padding: 6px 10px;
}
</style>
