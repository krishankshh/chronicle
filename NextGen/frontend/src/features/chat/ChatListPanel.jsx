import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, MessageCircle, Plus, RotateCcw, Search, Users, UserCircle, CircleDot } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'
import { searchChatParticipants, startChat } from './chatApi'
import CreateGroupModal from './CreateGroupModal'
import { getRoomKey, extractParticipant } from './chatUtils'

const ChatListPanel = ({ variant = 'dock', onSelect }) => {
  const { user, role } = useAuthStore()
  const chats = useChatStore((state) => state.chats)
  const groupChats = useChatStore((state) => state.groupChats)
  const searchTerm = useChatStore((state) => state.searchTerm)
  const setSearchTerm = useChatStore((state) => state.setSearchTerm)
  const openWindow = useChatStore((state) => state.openWindow)
  const unreadCounts = useChatStore((state) => state.unreadCounts)
  const toggleList = useChatStore((state) => state.toggleList)
  const onlineUsers = useChatStore((state) => state.onlineUsers)
  const refreshSessions = useChatStore((state) => state.refreshSessions)
  const loadChats = useChatStore((state) => state.loadChats)
  const loadGroupChats = useChatStore((state) => state.loadGroupChats)

  const currentUserId = useMemo(() => useChatStore.getState().currentUserId(), [])

  const [activeTab, setActiveTab] = useState('direct')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showGroupModal, setShowGroupModal] = useState(false)

  const autoClose = variant === 'dock'

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!searchTerm) {
        setSearchResults([])
        setSearchError('')
        return
      }
      setIsSearching(true)
      searchChatParticipants(searchTerm)
        .then((results) => {
          setSearchResults(results.filter((item) => item.id !== currentUserId))
          setSearchError('')
        })
        .catch((error) => {
          console.error('Failed to search participants', error)
          setSearchError('Unable to search participants right now.')
        })
        .finally(() => setIsSearching(false))
    }, 350)
    return () => clearTimeout(handler)
  }, [searchTerm, currentUserId])

  const handleOpenChat = (chat) => {
    const participant = extractParticipant(chat, currentUserId)
    openWindow({
      type: 'chat',
      id: chat.id,
      title: participant.name,
      avatar: participant.avatar,
      meta: { participant, session: chat },
    })
    if (autoClose) {
      toggleList()
    }
    onSelect?.(getRoomKey('chat', chat.id))
  }

  const handleOpenGroup = (group) => {
    openWindow({
      type: 'group',
      id: group.id,
      title: group.name,
      meta: { group },
    })
    if (autoClose) {
      toggleList()
    }
    onSelect?.(getRoomKey('group', group.id))
  }

  const handleStartChat = async (participant) => {
    if (!participant?.id) return
    try {
      const metaForCurrent = {
        user_id: currentUserId,
        name: user?.name || 'You',
        email: user?.email,
        role: role,
        avatar: user?.student_img || user?.user_img || null,
      }
      const metaForOther = {
        user_id: participant.id,
        name: participant.name,
        email: participant.email,
        role: participant.role,
      }
      const session = await startChat(participant.id, [metaForCurrent, metaForOther])
      await loadChats()
      const meta = extractParticipant(session, currentUserId)
      openWindow({
        type: 'chat',
        id: session.id,
        title: meta.name,
        avatar: meta.avatar,
        meta: { participant: meta, session },
      })
      setSearchTerm('')
      setSearchResults([])
      if (autoClose) {
        toggleList()
      }
      onSelect?.(getRoomKey('chat', session.id))
    } catch (error) {
      console.error('Failed to start chat', error)
      setSearchError('Unable to start chat. Please try again.')
    }
  }

  const renderLastMessage = (lastMessage) => {
    if (!lastMessage) return 'No messages yet'
    if (lastMessage.message_type === 'attachment') {
      const count = lastMessage.attachments?.length || 1
      return count > 1 ? `${count} attachments` : lastMessage.attachments?.[0]?.original_name || 'Attachment'
    }
    return lastMessage.content || 'Sent a message'
  }

  const renderTimestamp = (isoString) => {
    if (!isoString) return ''
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true })
    } catch {
      return ''
    }
  }

  const handleGroupCreated = async (group) => {
    await loadGroupChats()
    if (group?.id) {
      openWindow({
        type: 'group',
        id: group.id,
        title: group.name,
        meta: { group },
      })
      if (autoClose) {
        toggleList()
      }
      onSelect?.(getRoomKey('group', group.id))
    }
  }

  const totalDirectUnread = useMemo(
    () =>
      chats.reduce(
        (sum, chat) => sum + (unreadCounts[getRoomKey('chat', chat.id)] || 0),
        0
      ),
    [chats, unreadCounts]
  )

  const totalGroupUnread = useMemo(
    () =>
      groupChats.reduce(
        (sum, group) => sum + (unreadCounts[getRoomKey('group', group.id)] || 0),
        0
      ),
    [groupChats, unreadCounts]
  )

  return (
    <>
      <div
        className={`${
          variant === 'dock'
            ? 'pointer-events-auto mb-3 w-80 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10'
            : 'flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5'
        }`}
      >
        <div className="border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold leading-tight">Messages</h2>
              <p className="text-xs text-white/80">Stay connected with your peers</p>
            </div>
            <button
              type="button"
              className="rounded-full bg-white/20 p-1 transition hover:bg-white/30"
              onClick={() => {
                refreshSessions().catch((error) => {
                  console.error('Failed to refresh chat sessions', error)
                })
              }}
              title="Refresh"
            >
              <RotateCcw className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="mt-3 flex items-center rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
            <Search className="mr-2 h-4 w-4 text-primary-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search people or groups..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
            />
          </div>
          {searchTerm && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl bg-white p-2 text-gray-900 shadow-lg">
              {isSearching && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              )}
              {!isSearching && !searchResults.length && (
                <div className="py-3 text-center text-xs text-gray-500">
                  No matching users. Try a different name or email.
                </div>
              )}
              {!isSearching &&
                searchResults.map((result) => (
                  <button
                    type="button"
                    key={`${result.role}-${result.id}`}
                    onClick={() => handleStartChat(result)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-primary-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <UserCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{result.name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {result.role || 'member'}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-primary-500" />
                  </button>
                ))}
              {searchError && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{searchError}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`flex-1 rounded-xl px-2 py-1 transition ${
              activeTab === 'direct' ? 'bg-white text-primary-600 shadow' : 'hover:bg-white/60'
            }`}
          >
            Direct ({chats.length})
            {totalDirectUnread > 0 && (
              <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-600">
                {totalDirectUnread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`flex-1 rounded-xl px-2 py-1 transition ${
              activeTab === 'groups' ? 'bg-white text-primary-600 shadow' : 'hover:bg-white/60'
            }`}
          >
            Groups ({groupChats.length})
            {totalGroupUnread > 0 && (
              <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-600">
                {totalGroupUnread}
              </span>
            )}
          </button>
        </div>

        <div className={`${variant === 'dock' ? 'max-h-80' : 'flex-1'} overflow-y-auto`}>
          {activeTab === 'direct' && (
            <ul className="divide-y divide-gray-100">
              {chats.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-gray-500">
                  No conversations yet. Use the search above to start chatting.
                </li>
              )}
              {chats.map((chat) => {
                const participant = extractParticipant(chat, currentUserId)
                const roomKey = getRoomKey('chat', chat.id)
                const unread = unreadCounts[roomKey] || 0
                const lastMessage = chat.last_message
                const lastAt = chat.last_message_at || lastMessage?.created_at
                const isOnline = participant.id && onlineUsers[participant.id]
                return (
                  <li key={chat.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenChat(chat)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-primary-50"
                    >
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                          {participant.avatar ? (
                            <img
                              src={participant.avatar}
                              alt={participant.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <MessageCircle className="h-5 w-5" />
                          )}
                        </div>
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{participant.name}</p>
                          <span className="text-xs text-gray-400">{renderTimestamp(lastAt)}</span>
                        </div>
                        <p className="line-clamp-1 text-xs text-gray-500">{renderLastMessage(lastMessage)}</p>
                      </div>
                      {unread > 0 && (
                        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary-600 px-1 text-xs font-semibold text-white">
                          {unread}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {activeTab === 'groups' && (
            <ul className="divide-y divide-gray-100">
              {groupChats.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-gray-500">
                  No group chats yet. {role === 'staff' || role === 'admin' ? 'Create one to collaborate with your class.' : 'Ask your instructor to add you to a group.'}
                </li>
              )}
              {groupChats.map((group) => {
                const unread = unreadCounts[getRoomKey('group', group.id)] || 0
                const lastMessage = group.last_message
                const lastAt = group.last_message_at || lastMessage?.created_at
                const onlineCount = (group.member_ids || []).filter((id) => onlineUsers[id]).length
                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenGroup(group)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-primary-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{group.name}</p>
                          <span className="text-xs text-gray-400">{renderTimestamp(lastAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{group.member_ids?.length || 0} members</span>
                          {onlineCount > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CircleDot className="h-3 w-3" />
                              {onlineCount} online
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-1 text-xs text-gray-500">{renderLastMessage(lastMessage)}</p>
                      </div>
                      {unread > 0 && (
                        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
                          {unread}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {(role === 'staff' || role === 'admin') && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <button
              type="button"
              onClick={() => setShowGroupModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Users className="h-4 w-4" />
              Create group chat
            </button>
          </div>
        )}
      </div>

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </>
  )
}

export default ChatListPanel
