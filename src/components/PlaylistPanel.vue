<template>
  <div class="playlist-panel">
    <!-- Playlist tabs -->
    <div class="playlist-tabs" v-if="Object.keys(playlists).length > 1">
      <div class="tabs-scroll">
        <button 
          v-for="(pl, id) in playlists" 
          :key="id"
          class="tab-btn"
          :class="{ active: id === activePlaylistId }"
          @click="$emit('switch-playlist', id)"
        >
          {{ id }}
          <span class="tab-count">{{ pl.length }}</span>
          <button class="tab-close" @click.stop="$emit('delete-playlist', id)" v-if="Object.keys(playlists).length > 1">✕</button>
        </button>
      </div>
    </div>

    <div class="playlist-header">
      <span class="playlist-title">Playlist <span class="count">{{ playlist.length }}</span></span>
      <div class="header-btns">
        <button class="hdr-btn" @click="$emit('upload-folder')" title="Buka Folder">
          📁
        </button>
        <button class="hdr-btn" @click="$emit('upload-files')" title="Tambah File">
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
      <button class="add-btn" @click="$emit('upload-folder')">Buka Folder</button>
      <button class="add-btn secondary" @click="$emit('upload-files')">Pilih File</button>
    </div>
  </div>
</template>

<script setup>
defineProps({ 
  playlist: Array, 
  playlists: Object,
  activePlaylistId: [String, Number],
  currentIndex: Number, 
  isPlaying: Boolean 
})

defineEmits([
  'play-track', 
  'remove', 
  'clear', 
  'upload-folder', 
  'upload-files',
  'switch-playlist',
  'delete-playlist'
])
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

/* ── Tabs ── */
.playlist-tabs {
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
  flex-shrink: 0;
}

.tabs-scroll {
  display: flex;
  gap: 4px;
  padding: 8px;
  overflow-x: auto;
  overflow-y: hidden;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text2);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--surface3);
  color: var(--text);
}

.tab-btn.active {
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
}

.tab-count {
  background: rgba(0,0,0,0.2);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.tab-btn.active .tab-count {
  background: rgba(0,0,0,0.3);
}

.tab-close {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 12px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.tab-close:hover {
  opacity: 1;
  background: rgba(0,0,0,0.2);
}

/* ── Header ── */
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

.header-btns { 
  display: flex; 
  gap: 6px;
  flex-shrink: 0;
}

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
  cursor: pointer;
  transition: background 0.2s;
}

.hdr-btn:hover { 
  background: var(--surface3); 
}

.hdr-btn.danger:hover { 
  background: rgba(232,64,64,0.2); 
}

/* ── Body ── */
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

.track-item:hover { 
  background: var(--surface2); 
}

.track-item.active { 
  background: rgba(232,168,56,0.08); 
  border-left: 3px solid var(--accent); 
}

.track-num {
  font-size: 12px;
  color: var(--text3);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.track-item.active .track-num { 
  color: var(--accent); 
}

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

.playing-anim span:nth-child(1) { 
  height: 6px; 
  animation-delay: 0s; 
}

.playing-anim span:nth-child(2) { 
  height: 12px; 
  animation-delay: 0.2s; 
}

.playing-anim span:nth-child(3) { 
  height: 8px; 
  animation-delay: 0.4s; 
}

@keyframes eq {
  from { transform: scaleY(0.4); }
  to { transform: scaleY(1); }
}

.track-info { 
  flex: 1; 
  overflow: hidden; 
}

.track-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-item.active .track-name { 
  color: var(--accent); 
}

.remove-btn {
  background: transparent;
  border: none;
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
  cursor: pointer;
}

.track-item:hover .remove-btn { 
  opacity: 1; 
}

.remove-btn:hover { 
  background: rgba(232,64,64,0.2); 
  color: var(--danger); 
}

/* ── Empty State ── */
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

.empty-icon { 
  font-size: 48px; 
  opacity: 0.3; 
}

.playlist-empty p { 
  font-size: 14px; 
}

.add-btn {
  background: var(--accent);
  color: #000;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  width: 100%;
  max-width: 200px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-btn.secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}

.add-btn:hover { 
  opacity: 0.85; 
}
</style>
