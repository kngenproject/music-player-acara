<template>
  <div class="visualizer-wrap" :class="{ landscape: isLandscape }">
    <!-- Analog VU Meters -->
    <div class="vu-section">
      <div class="vu-meter-wrap">
        <div class="vu-meter" :class="{ peak: vuLeft > 85 }">
          <!-- Scale arc background -->
          <svg class="vu-svg" viewBox="0 0 160 100" preserveAspectRatio="none">
            <!-- Meter background arc -->
            <defs>
              <linearGradient id="scaleGradL" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#38c172"/>
                <stop offset="65%" stop-color="#f0b429"/>
                <stop offset="85%" stop-color="#e85555"/>
                <stop offset="100%" stop-color="#ff2222"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <!-- Scale ticks & arc -->
            <path d="M 14 92 A 74 74 0 0 1 146 92" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="20"/>
            <path d="M 14 92 A 74 74 0 0 1 146 92" fill="none" stroke="url(#scaleGradL)" stroke-width="3" opacity="0.35"/>

            <!-- Tick marks -->
            <g stroke="rgba(255,255,255,0.4)" stroke-width="1">
              <!-- -20dB -->
              <line x1="22.5" y1="83.5" x2="19.5" y2="76.5"/>
              <!-- -10dB -->
              <line x1="43" y1="44" x2="39" y2="38"/>
              <!-- -7dB -->
              <line x1="56" y1="30" x2="52.5" y2="24.5"/>
              <!-- -5dB -->
              <line x1="72" y1="21" x2="69" y2="15"/>
              <!-- -3dB -->
              <line x1="90" y1="18" x2="90" y2="12"/>
              <!-- 0dB -->
              <line x1="108" y1="21" x2="111" y2="15" stroke="rgba(240,180,41,0.9)" stroke-width="1.5"/>
              <!-- +3dB -->
              <line x1="124" y1="30" x2="127.5" y2="24.5" stroke="rgba(232,85,85,0.9)" stroke-width="1.5"/>
            </g>

            <!-- Scale labels -->
            <g font-family="monospace" fill="rgba(255,255,255,0.5)" font-size="7" text-anchor="middle">
              <text x="18" y="74">-20</text>
              <text x="38" y="35">-10</text>
              <text x="68" y="13">-5</text>
              <text x="90" y="10" fill="rgba(240,180,41,0.9)" font-weight="bold">0</text>
              <text x="122" y="13" fill="rgba(232,85,85,0.9)" font-weight="bold">+3</text>
            </g>

            <!-- Needle shadow -->
            <line
              :x1="80 + Math.cos(needleAngleL - Math.PI/2) * 2"
              :y1="92 + Math.sin(needleAngleL - Math.PI/2) * 2"
              :x2="80 + Math.cos(needleAngleL - Math.PI/2) * 68"
              :y2="92 + Math.sin(needleAngleL - Math.PI/2) * 68"
              stroke="rgba(0,0,0,0.4)" stroke-width="2.5" stroke-linecap="round"
            />

            <!-- Needle -->
            <line
              :x1="80 + Math.cos(needleAngleL - Math.PI/2) * 3"
              :y1="92 + Math.sin(needleAngleL - Math.PI/2) * 3"
              :x2="80 + Math.cos(needleAngleL - Math.PI/2) * 66"
              :y2="92 + Math.sin(needleAngleL - Math.PI/2) * 66"
              :stroke="vuLeft > 85 ? '#ff4444' : vuLeft > 65 ? '#f0b429' : '#e8e8d0'"
              stroke-width="1.5" stroke-linecap="round"
              filter="url(#glow)"
            />
            <!-- Needle base circle -->
            <circle cx="80" cy="92" r="4" fill="#1a1a1a" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
            <circle cx="80" cy="92" r="2" :fill="vuLeft > 85 ? '#ff4444' : '#e8e8d0'"/>
          </svg>

          <!-- Red zone indicator -->
          <div class="vu-peak-led" :class="{ active: peakLedL }"></div>
          <div class="vu-channel-label">L</div>
        </div>

        <div class="vu-meter" :class="{ peak: vuRight > 85 }">
          <svg class="vu-svg" viewBox="0 0 160 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="scaleGradR" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#38c172"/>
                <stop offset="65%" stop-color="#f0b429"/>
                <stop offset="85%" stop-color="#e85555"/>
                <stop offset="100%" stop-color="#ff2222"/>
              </linearGradient>
            </defs>

            <path d="M 14 92 A 74 74 0 0 1 146 92" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="20"/>
            <path d="M 14 92 A 74 74 0 0 1 146 92" fill="none" stroke="url(#scaleGradR)" stroke-width="3" opacity="0.35"/>

            <g stroke="rgba(255,255,255,0.4)" stroke-width="1">
              <line x1="22.5" y1="83.5" x2="19.5" y2="76.5"/>
              <line x1="43" y1="44" x2="39" y2="38"/>
              <line x1="56" y1="30" x2="52.5" y2="24.5"/>
              <line x1="72" y1="21" x2="69" y2="15"/>
              <line x1="90" y1="18" x2="90" y2="12"/>
              <line x1="108" y1="21" x2="111" y2="15" stroke="rgba(240,180,41,0.9)" stroke-width="1.5"/>
              <line x1="124" y1="30" x2="127.5" y2="24.5" stroke="rgba(232,85,85,0.9)" stroke-width="1.5"/>
            </g>

            <g font-family="monospace" fill="rgba(255,255,255,0.5)" font-size="7" text-anchor="middle">
              <text x="18" y="74">-20</text>
              <text x="38" y="35">-10</text>
              <text x="68" y="13">-5</text>
              <text x="90" y="10" fill="rgba(240,180,41,0.9)" font-weight="bold">0</text>
              <text x="122" y="13" fill="rgba(232,85,85,0.9)" font-weight="bold">+3</text>
            </g>

            <line
              :x1="80 + Math.cos(needleAngleR - Math.PI/2) * 2"
              :y1="92 + Math.sin(needleAngleR - Math.PI/2) * 2"
              :x2="80 + Math.cos(needleAngleR - Math.PI/2) * 68"
              :y2="92 + Math.sin(needleAngleR - Math.PI/2) * 68"
              stroke="rgba(0,0,0,0.4)" stroke-width="2.5" stroke-linecap="round"
            />
            <line
              :x1="80 + Math.cos(needleAngleR - Math.PI/2) * 3"
              :y1="92 + Math.sin(needleAngleR - Math.PI/2) * 3"
              :x2="80 + Math.cos(needleAngleR - Math.PI/2) * 66"
              :y2="92 + Math.sin(needleAngleR - Math.PI/2) * 66"
              :stroke="vuRight > 85 ? '#ff4444' : vuRight > 65 ? '#f0b429' : '#e8e8d0'"
              stroke-width="1.5" stroke-linecap="round"
              filter="url(#glow)"
            />
            <circle cx="80" cy="92" r="4" fill="#1a1a1a" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
            <circle cx="80" cy="92" r="2" :fill="vuRight > 85 ? '#ff4444' : '#e8e8d0'"/>
          </svg>

          <div class="vu-peak-led" :class="{ active: peakLedR }"></div>
          <div class="vu-channel-label">R</div>
        </div>
      </div>
    </div>

    <!-- Spectrum -->
    <div class="spectrum-section">
      <canvas ref="canvasRef" class="spectrum-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  getAnalyser: Function,
  getAudioCtx: Function,
  isPlaying: Boolean,
  isLandscape: { type: Boolean, default: false }
})

const canvasRef = ref(null)
const vuLeft = ref(0)
const vuRight = ref(0)

// Needle physics
const needleL = ref(0)  // 0..100
const needleR = ref(0)
const needleVelL = ref(0)
const needleVelR = ref(0)
const peakLedL = ref(false)
const peakLedR = ref(false)

let animId = null
let peakLedTimerL = 0
let peakLedTimerR = 0

// Convert 0..100 value to needle angle
// Sweep from -130deg (left, -20dB) to +50deg (right, +3dB)
// Total sweep: 180deg
const MIN_ANGLE = -Math.PI * 130 / 180
const MAX_ANGLE =  Math.PI * 50  / 180

function vuToAngle(vu) {
  // Map 0..100 to angle range with slight log scale feel
  const t = Math.pow(vu / 100, 0.75)
  return MIN_ANGLE + t * (MAX_ANGLE - MIN_ANGLE)
}

const needleAngleL = computed(() => vuToAngle(needleL.value))
const needleAngleR = computed(() => vuToAngle(needleR.value))

function draw() {
  animId = requestAnimationFrame(draw)

  const analyser = props.getAnalyser?.()
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  ctx.clearRect(0, 0, W, H)

  const now = Date.now()

  if (!analyser || !props.isPlaying) {
    vuLeft.value = Math.max(0, vuLeft.value - 2)
    vuRight.value = Math.max(0, vuRight.value - 2)
    drawIdleSpectrum(ctx, W, H)
  } else {
    const bufLen = analyser.frequencyBinCount
    const data = new Uint8Array(bufLen)
    analyser.getByteFrequencyData(data)

    const half = Math.floor(bufLen / 2)
    let sumL = 0, sumR = 0
    for (let i = 0; i < half; i++) sumL += data[i]
    for (let i = half; i < bufLen; i++) sumR += data[i]

    const rawL = (sumL / half / 255) * 100
    const rawR = (sumR / (bufLen - half) / 255) * 100

    vuLeft.value = vuLeft.value * 0.55 + rawL * 0.45
    vuRight.value = vuRight.value * 0.55 + rawR * 0.45

    // Peak LEDs
    if (vuLeft.value > 88) { peakLedL.value = true; peakLedTimerL = now + 800 }
    else if (now > peakLedTimerL) peakLedL.value = false
    if (vuRight.value > 88) { peakLedR.value = true; peakLedTimerR = now + 800 }
    else if (now > peakLedTimerR) peakLedR.value = false

    drawSpectrum(ctx, W, H, data, bufLen)
  }

  // Needle physics: damped spring simulation
  const spring = 0.18
  const damping = 0.62

  const targetL = vuLeft.value
  const targetR = vuRight.value

  needleVelL.value += (targetL - needleL.value) * spring
  needleVelL.value *= damping
  needleL.value += needleVelL.value
  needleL.value = Math.max(0, Math.min(100, needleL.value))

  needleVelR.value += (targetR - needleR.value) * spring
  needleVelR.value *= damping
  needleR.value += needleVelR.value
  needleR.value = Math.max(0, Math.min(100, needleR.value))
}

function drawSpectrum(ctx, W, H, data, bufLen) {
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

/* ── Analog VU Section ── */
.vu-section {
  display: flex;
  align-items: stretch;
}

.vu-meter-wrap {
  display: flex;
  gap: 8px;
  flex: 1;
}

.vu-meter {
  flex: 1;
  position: relative;
  background: linear-gradient(160deg, #1c1a14 0%, #141210 60%, #0e0c0a 100%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  overflow: hidden;
  padding: 4px 4px 2px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.06),
    inset 0 -1px 0 rgba(0,0,0,0.4),
    0 2px 8px rgba(0,0,0,0.5);
}

/* Bezel glass effect */
.vu-meter::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(255,255,255,0.04) 0%, transparent 50%);
  border-radius: 5px;
  pointer-events: none;
  z-index: 10;
}

.vu-meter.peak {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.06),
    inset 0 -1px 0 rgba(0,0,0,0.4),
    0 2px 8px rgba(0,0,0,0.5),
    0 0 6px rgba(232,85,85,0.3);
}

.vu-svg {
  display: block;
  width: 100%;
  height: 58px;
}

/* Peak LED indicator (top right corner) */
.vu-peak-led {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(232,85,85,0.2);
  border: 1px solid rgba(232,85,85,0.3);
  transition: all 0.05s;
}
.vu-peak-led.active {
  background: #ff3333;
  box-shadow: 0 0 6px #ff3333, 0 0 12px rgba(255,50,50,0.4);
  border-color: #ff6666;
}

/* Channel label */
.vu-channel-label {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  font-weight: 900;
  font-family: monospace;
  color: rgba(255,255,255,0.3);
  letter-spacing: 1px;
}

/* Spectrum */
.spectrum-section {
  width: 100%;
  height: 56px;
}

.spectrum-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* Landscape */
.visualizer-wrap.landscape .vu-svg {
  height: 70px;
}
.visualizer-wrap.landscape .spectrum-section {
  height: 70px;
}
</style>
