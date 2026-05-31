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
        <button class="tab-new" @click="$emit('new-playlist')" title="Playlist baru" aria-label="Playlist baru">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
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
        <span class="count-badge">{{ playlist.length }}</span>
      </div>
      <div class="header-btns">
        <button class="hdr-btn" @click="startEditName" title="Ubah nama" aria-label="Ubah nama playlist">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="hdr-btn" @click="$emit('upload-folder')" title="Buka Folder" aria-label="Buka folder">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
        </button>
        <button class="hdr-btn" @click="$emit('upload-files')" title="Tambah File" aria-label="Tambah file">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
        <button class="hdr-btn danger" @click="$emit('clear')" title="Hapus Semua" aria-label="Hapus semua" v-if="playlist.length">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
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
          <span v-else class="num-text">{{ i + 1 }}</span>
        </div>
        <div class="track-info">
          <div class="track-name">{{ track.name }}</div>
        </div>
        <button class="remove-btn" @click.stop="$emit('remove', i)" aria-label="Hapus lagu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div class="playlist-empty" v-else>
      <div class="empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" opacity="0.2">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>
      <p>Belum ada lagu</p>
      <div class="empty-actions">
        <button class="add-btn" @click="$emit('upload-folder')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          Buka Folder
        </button>
        <button class="add-btn secondary" @click="$emit('upload-files')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Pilih File
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  playlist: Array,
  playlists: Object,
  activePlaylistId: [String, Number],
  currentIndex: Number,
  isPlaying: Boolean
})

const emit = defineEmits([
  'play-track','remove','clear',
  'upload-folder','upload-files',
  'switch-playlist','delete-playlist',
  'new-playlist','rename-playlist'
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

/* Tabs */
.playlist-tabs {
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
}

.tabs-scroll {
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: center;
}
.tabs-scroll::-webkit-scrollbar { height: 2px; }
.tabs-scroll::-webkit-scrollbar-thumb { background: var(--border2); }

.tab-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 150px;
  transition: all 0.15s;
}
.tab-btn:hover { background: var(--surface3); color: var(--text); }
.tab-btn.active {
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
}

.tab-name {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
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
  opacity: 0.5;
  cursor: pointer;
  width: 16px; height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}
.tab-close:hover { opacity: 1; background: rgba(0,0,0,0.25); }

.tab-new {
  flex-shrink: 0;
  width: 32px; height: 32px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1.5px dashed var(--border2);
  color: var(--text3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-new:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

/* Header */
.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 8px;
  background: var(--surface);
}

.playlist-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.playlist-title {
  font-size: 12px;
  font-weight: 800;
  color: var(--text2);
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s;
}
.playlist-title:hover { color: var(--text); }

.playlist-name-input {
  font-size: 12px;
  font-weight: 800;
  background: var(--surface2);
  border: 1.5px solid var(--accent);
  border-radius: var(--radius-xs);
  color: var(--text);
  padding: 3px 8px;
  outline: none;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 0;
  flex: 1;
}

.count-badge {
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 20px;
  border: 1px solid rgba(240,180,41,0.2);
  flex-shrink: 0;
}

.header-btns {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.hdr-btn {
  background: var(--surface2);
  color: var(--text2);
  border-radius: var(--radius-sm);
  width: 34px; height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: all 0.15s;
}
.hdr-btn:hover { background: var(--surface3); color: var(--text); }
.hdr-btn.danger:hover { background: var(--danger-soft); color: var(--danger); border-color: rgba(232,85,85,0.2); }

/* Track list */
.playlist-body {
  overflow-y: auto;
  flex: 1;
  overscroll-behavior: contain;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
  position: relative;
}
.track-item:hover { background: var(--surface2); }
.track-item:active { background: var(--surface3); }
.track-item.active {
  background: var(--accent-soft);
  border-left: 3px solid var(--accent);
  padding-left: 11px;
}

.track-num {
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}
.track-item.active .track-num { color: var(--accent); }

.num-text { display: block; }

.playing-anim {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
  justify-content: center;
}
.playing-anim span {
  display: block;
  width: 3px;
  background: var(--accent);
  border-radius: 2px;
  animation: eq 0.7s ease-in-out infinite alternate;
}
.playing-anim span:nth-child(1) { height: 6px; animation-delay: 0s; }
.playing-anim span:nth-child(2) { height: 13px; animation-delay: 0.15s; }
.playing-anim span:nth-child(3) { height: 9px; animation-delay: 0.3s; }

@keyframes eq {
  from { transform: scaleY(0.35); }
  to   { transform: scaleY(1); }
}

.track-info { flex: 1; overflow: hidden; }

.track-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}
.track-item.active .track-name { color: var(--accent); font-weight: 600; }

.remove-btn {
  background: transparent;
  border: none;
  color: var(--text3);
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  cursor: pointer;
  flex-shrink: 0;
}
.track-item:hover .remove-btn { opacity: 1; }
.remove-btn:hover { background: var(--danger-soft); color: var(--danger); }

/* Empty */
.playlist-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 24px;
  color: var(--text3);
}
.empty-icon { margin-bottom: 4px; }
.playlist-empty p { font-size: 14px; font-weight: 600; color: var(--text2); }

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 200px;
  margin-top: 8px;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent);
  color: #000;
  font-weight: 700;
  padding: 13px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  width: 100%;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.2s;
}
.add-btn.secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border2);
}
.add-btn:hover { opacity: 0.85; }
</style>
