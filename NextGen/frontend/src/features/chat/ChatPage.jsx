import { useEffect, useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'
import ChatListPanel from './ChatListPanel'
import ChatWindow from './ChatWindow'

const ChatPage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const refreshSessions = useChatStore((state) => state.refreshSessions)
  const connectSocket = useChatStore((state) => state.connectSocket)
  const openWindows = useChatStore((state) => state.openWindows)

  const [selectedKey, setSelectedKey] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    refreshSessions().catch((error) => {
      console.error('Failed to refresh chat data', error)
    })
    connectSocket()
  }, [isAuthenticated, refreshSessions, connectSocket])

  useEffect(() => {
    if (!openWindows.length) {
      setSelectedKey(null)
      return
    }
    const selectedExists = openWindows.some((win) => win.key === selectedKey)
    if (!selectedExists) {
      setSelectedKey(openWindows[openWindows.length - 1].key)
    }
  }, [openWindows, selectedKey])

  const selectedWindow = useMemo(() => {
    if (!selectedKey) return null
    return openWindows.find((win) => win.key === selectedKey) || null
  }, [openWindows, selectedKey])

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="h-[calc(100vh-7rem)]">
        <ChatListPanel variant="page" onSelect={setSelectedKey} />
      </div>
      <div className="h-[calc(100vh-7rem)] rounded-2xl border border-gray-200 bg-white shadow-sm">
        {selectedWindow ? (
          <ChatWindow windowConfig={{ ...selectedWindow, minimized: false }} variant="embedded" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-gray-500">
            <MessageCircle className="h-10 w-10 text-primary-500" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">Select a conversation</p>
              <p className="text-sm text-gray-500">
                Choose a chat from the list to start messaging or use the search to create a new conversation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage
