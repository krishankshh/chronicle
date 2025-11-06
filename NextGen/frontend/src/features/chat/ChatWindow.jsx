import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CheckCheck,
  Download,
  FileText,
  Image as ImageIcon,
  Info,
  Minus,
  Paperclip,
  Send,
  Smile,
  Users,
  X,
  ChevronUp,
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { format } from 'date-fns'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'
import { extractParticipant, getRoomKey } from './chatUtils'

const isImageAttachment = (attachment) =>
  typeof attachment?.content_type === 'string' && attachment.content_type.startsWith('image/')

const formatTime = (isoString) => {
  if (!isoString) return ''
  try {
    return format(new Date(isoString), 'p')
  } catch {
    return ''
  }
}

const MessageBubble = ({ message, isOwn, showAuthor, previousMessageSameSender }) => {
  const senderName =
    message.meta?.sender?.name || message.meta?.author?.name || message.meta?.name || 'Someone'
  const time = formatTime(message.created_at)
  const readCount = message.read_by?.length || 0

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isOwn ? 'bg-primary-600 text-white' : 'bg-white text-gray-900'
        } ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
      >
        {showAuthor && !isOwn && !previousMessageSameSender && (
          <p className="mb-1 text-xs font-semibold text-indigo-600">{senderName}</p>
        )}
        {message.content && (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        )}
        {message.attachments?.length > 0 && (
          <div className="mt-2 space-y-2 text-xs">
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.file_url || attachment.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-2 rounded-xl border px-2 py-1 transition ${
                  isOwn
                    ? 'border-white/40 bg-white/10 hover:bg-white/20'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isOwn ? 'bg-white/30 text-white' : 'bg-primary-100 text-primary-600'
                  }`}
                >
                  {isImageAttachment(attachment) ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </span>
                <span className="flex-1 truncate text-left text-xs">
                  {attachment.original_name || attachment.name || 'Attachment'}
                </span>
                <Download className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        )}
        <div
          className={`mt-2 flex items-center gap-1 text-[10px] ${
            isOwn ? 'text-white/80' : 'text-gray-500'
          }`}
        >
          <span>{time}</span>
          {isOwn && (readCount > 1 ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  )
}

const TypingIndicator = ({ name }) => (
  <div className="flex items-center gap-2 text-xs text-gray-500">
    <span className="flex h-2 w-2 items-center justify-center">
      <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-primary-400 opacity-75" />
    </span>
    {name ? `${name} is typing...` : 'Typing...'}
  </div>
)

const MAX_ATTACHMENTS = 5

const ChatWindow = ({ windowConfig, variant = 'floating' }) => {
  const { key, type, id, title, avatar, minimized, meta } = windowConfig
  const isFloating = variant === 'floating'
  const isCollapsed = isFloating && minimized
  const { user, role } = useAuthStore()

  const closeWindow = useChatStore((state) => state.closeWindow)
  const toggleMinimize = useChatStore((state) => state.toggleMinimize)
  const focusWindow = useChatStore((state) => state.focusWindow)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const ensureMessages = useChatStore((state) => state.ensureMessages)
  const emitTyping = useChatStore((state) => state.emitTyping)
  const emitReadReceipt = useChatStore((state) => state.emitReadReceipt)
  const clearUnread = useChatStore((state) => state.clearUnread)

  const messages = useChatStore((state) => state.messages[key] || [])
  const messageState = useChatStore((state) => state.messageState[key] || {})
  const typingInfo = useChatStore((state) => state.typingState[getRoomKey(type, id)])
  const groupDetails = useChatStore((state) =>
    type === 'group' ? state.groupChats.find((group) => group.id === id) : null
  )
  const chats = useChatStore((state) => (type === 'chat' ? state.chats : []))
  const onlineUsers = useChatStore((state) => state.onlineUsers || {})

  const currentUserId = useMemo(() => useChatStore.getState().currentUserId(), [])
  const participantMeta = useMemo(() => {
    if (type === 'group') return null
    const session = chats.find((chat) => chat.id === id) || meta?.session
    return extractParticipant(session || {}, currentUserId)
  }, [type, chats, id, meta, currentUserId])

  const [messageValue, setMessageValue] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [attachmentError, setAttachmentError] = useState('')
  const [sending, setSending] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)

  const scrollContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const typingActiveRef = useRef(false)

  useEffect(() => {
    if (!minimized) {
      focusWindow(key)
    }
  }, [minimized, focusWindow, key])

  useEffect(() => {
    if (!minimized) {
      clearUnread(key)
    }
  }, [minimized, clearUnread, key])

  useEffect(() => {
    const unreadIds = messages
      .filter(
        (msg) =>
          msg.sender_id &&
          msg.sender_id !== currentUserId &&
          !(msg.read_by || []).includes(currentUserId)
      )
      .map((msg) => msg.id)

    if (unreadIds.length && !minimized) {
      emitReadReceipt(type, id, unreadIds)
      clearUnread(key)
    }
  }, [messages, minimized, currentUserId, emitReadReceipt, type, id, key, clearUnread])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const isNearBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight) < 120
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, minimized])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (typingActiveRef.current) {
        emitTyping(type, id, false)
      }
    }
  }, [emitTyping, type, id])

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    if (container.scrollTop < 80 && messageState.hasMore && !messageState.loading) {
      ensureMessages(type, id)
    }
  }

  const handleMessageChange = (event) => {
    const { value } = event.target
    setMessageValue(value)
    if (!typingActiveRef.current) {
      emitTyping(type, id, true)
      typingActiveRef.current = true
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(type, id, false)
      typingActiveRef.current = false
    }, 1500)
  }

  const handleEmojiSelect = (emojiData) => {
    setMessageValue((prev) => prev + (emojiData?.emoji || ''))
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} files per message.`)
      return
    }
    setAttachments((prev) => [...prev, ...files])
    setAttachmentError('')
    event.target.value = ''
  }

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const buildMessageMeta = () => ({
    sender: {
      id: currentUserId,
      name: user?.name || 'You',
      role: role,
    },
  })

  const handleSendMessage = async () => {
    if (!messageValue.trim() && attachments.length === 0) {
      return
    }
    setSending(true)
    try {
      await sendMessage(
        type,
        id,
        {
          content: messageValue.trim() || null,
          message_type: attachments.length ? 'attachment' : 'text',
          meta: buildMessageMeta(),
        },
        attachments
      )
      setMessageValue('')
      setAttachments([])
      setShowEmojiPicker(false)
      emitTyping(type, id, false)
      typingActiveRef.current = false
    } catch (error) {
      console.error('Failed to send message', error)
      setAttachmentError(error.response?.data?.message || error.message || 'Unable to send message.')
    } finally {
      setSending(false)
    }
  }

  const renderGroupInfo = () => {
    if (type !== 'group') return null
    const group = groupDetails || meta?.group
    if (!group) return null

    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        {group.description && (
          <p className="mb-2 text-sm font-medium text-gray-700">{group.description}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <p>
            <span className="font-semibold text-gray-700">Course:</span>{' '}
            {group.course_id || '—'}
          </p>
          <p>
            <span className="font-semibold text-gray-700">Subject:</span>{' '}
            {group.subject_id || '—'}
          </p>
          <p>
            <span className="font-semibold text-gray-700">Semester:</span>{' '}
            {group.semester || '—'}
          </p>
          <p>
            <span className="font-semibold text-gray-700">Members:</span>{' '}
            {group.member_ids?.length || 0}
          </p>
        </div>
        {group.member_meta?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-gray-700">Members</p>
            <ul className="mt-1 space-y-1">
              {group.member_meta.map((member) => (
                <li key={member.user_id || member.id} className="flex items-center justify-between">
                  <span>{member.name}</span>
                  <span className="text-[10px] uppercase text-gray-400">{member.role || 'member'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const otherTyping =
    typingInfo &&
    typingInfo.isTyping &&
    typingInfo.userId &&
    typingInfo.userId !== currentUserId

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl bg-white ${
        isFloating
          ? `pointer-events-auto w-80 shadow-2xl ring-1 ring-black/10 transition-all md:w-96 ${
              minimized ? 'h-14' : 'h-[460px]'
            }`
          : 'h-full w-full shadow-sm ring-1 ring-black/5'
      }`}
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2 text-white">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            {avatar ? (
              <img src={avatar} alt={title} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            {type === 'chat' && participantMeta?.id && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-white ${
                  onlineUsers?.[participantMeta.id] ? 'bg-green-400' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{title}</p>
            {type === 'chat' ? (
              <p className="text-[11px] text-white/80">
                {onlineUsers?.[participantMeta?.id] ? 'Online' : 'Offline'}
              </p>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white hover:bg-white/30"
                onClick={() => setShowGroupInfo((prev) => !prev)}
              >
                <Info className="h-3 w-3" />
                {showGroupInfo ? 'Hide info' : 'Group info'}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          {isFloating && (
            <button
              type="button"
              onClick={() => toggleMinimize(key)}
              className="rounded-full p-1 transition hover:bg-white/10"
              title={minimized ? 'Expand' : 'Minimize'}
            >
              {minimized ? <ChevronUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => closeWindow(key)}
            className="rounded-full p-1 transition hover:bg-white/10"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {showGroupInfo && type === 'group' && (
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">{renderGroupInfo()}</div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 px-3 py-3"
          >
            {messageState.loading && !messages.length && (
              <div className="flex flex-1 items-center justify-center text-xs text-gray-500">
                Loading messages…
              </div>
            )}

            {messageState.hasMore && (
              <button
                type="button"
                className="mx-auto mb-2 text-xs text-primary-600 underline hover:text-primary-700"
                onClick={() => ensureMessages(type, id)}
                disabled={messageState.loading}
              >
                {messageState.loading ? 'Loading…' : 'Load previous messages'}
              </button>
            )}

            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId
              const previous = messages[index - 1]
              const showAuthor = type === 'group'
              const sameSenderAsPrevious = previous && previous.sender_id === message.sender_id
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAuthor={showAuthor}
                  previousMessageSameSender={sameSenderAsPrevious}
                />
              )
            })}

            {otherTyping && (
              <div className="ml-1 mt-auto">
                <TypingIndicator
                  name={type === 'chat' ? participantMeta?.name : 'Someone'}
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-white px-3 py-2">
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <span
                    key={`${file.name}-${index}`}
                    className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs text-primary-700"
                  >
                    {file.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="rounded-full p-0.5 text-primary-600 transition hover:bg-primary-100"
                      title="Remove attachment"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {attachmentError && (
              <p className="mb-2 text-xs text-red-600">{attachmentError}</p>
            )}

            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200">
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                  title="Insert emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </div>

              <div className="relative flex-1">
                <textarea
                  value={messageValue}
                  onChange={handleMessageChange}
                  onKeyDown={handleKeyDown}
                  rows={messageValue.length > 80 ? 3 : 2}
                  placeholder="Type a message..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2">
                    <EmojiPicker onEmojiClick={handleEmojiSelect} theme="light" height={320} width={280} />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sending || (!messageValue.trim() && attachments.length === 0)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatWindow
