import { useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { Button, Alert } from '../../components/ui'
import FileUploader from '../../components/FileUploader'

const ReplyComposer = ({ parentReplyId = null, onSubmit, loading }) => {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!content || content === '<p><br></p>') {
      setError('Reply content is required.')
      return
    }

    try {
      await onSubmit({
        payload: {
          content,
          parent_reply_id: parentReplyId,
        },
        files,
      })
      setContent('')
      setFiles([])
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to post reply.'
      setError(message)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <ReactQuill value={content} onChange={setContent} />
      <FileUploader onFilesChange={setFiles} multiple maxSizeMB={10} />
      <div className="flex justify-end">
        <Button onClick={handleSubmit} loading={loading}>
          Post reply
        </Button>
      </div>
    </div>
  )
}

export default ReplyComposer
