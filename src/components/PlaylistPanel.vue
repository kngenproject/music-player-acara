<template>
  <div class="playlist-panel">
    <!-- Playlist Tabs -->
    <div class="playlist-tabs">
      <div class="tabs-scroll">
        <button
          v-for="(pl, id) in playlists"
          :key="id"
          class="tab-btn"
          :class="{ active: String(id) === String(activePlaylistId) }"
          @click="$emit('switch-playlist', id)"
        >
          <span class="tab-name">{{ pl.name }}</span>
          <span class="tab-count">{{ pl.tracks.length }}</span>
          <span
            class="tab-close"
            @click.stop="$emit('delete-playlist', id)"
            v-if="Object.keys(playlists).length > 1"
            title="Hapus playlist"
          >✕</span>
        </button>

        <!-- Tombol tambah playlist baru -->
        <button class="tab-new" @click="$emit('new-playlist')" title="Playlist baru">
          ＋
        </button>
      </div>
    </div>

    <!-- Header -->
    <div class="playlist-header">
      <div class="playlist-title-wrap">
        <span class="playlist-title" v-if="!isEditingName" @dblclick="startEditName" title="Klik dua kali untuk ubah nama">
          {{ activeName }}
        </span>
        <input
          v-else
          ref="nameInput"
          class="playlist-name-input"
          v-model="editName"
          @keydown.enter="confirmEditName"
          @keydown.escape="isEditingName = false"
          @blur="confirmEditName"
        />
        <span class="count">{{ playlist.length }}</span>
      </div>
      <div class="header-btns">
        <button class="hdr-btn" @click="startEditName" title="Ubah nama playlist">✏️</button>
        <button class="hdr-btn" @click="$emit('upload-folder')" title="Buka Folder">📁</button>
        <button class="hdr-btn" @click="$emit('upload-files')" title="Tambah File">➕</button>
        <button class="hdr-btn danger" @click="$emit('clear')" title="Hapus Semua" v-if="playlist.length">🗑️</button>
      </div>
    </div>

    <!-- Track list -->
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

    <!-- Empty state -->
    <div class="playlist-empty" v-else>
      <div class="empty-icon">🎵</div>
      <p>Belum ada lagu</p>
      <button class="add-btn" @click="$emit('upload-folder')">Buka Folder</button>
      <button class="add-btn secondary" @click="$emit('upload-files')">Pilih File</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps({
  playlist: Array,
  playlists: Object,
  activePlaylistId: [String, Number],
  currentIndex: Number,
  isPlaying: Boolean
})

const emit = defineEmits([
  'play-track', 'remove', 'clear',
  'upload-folder', 'upload-files',
  'switch-playlist', 'delete-playlist',
  'new-playlist', 'rename-playlist'
])

const isEditingName = ref(false)
const editName = ref('')
const nameInput = ref(null)

const activeName = computed(() => {
  if (!props.activePlaylistId || !props.playlists[props.activePlaylistId]) return 'Playlist'
  return props.playlists[props.activePlaylistId].name || 'Playlist'
})

function startEditName() {
  editName.value = activeName.value
  isEditingName.value = true
  nextTick(() => nameInput.value?.select())
}

function confirmEditName() {
  const name = editName.value.trim()
  if (name) emit('rename-playlist', name)
  isEditingName.value = false
}
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
  padding: 6px 8px;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: center;
}

.tabs-scroll::-webkit-scrollbar { height: 3px; }
.tabs-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

.tab-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text2);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
  max-width: 160px;
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

.tab-name {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.tab-count {
  background: rgba(0,0,0,0.2);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.tab-close {
  font-size: 11px;
  opacity: 0.6;
  cursor: pointer;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.tab-close:hover {
  opacity: 1;
  background: rgba(0,0,0,0.25);
}

.tab-new {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1px dashed var(--border);
  color: var(--text3);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-new:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(232,168,56,0.08);
}

/* ── Header ── */
.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 8px;
}

.playlist-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.playlist-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text2);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-title:hover {
  color: var(--text);
}

.playlist-name-input {
  font-size: 13px;
  font-weight: 700;
  background: var(--surface2);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  color: var(--text);
  padding: 2px 8px;
  outline: none;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 0;
  flex: 1;
}

.count {
  background: var(--accent);
  color: #000;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.header-btns {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.hdr-btn {
  background: var(--surface2);
  color: var(--text);
  border-radius: var(--radius-sm);
  width: 32px;
  height: 32px;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.hdr-btn:hover { background: var(--surface3); }
.hdr-btn.danger:hover { background: rgba(232,64,64,0.2); }

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

.track-item:hover { background: var(--surface2); }
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

.track-item:hover .remove-btn { opacity: 1; }
.remove-btn:hover { background: rgba(232,64,64,0.2); color: var(--danger); }

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
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-btn.secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}

.add-btn:hover { opacity: 0.85; }
</style>
