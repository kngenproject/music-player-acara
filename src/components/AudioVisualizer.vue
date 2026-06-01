<template>
  <div class="visualizer-wrap" :class="{ landscape: isLandscape }">
    <!-- VU Meter Bar -->
    <div class="vu-section">
      <div class="vu-label">L</div>
      <div class="vu-track">
        <div class="vu-bar" :style="{ width: vuLeft + '%' }"
          :class="{ peak: vuLeft > 85, high: vuLeft > 65 }"></div>
        <div class="vu-peak-line" :style="{ left: peakLeft + '%' }"></div>
      </div>
      <div class="vu-track">
        <div class="vu-bar" :style="{ width: vuRight + '%' }"
          :class="{ peak: vuRight > 85, high: vuRight > 65 }"></div>
        <div class="vu-peak-line" :style="{ left: peakRight + '%' }"></div>
      </div>
      <div class="vu-label">R</div>
    </div>

    <!-- Spectrum -->
    <div class="spectrum-section">
      <canvas ref="canvasRef" class="spectrum-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  getAnalyser: Function,
  getAudioCtx: Function,
  isPlaying: Boolean,
  isLandscape: { type: Boolean, default: false }
})

const canvasRef = ref(null)
const vuLeft = ref(0)
const vuRight = ref(0)
const peakLeft = ref(0)
const peakRight = ref(0)

let animId = null
let peakHoldL = 0
let peakHoldR = 0
let peakTimerL = 0
let peakTimerR = 0

function draw() {
  animId = requestAnimationFrame(draw)

  const analyser = props.getAnalyser?.()
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  ctx.clearRect(0, 0, W, H)

  if (!analyser || !props.isPlaying) {
    vuLeft.value = Math.max(0, vuLeft.value - 3)
    vuRight.value = Math.max(0, vuRight.value - 3)
    drawIdleSpectrum(ctx, W, H)
    return
  }

  const bufLen = analyser.frequencyBinCount
  const data = new Uint8Array(bufLen)
  analyser.getByteFrequencyData(data)

  const half = Math.floor(bufLen / 2)
  let sumL = 0, sumR = 0
  for (let i = 0; i < half; i++) sumL += data[i]
  for (let i = half; i < bufLen; i++) sumR += data[i]
  const rawL = (sumL / half / 255) * 100
  const rawR = (sumR / (bufLen - half) / 255) * 100

  vuLeft.value = vuLeft.value * 0.6 + rawL * 0.4
  vuRight.value = vuRight.value * 0.6 + rawR * 0.4

  const now = Date.now()
  if (vuLeft.value > peakHoldL) { peakHoldL = vuLeft.value; peakTimerL = now + 1200 }
  else if (now > peakTimerL) peakHoldL = Math.max(0, peakHoldL - 0.8)
  if (vuRight.value > peakHoldR) { peakHoldR = vuRight.value; peakTimerR = now + 1200 }
  else if (now > peakTimerR) peakHoldR = Math.max(0, peakHoldR - 0.8)
  peakLeft.value = peakHoldL
  peakRight.value = peakHoldR

  const barCount = props.isLandscape ? 48 : 40
  const gap = 2
  const barW = Math.floor((W - gap * (barCount - 1)) / barCount)
  const step = Math.floor(bufLen / barCount)

  for (let i = 0; i < barCount; i++) {
    let sum = 0
    for (let j = 0; j < step; j++) sum += data[i * step + j]
    const val = sum / step / 255
    const barH = Math.pow(val, 0.7) * H
    const x = i * (barW + gap)
    const y = H - barH
    const hue = 45 + (i / barCount) * (-30)
    const grad = ctx.createLinearGradient(0, H, 0, 0)
    grad.addColorStop(0, `hsla(${hue}, 90%, 55%, 0.9)`)
    grad.addColorStop(0.6, `hsla(${hue + 20}, 85%, 65%, 0.8)`)
    grad.addColorStop(1, `hsla(${hue + 40}, 80%, 70%, 0.6)`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, y, barW, barH, [2, 2, 0, 0])
    ctx.fill()
    ctx.fillStyle = `hsla(${hue}, 80%, 55%, 0.12)`
    ctx.beginPath()
    ctx.roundRect(x, H, barW, barH * 0.25, [0, 0, 2, 2])
    ctx.fill()
  }
}

function drawIdleSpectrum(ctx, W, H) {
  const barCount = props.isLandscape ? 48 : 40
  const gap = 2
  const barW = Math.floor((W - gap * (barCount - 1)) / barCount)
  for (let i = 0; i < barCount; i++) {
    const x = i * (barW + gap)
    ctx.fillStyle = 'rgba(240,180,41,0.07)'
    ctx.beginPath()
    ctx.roundRect(x, H - 2, barW, 2, [1, 1, 0, 0])
    ctx.fill()
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = canvas.offsetWidth * window.devicePixelRatio
  canvas.height = canvas.offsetHeight * window.devicePixelRatio
  const ctx = canvas.getContext('2d')
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  draw()
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.visualizer-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 16px 8px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.vu-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vu-label {
  font-size: 9px;
  font-weight: 800;
  color: var(--text3);
  letter-spacing: 0.5px;
  width: 10px;
  text-align: center;
  flex-shrink: 0;
}

.vu-track {
  flex: 1;
  height: 6px;
  background: var(--surface3);
  border-radius: 3px;
  overflow: visible;
  position: relative;
}

.vu-bar {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #38c172 0%, #f0b429 70%, #e85555 100%);
  transition: width 0.05s linear;
  max-width: 100%;
}
.vu-bar.high {
  background: linear-gradient(90deg, #38c172 0%, #f0b429 60%, #f0b429 100%);
}
.vu-bar.peak {
  background: linear-gradient(90deg, #38c172 0%, #f0b429 55%, #e85555 100%);
}

.vu-peak-line {
  position: absolute;
  top: -1px;
  width: 2px;
  height: calc(100% + 2px);
  background: rgba(255,255,255,0.7);
  border-radius: 1px;
  transition: left 0.05s linear;
  transform: translateX(-1px);
}

.spectrum-section {
  width: 100%;
  height: 56px;
}

.spectrum-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.visualizer-wrap.landscape .spectrum-section {
  height: 70px;
}
</style>
