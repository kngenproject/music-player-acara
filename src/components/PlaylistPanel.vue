<template>
  <div class="playlist-panel">
    <div class="playlist-header">
      <span class="playlist-title">Playlist <span class="count">{{ playlist.length }}</span></span>
      <div class="header-btns">
        <button class="hdr-btn" @click="$emit('open-folder')" title="Buka Folder">
          📁
        </button>
        <button class="hdr-btn" @click="$emit('add-files')" title="Tambah File">
          ➕
        </button>
        <button class="hdr-btn danger" @click="$emit('clear')" title="Hapus Semua" v-if="playlist.length">
          🗑️
        </button>
      </div>
    </div>

    <div class="playlist-body" v-if="playlist.length">
      <div
        v-for="(track, i) in playlist"
        :key="track.id"
        class="track-item"
        :class="{ active: i === currentIndex }"
        @click="$emit('play-track', i)"
      >
        <div class="track-num">
          <span v-if="i === currentIndex && isPlaying" class="playing-anim">
            <span></span><span></span><span></span>
          </span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="track-info">
          <div class="track-name">{{ track.name }}</div>
        </div>
        <button class="remove-btn" @click.stop="$emit('remove', i)">✕</button>
      </div>
    </div>

    <div class="playlist-empty" v-else>
      <div class="empty-icon">🎵</div>
      <p>Belum ada lagu</p>
      <button class="add-btn" @click="$emit('open-folder')">Buka Folder</button>
      <button class="add-btn secondary" @click="$emit('add-files')">Pilih File</button>
    </div>
  </div>
</template>

<script setup>
defineProps({ playlist: Array, currentIndex: Number, isPlaying: Boolean })
defineEmits(['play-track', 'remove', 'clear', 'open-folder', 'add-files'])
</script>

<style scoped>
.playlist-panel {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-top: 1px solid var(--border);
  flex: 1;
  overflow: hidden;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.playlist-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text2);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.count {
  background: var(--accent);
  color: #000;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 6px;
}

.header-btns { display: flex; gap: 6px; }

.hdr-btn {
  background: var(--surface2);
  color: var(--text);
  border-radius: var(--radius-sm);
  width: 36px;
  height: 36px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hdr-btn:hover { background: var(--surface3); }
.hdr-btn.danger:hover { background: rgba(232,64,64,0.2); }

.playlist-body {
  overflow-y: auto;
  flex: 1;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}
.track-item:hover { background: var(--surface2); }
.track-item.active { background: rgba(232,168,56,0.08); border-left: 3px solid var(--accent); }

.track-num {
  font-size: 12px;
  color: var(--text3);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.track-item.active .track-num { color: var(--accent); }

.playing-anim {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}
.playing-anim span {
  display: block;
  width: 3px;
  background: var(--accent);
  border-radius: 2px;
  animation: eq 0.8s ease-in-out infinite alternate;
}
.playing-anim span:nth-child(1) { height: 6px; animation-delay: 0s; }
.playing-anim span:nth-child(2) { height: 12px; animation-delay: 0.2s; }
.playing-anim span:nth-child(3) { height: 8px; animation-delay: 0.4s; }

@keyframes eq {
  from { transform: scaleY(0.4); }
  to { transform: scaleY(1); }
}

.track-info { flex: 1; overflow: hidden; }
.track-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track-item.active .track-name { color: var(--accent); }

.remove-btn {
  background: transparent;
  color: var(--text3);
  font-size: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}
.track-item:hover .remove-btn { opacity: 1; }
.remove-btn:hover { background: rgba(232,64,64,0.2); color: var(--danger); }

.playlist-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--text3);
}
.empty-icon { font-size: 48px; opacity: 0.3; }
.playlist-empty p { font-size: 14px; }

.add-btn {
  background: var(--accent);
  color: #000;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  width: 100%;
  max-width: 200px;
}
.add-btn.secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}
.add-btn:hover { opacity: 0.85; }
</style>
