import { create } from 'zustand'
import { io } from 'socket.io-client'
import {
  fetchChats,
  fetchChatMessages,
  fetchGroupChats,
  fetchGroupMessages,
  sendChatMessage,
  sendGroupMessage,
} from '../features/chat/chatApi'

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    return apiBase.replace(/\/api\/?$/, '')
  })()

const DEFAULT_MESSAGE_LIMIT = 50

const roomKey = (type, id) => `${type}:${id}`
const roomTuple = (key) => {
  const [type, id] = key.split(':')
  return { type, id }
}

const socketRoom = (type, id) => (type === 'group' ? `group:${id}` : `chat:${id}`)

const playNotificationSound = (() => {
  let audioContext
  return () => {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.6)
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.6)
    } catch (error) {
      // Ignore audio errors (e.g. autoplay restrictions)
      console.warn('Notification audio failed', error)
    }
  }
})()

const mergeMessages = (current = [], incoming = []) => {
  const map = new Map()
  current.forEach((msg) => {
    map.set(msg.id, msg)
  })
  incoming.forEach((msg) => {
    map.set(msg.id, { ...(map.get(msg.id) || {}), ...msg })
  })
  const merged = Array.from(map.values())
  merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  return merged
}

const useChatStore = create((set, get) => ({
  chats: [],
  groupChats: [],
  messages: {},
  messageState: {},
  typingState: {},
  onlineUsers: {},
  unreadCounts: {},
  openWindows: [],
  isListOpen: false,
  searchTerm: '',
  socket: null,
  socketConnected: false,
  socketConnecting: false,
  isLoadingChats: false,
  isLoadingGroups: false,
  error: null,

  setSearchTerm: (value) => set({ searchTerm: value }),
  toggleList: () => set((state) => ({ isListOpen: !state.isListOpen })),

  loadChats: async () => {
    set({ isLoadingChats: true, error: null })
    try {
      const data = await fetchChats()
      set({ chats: data, isLoadingChats: false })
      return data
    } catch (error) {
      console.error('Failed to load chats', error)
      set({ isLoadingChats: false, error: 'Unable to load chats' })
      throw error
    }
  },

  loadGroupChats: async () => {
    set({ isLoadingGroups: true, error: null })
    try {
      const data = await fetchGroupChats()
      set({ groupChats: data, isLoadingGroups: false })
      return data
    } catch (error) {
      console.error('Failed to load group chats', error)
      set({ isLoadingGroups: false, error: 'Unable to load group chats' })
      throw error
    }
  },

  refreshSessions: async () => {
    await Promise.all([get().loadChats(), get().loadGroupChats()])
  },

  ensureMessages: async (type, id, { reset = false } = {}) => {
    const key = roomKey(type, id)
    const { messages, messageState } = get()
    const existing = messages[key] || []
    const pagination = messageState[key] || {}

    if (reset || !existing.length) {
      set((state) => ({
        messageState: {
          ...state.messageState,
          [key]: { loading: true, hasMore: true, error: null },
        },
      }))
      try {
        const history =
          type === 'group'
            ? await fetchGroupMessages(id, { limit: DEFAULT_MESSAGE_LIMIT })
            : await fetchChatMessages(id, { limit: DEFAULT_MESSAGE_LIMIT })
        set((state) => ({
          messages: {
            ...state.messages,
            [key]: history,
          },
          messageState: {
            ...state.messageState,
            [key]: {
              loading: false,
              hasMore: history.length >= DEFAULT_MESSAGE_LIMIT,
            },
          },
        }))
      } catch (error) {
        console.error('Failed to load messages', error)
        set((state) => ({
          messageState: {
            ...state.messageState,
            [key]: { loading: false, error: 'Unable to load messages', hasMore: false },
          },
        }))
        throw error
      }
      return
    }

    if (!pagination.hasMore || pagination.loading) {
      return
    }

    const oldest = existing[0]
    if (!oldest) {
      return
    }

    set((state) => ({
      messageState: {
        ...state.messageState,
        [key]: { ...state.messageState[key], loading: true },
      },
    }))

    try {
      const history =
        type === 'group'
          ? await fetchGroupMessages(id, {
              limit: DEFAULT_MESSAGE_LIMIT,
              before: oldest.created_at,
            })
          : await fetchChatMessages(id, {
              limit: DEFAULT_MESSAGE_LIMIT,
              before: oldest.created_at,
            })
      set((state) => ({
        messages: {
          ...state.messages,
          [key]: mergeMessages(existing, history),
        },
        messageState: {
          ...state.messageState,
          [key]: {
            loading: false,
            hasMore: history.length >= DEFAULT_MESSAGE_LIMIT,
          },
        },
      }))
    } catch (error) {
      console.error('Failed to load more messages', error)
      set((state) => ({
        messageState: {
          ...state.messageState,
          [key]: { ...state.messageState[key], loading: false, error: 'Unable to load messages' },
        },
      }))
    }
  },

  openWindow: (config) => {
    const { type, id, title, avatar, meta = {}, sticky = false } = config
    const key = roomKey(type, id)
    const existing = get().openWindows
    const alreadyOpen = existing.find((win) => win.key === key)

    if (alreadyOpen) {
      const updated = existing.map((win) => (win.key === key ? { ...win, minimized: false } : win))
      const target = updated.find((win) => win.key === key)
      const others = updated.filter((win) => win.key !== key)
      set({
        openWindows: target ? [...others, target] : updated,
      })
    } else {
      set({
        openWindows: [
          ...existing,
          {
            key,
            type,
            id,
            title,
            avatar: avatar || null,
            meta,
            minimized: false,
            createdAt: Date.now(),
            sticky,
          },
        ],
      })
    }

    get().joinRoom(type, id)
    get().ensureMessages(type, id)
    get().clearUnread(key)
  },

  closeWindow: (key) => {
    const { type, id } = roomTuple(key)
    set((state) => ({
      openWindows: state.openWindows.filter((win) => win.key !== key),
    }))
    get().leaveRoom(type, id)
  },

  toggleMinimize: (key) => {
    set((state) => ({
      openWindows: state.openWindows.map((win) =>
        win.key === key ? { ...win, minimized: !win.minimized } : win
      ),
    }))
  },

  focusWindow: (key) => {
    set((state) => {
      const updated = state.openWindows.map((win) =>
        win.key === key ? { ...win, minimized: false, lastFocused: Date.now() } : win
      )
      const target = updated.find((win) => win.key === key)
      const others = updated.filter((win) => win.key !== key)
      return {
        openWindows: target ? [...others, target] : updated,
      }
    })
    get().clearUnread(key)
  },

  addMessage: (message, { playSound = false } = {}) => {
    const type = message.group_id ? 'group' : 'chat'
    const id = message.group_id || message.chat_id
    const key = roomKey(type, id)

    set((state) => ({
      messages: {
        ...state.messages,
        [key]: mergeMessages(state.messages[key], [message]),
      },
    }))

    if (playSound) {
      playNotificationSound()
    }

    const openWindows = get().openWindows
    const isWindowFocused = openWindows.some((win) => win.key === key && !win.minimized)
    if (!isWindowFocused && message.sender_id !== get().currentUserId()) {
      get().incrementUnread(key)
    }

    const { chats, groupChats } = get()
    if (type === 'chat') {
      set({
        chats: chats
          .map((chat) =>
            chat.id === id
              ? {
                  ...chat,
                  last_message: message,
                  last_message_at: message.created_at,
                }
              : chat
          )
          .sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)),
      })
    } else {
      set({
        groupChats: groupChats
          .map((chat) =>
            chat.id === id
              ? {
                  ...chat,
                  last_message: message,
                  last_message_at: message.created_at,
                }
              : chat
          )
          .sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)),
      })
    }
  },

  updateReadState: (room, messageIds, userId) => {
    set((state) => {
      const current = state.messages[room] || []
      if (!current.length) {
        return {}
      }
      return {
        messages: {
          ...state.messages,
          [room]: current.map((msg) =>
            messageIds.includes(msg.id)
              ? {
                  ...msg,
                  read_by: msg.read_by?.includes(userId)
                    ? msg.read_by
                    : [...(msg.read_by || []), userId],
                }
              : msg
          ),
        },
      }
    })
  },

  incrementUnread: (key) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [key]: (state.unreadCounts[key] || 0) + 1,
      },
    }))
  },

  clearUnread: (key) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [key]: 0,
      },
    }))
  },

  setTyping: (room, typingInfo) =>
    set((state) => ({
      typingState: {
        ...state.typingState,
        [room]: typingInfo,
      },
    })),

  setOnline: (userId, online) =>
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: online,
      },
    })),

  currentUserId: () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      return null
    }
    try {
      const [, payload] = token.split('.')
      if (!payload) return null
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
      const decoded = JSON.parse(atob(padded))
      return decoded.sub || decoded.user_id || decoded.id || null
    } catch (error) {
      console.warn('Unable to decode token payload', error)
      return null
    }
  },

  joinRoom: (type, id) => {
    const socket = get().socket
    if (!socket) return
    socket.emit(type === 'group' ? 'join_group' : 'join_chat', {
      [`${type}_id`]: id,
      chat_id: type === 'chat' ? id : undefined,
      group_id: type === 'group' ? id : undefined,
    })
  },

  leaveRoom: (type, id) => {
    const socket = get().socket
    if (!socket) return
    socket.emit(type === 'group' ? 'leave_group' : 'leave_chat', {
      [`${type}_id`]: id,
      chat_id: type === 'chat' ? id : undefined,
      group_id: type === 'group' ? id : undefined,
    })
  },

  sendMessage: async (type, id, payload, files = []) => {
    try {
      const response =
        type === 'group'
          ? await sendGroupMessage(id, payload, files)
          : await sendChatMessage(id, payload, files)
      get().addMessage(response)
      get().emitReadReceipt(type, id, [response.id])
      return response
    } catch (error) {
      console.error('Failed to send message', error)
      throw error
    }
  },

  emitTyping: (type, id, isTyping) => {
    const socket = get().socket
    if (!socket) return
    socket.emit('typing_indicator', {
      room: socketRoom(type, id),
      is_typing: isTyping,
    })
  },

  emitReadReceipt: (type, id, messageIds) => {
    const socket = get().socket
    if (!socket) return
    socket.emit('read_receipt', {
      room: socketRoom(type, id),
      message_ids: messageIds,
    })
  },

  connectSocket: () => {
    const { socket } = get()
    if (socket || get().socketConnecting) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    const newSocket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      query: {
        token,
      },
      autoConnect: true,
    })

    set({ socket: newSocket, socketConnecting: true })

    newSocket.on('connect', () => {
      set({ socketConnected: true, socketConnecting: false })
      const { openWindows } = get()
      openWindows.forEach((win) => get().joinRoom(win.type, win.id))
    })

    newSocket.on('disconnect', () => {
      set({ socketConnected: false })
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error', error)
      set({ socketConnecting: false, socketConnected: false })
    })

    newSocket.on('connected', (payload) => {
      if (payload?.user_id) {
        get().setOnline(payload.user_id, true)
      }
      if (Array.isArray(payload?.online_users)) {
        payload.online_users.forEach((uid) => {
          if (uid) {
            get().setOnline(uid, true)
          }
        })
      }
    })

    newSocket.on('status', (payload) => {
      if (!payload?.user_id) return
      get().setOnline(payload.user_id, payload.event === 'online')
    })

    newSocket.on('typing_indicator', (payload) => {
      if (!payload?.room) return
      get().setTyping(payload.room, {
        userId: payload.user_id,
        isTyping: payload.is_typing,
        timestamp: Date.now(),
      })
      if (!payload.is_typing) {
        setTimeout(() => {
          const current = get().typingState[payload.room]
          if (current && current.timestamp + 1500 < Date.now()) {
            get().setTyping(payload.room, null)
          }
        }, 2000)
      }
    })

    newSocket.on('message_received', (payload) => {
      if (!payload) return
      const type = payload.group_id ? 'group' : 'chat'
      const id = payload.group_id || payload.chat_id
      const key = roomKey(type, id)
      const isOwnMessage = payload.sender_id === get().currentUserId()
      get().addMessage(payload, { playSound: !isOwnMessage })
      if (!isOwnMessage) {
        const open = get().openWindows
        const active = open.some((win) => win.key === key && !win.minimized)
        if (active) {
          get().emitReadReceipt(type, id, [payload.id])
        }
      }
    })

    newSocket.on('read_receipt', (payload) => {
      if (!payload?.room || !payload?.message_ids) return
      get().updateReadState(payload.room, payload.message_ids, payload.user_id)
    })
  },

  disconnectSocket: () => {
    const { socket } = get()
    if (!socket) return
    socket.removeAllListeners()
    socket.disconnect()
    set({ socket: null, socketConnected: false, socketConnecting: false })
  },
}))

export default useChatStore
