import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, UserPlus, X } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'
import { createGroupChat, searchChatParticipants } from './chatApi'

const CreateGroupModal = ({ onClose, onCreated }) => {
  const { user, role } = useAuthStore()
  const currentUserId = useMemo(() => useChatStore.getState().currentUserId(), [])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [semester, setSemester] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState([])
  const [searchingMembers, setSearchingMembers] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedMembers, setSelectedMembers] = useState(() => {
    if (!currentUserId) return []
    return [
      {
        id: currentUserId,
        name: user?.name || 'You',
        role: role || 'staff',
        email: user?.email,
        avatar: user?.student_img || user?.user_img,
        isOwner: true,
      },
    ]
  })

  const { data: coursesData } = useQuery({
    queryKey: ['courses', 'chat-groups'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { limit: 200 } })
      return response.data?.courses || []
    },
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', 'chat-groups', courseId],
    queryFn: async () => {
      if (!courseId) return []
      const response = await api.get('/subjects', {
        params: { limit: 200, course_id: courseId },
      })
      return response.data?.subjects || []
    },
    enabled: Boolean(courseId),
  })

  const coursesOptions = useMemo(
    () =>
      (coursesData || []).map((course) => ({
        value: course._id,
        label: course.course_name || course.course_code || 'Course',
      })),
    [coursesData]
  )

  const subjectsOptions = useMemo(
    () =>
      (subjectsData || []).map((subject) => ({
        value: subject._id,
        label: subject.subject_name || subject.subject_code || 'Subject',
      })),
    [subjectsData]
  )

  useEffect(() => {
    if (!memberSearch) {
      setMemberResults([])
      setSearchingMembers(false)
      return
    }
    const handle = setTimeout(() => {
      setSearchingMembers(true)
      searchChatParticipants(memberSearch, 15)
        .then((results) => {
          const existingIds = new Set(selectedMembers.map((member) => member.id))
          setMemberResults(results.filter((participant) => !existingIds.has(participant.id)))
        })
        .catch((error) => {
          console.error('Failed to search members', error)
        })
        .finally(() => setSearchingMembers(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [memberSearch, selectedMembers])

  const handleAddMember = (participant) => {
    if (!participant?.id) return
    setSelectedMembers((prev) => {
      if (prev.some((member) => member.id === participant.id)) {
        return prev
      }
      return [
        ...prev,
        {
          id: participant.id,
          name: participant.name,
          role: participant.role,
          email: participant.email,
          avatar: participant.avatar,
        },
      ]
    })
    setMemberSearch('')
    setMemberResults([])
  }

  const handleRemoveMember = (memberId) => {
    setSelectedMembers((prev) => prev.filter((member) => member.id !== memberId || member.isOwner))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Group name is required.')
      return
    }
    if (selectedMembers.length < 2) {
      setFormError('Add at least one more member to create a group chat.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        course_id: courseId || undefined,
        subject_id: subjectId || undefined,
        semester: semester ? parseInt(semester, 10) : undefined,
        member_ids: selectedMembers
          .filter((member) => !member.isOwner)
          .map((member) => member.id),
        member_meta: selectedMembers.map((member) => ({
          user_id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          avatar: member.avatar,
        })),
      }
      const group = await createGroupChat(payload)
      onCreated?.(group)
      setIsSubmitting(false)
      onClose()
    } catch (error) {
      console.error('Failed to create group chat', error)
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to create group chat. Please try again.'
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create group chat"
      size="lg"
      closeOnOverlayClick={!isSubmitting}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            Create group
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Group name"
            placeholder="e.g. BCA Semester 4 - Project Team"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Input
            label="Semester"
            type="number"
            min={1}
            placeholder="Optional"
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
          />
          <Select
            label="Course"
            value={courseId}
            onChange={(event) => {
              setCourseId(event.target.value)
              setSubjectId('')
            }}
            options={coursesOptions}
            placeholder="Select course"
          />
          <Select
            label="Subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            options={subjectsOptions}
            placeholder={courseId ? 'Select subject' : 'Select course first'}
            disabled={!courseId}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Description"
              rows={3}
              placeholder="Share context for this group..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Group members</p>
          <p className="mt-1 text-xs text-gray-500">
            You are added automatically as the group owner. Search to add students or staff.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <span
                key={member.id}
                className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-3 py-1 text-xs text-primary-700"
              >
                {member.name}
                {member.isOwner ? (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary-600">
                    Owner
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    title="Remove member"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Add members</label>
            <div className="relative">
              <input
                type="text"
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Type a name or email..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <UserPlus className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            {memberSearch && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                {searchingMembers && (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching members...
                  </div>
                )}
                {!searchingMembers && memberResults.length === 0 && (
                  <div className="py-3 text-center text-xs text-gray-500">No matching users found.</div>
                )}
                {memberResults.map((participant) => (
                  <button
                    type="button"
                    key={`${participant.role}-${participant.id}`}
                    onClick={() => handleAddMember(participant)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition hover:bg-primary-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{participant.name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {participant.role || 'member'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary-600">Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {formError}
          </div>
        )}
      </form>
    </Modal>
  )
}

export default CreateGroupModal
