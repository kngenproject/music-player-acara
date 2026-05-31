<template>
  <div class="volume-panel" :class="{ landscape: isLandscape }">
    <button class="mute-btn" @click="$emit('toggle-mute')" :class="{ muted: isMuted }">
      <span v-if="isMuted">🔇</span>
      <span v-else-if="volume > 0.6">🔊</span>
      <span v-else-if="volume > 0.2">🔉</span>
      <span v-else>🔈</span>
    </button>

    <div class="slider-wrap">
      <div class="vol-label">{{ Math.round(volume * 100) }}%</div>
      <div class="slider-track-wrap" @click="onTrackClick" ref="trackRef">
        <div class="slider-track">
          <div class="slider-fill" :style="fillStyle"></div>
          <div class="slider-thumb" :style="thumbStyle"
            @mousedown="startDrag"
            @touchstart.prevent="startDrag"
          ></div>
        </div>
      </div>
    </div>

    <div class="fade-btns">
      <button class="fade-btn fade-in-btn" @click="$emit('fade-in')" title="Fade In">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
        <span>IN</span>
      </button>
      <button class="fade-btn fade-out-btn" @click="$emit('fade-out')" title="Fade Out">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
  isLandscape: { type: Boolean, default: false }
})
const emit = defineEmits(['update:volume', 'toggle-mute', 'fade-in', 'fade-out'])

const trackRef = ref(null)
let dragging = false

// Portrait: fill dari bawah (height%), thumb dari bawah
// Landscape: fill dari kiri (width%), thumb dari kiri
const fillStyle = computed(() =>
  props.isLandscape
    ? { width: props.volume * 100 + '%', height: '100%', top: 0, left: 0, bottom: 'auto', right: 'auto',
        background: 'linear-gradient(to right, var(--accent2), var(--accent))' }
    : { height: props.volume * 100 + '%' }
)

const thumbStyle = computed(() =>
  props.isLandscape
    ? { left: props.volume * 100 + '%', bottom: 'auto', top: '50%',
        transform: 'translate(-50%, -50%)' }
    : { bottom: props.volume * 100 + '%' }
)

function getVolFromEvent(e) {
  const track = trackRef.value
  if (!track) return props.volume
  const rect = track.getBoundingClientRect()
  if (props.isLandscape) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  } else {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height))
  }
}

function onTrackClick(e) { emit('update:volume', getVolFromEvent(e)) }

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
/* ── PORTRAIT (default): panel vertikal di kiri ── */
.volume-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 10px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  width: 72px;
  height: 100%;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.mute-btn {
  background: var(--surface2);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mute-btn.muted { opacity: 0.45; }
.mute-btn:hover { background: var(--surface3); }

.slider-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 0;
}

.vol-label {
  font-size: 11px;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.slider-track-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  cursor: pointer;
  padding: 8px 0;
  min-height: 0;
}

/* Portrait: track vertikal */
.slider-track {
  position: relative;
  width: 20px;
  height: 100%;
  background: var(--surface3);
  border-radius: 10px;
  overflow: visible;
}

.slider-fill {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, var(--accent2), var(--accent));
  border-radius: 10px;
  transition: height 0.05s, width 0.05s;
}

.slider-thumb {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 50%);
  width: 26px; height: 26px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  border: 3px solid var(--accent);
  cursor: grab;
  z-index: 2;
  transition: bottom 0.05s, left 0.05s, top 0.05s;
}
.slider-thumb:active { cursor: grabbing; transform: translate(-50%, 50%) scale(1.12); }

.fade-btns {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  flex-shrink: 0;
}

.fade-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 7px 4px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  width: 100%;
}
.fade-in-btn  { background: rgba(64,192,112,0.15); color: var(--success); }
.fade-in-btn:hover  { background: rgba(64,192,112,0.25); }
.fade-out-btn { background: rgba(232,64,64,0.15);  color: var(--danger); }
.fade-out-btn:hover { background: rgba(232,64,64,0.25); }

/* ── LANDSCAPE: strip horizontal di bawah player ── */
.volume-panel.landscape {
  flex-direction: row;
  width: 100%;
  height: 64px;
  padding: 0 14px;
  gap: 12px;
  border-right: none;
  border-top: 1px solid var(--border);
  align-items: center;
  flex-shrink: 0;
}

.volume-panel.landscape .slider-wrap {
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  width: auto;
  min-height: auto;
}

.volume-panel.landscape .slider-track-wrap {
  flex: 1;
  height: auto;
  padding: 0;
  display: flex;
  align-items: center;
}

/* Landscape: track horizontal */
.volume-panel.landscape .slider-track {
  width: 100%;
  height: 18px;
}

.volume-panel.landscape .fade-btns {
  flex-direction: row;
  gap: 6px;
  width: auto;
}

.volume-panel.landscape .fade-btn {
  flex-direction: row;
  padding: 5px 10px;
  gap: 4px;
  width: auto;
  font-size: 10px;
}
</style>
