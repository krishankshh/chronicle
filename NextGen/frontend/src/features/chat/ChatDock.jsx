import { useEffect, useMemo } from 'react'
import { MessageCircle, WifiOff } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'
import ChatListPanel from './ChatListPanel'
import ChatWindow from './ChatWindow'

const ChatDock = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const loadChats = useChatStore((state) => state.loadChats)
  const loadGroupChats = useChatStore((state) => state.loadGroupChats)
  const connectSocket = useChatStore((state) => state.connectSocket)
  const disconnectSocket = useChatStore((state) => state.disconnectSocket)
  const openWindows = useChatStore((state) => state.openWindows)
  const isListOpen = useChatStore((state) => state.isListOpen)
  const toggleList = useChatStore((state) => state.toggleList)
  const unreadCounts = useChatStore((state) => state.unreadCounts)
  const socketConnected = useChatStore((state) => state.socketConnected)

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket()
      return
    }
    loadChats()
    loadGroupChats()
    connectSocket()

    return () => {
      disconnectSocket()
    }
  }, [isAuthenticated, loadChats, loadGroupChats, connectSocket, disconnectSocket])

  const unreadTotal = useMemo(
    () => Object.values(unreadCounts || {}).reduce((sum, value) => sum + (value || 0), 0),
    [unreadCounts]
  )

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end space-y-3">
      <div className="flex w-full flex-col items-end space-y-3">
        {openWindows.map((windowConfig) => (
          <ChatWindow key={windowConfig.key} windowConfig={windowConfig} />
        ))}
      </div>

      <div className="pointer-events-auto">
        {isListOpen && <ChatListPanel />}
        <button
          type="button"
          onClick={toggleList}
          className="relative flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-white shadow-lg transition hover:bg-primary-700"
          title="Open chat panel"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-semibold">Chat</span>
          {unreadTotal > 0 && (
            <span className="absolute -right-2 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold leading-none">
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
          {!socketConnected && (
            <WifiOff className="ml-1 h-4 w-4 text-white/80" title="Disconnected" />
          )}
        </button>
      </div>
    </div>
  )
}

export default ChatDock
