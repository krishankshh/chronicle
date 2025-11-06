import { useCallback, useRef, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { Alert, Button } from './ui'

const DEFAULT_ACCEPT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'text/rtf',
]

const FileUploader = ({
  label = 'Upload files',
  onFilesChange,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 20,
  multiple = true,
}) => {
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const dropRef = useRef(null)
  const inputRef = useRef(null)

  const emitFiles = useCallback(
    (nextFiles) => {
      setFiles(nextFiles)
      setError('')
      if (onFilesChange) {
        onFilesChange(nextFiles)
      }
    },
    [onFilesChange]
  )

  const validateFile = useCallback(
    (file) => {
      if (!file) return 'Invalid file.'

      if (accept.length) {
        const isAccepted = accept.some((type) => {
          if (type === '*') return true
          if (file.type === type) return true
          const extension = file.name.split('.').pop()?.toLowerCase()
          if (!extension) return false
          if (type.startsWith('.')) {
            return type.replace('.', '').toLowerCase() === extension
          }
          // fallback: compare allowed extensions from MIME list
          const allowedExt = type.split('/').pop()
          return allowedExt && extension === allowedExt.toLowerCase()
        })
        if (!isAccepted) {
          return `Unsupported file format: ${file.name}`
        }
      }

      const sizeInMB = file.size / (1024 * 1024)
      if (sizeInMB > maxSizeMB) {
        return `${file.name} exceeds the ${maxSizeMB}MB limit`
      }

      return null
    },
    [accept, maxSizeMB]
  )

  const addFiles = useCallback(
    (fileList) => {
      if (!fileList?.length) return
      const incoming = Array.from(fileList)

      const errors = incoming
        .map((file) => validateFile(file))
        .filter((validationError) => validationError !== null)

      if (errors.length) {
        setError(errors[0])
        return
      }

      const newFiles = multiple ? [...files, ...incoming] : [incoming[0]]
      const uniqueFiles = []
      const seen = new Set()

      newFiles.forEach((file) => {
        const signature = `${file.name}-${file.size}-${file.lastModified}`
        if (!seen.has(signature)) {
          seen.add(signature)
          uniqueFiles.push(file)
        }
      })

      emitFiles(uniqueFiles)
    },
    [emitFiles, files, multiple, validateFile]
  )

  const handleInputChange = useCallback(
    (event) => {
      addFiles(event.target.files)
      event.target.value = ''
    },
    [addFiles]
  )

  const handleRemove = useCallback(
    (signature) => {
      const next = files.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== signature)
      emitFiles(next)
    },
    [emitFiles, files]
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    dropRef.current?.classList.add('border-primary-500', 'bg-primary-50/40')
  }, [])

  const onDragLeave = useCallback((event) => {
    event.preventDefault()
    dropRef.current?.classList.remove('border-primary-500', 'bg-primary-50/40')
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      dropRef.current?.classList.remove('border-primary-500', 'bg-primary-50/40')
      addFiles(event.dataTransfer?.files)
    },
    [addFiles]
  )

  return (
    <div className="space-y-4">
      <div
        ref={dropRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-primary-50 p-3 text-primary-600">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{label}</p>
            <p className="text-sm text-gray-500">
              {multiple ? 'Drag & drop files or click to select multiple documents.' : 'Drag & drop or click to select a document.'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Allowed formats: pdf, doc, docx, rtf. Max size {maxSizeMB}MB each.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            Choose files
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple={multiple}
            accept={accept.join(',')}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected files</p>
          <ul className="space-y-2">
            {files.map((file) => {
              const signature = `${file.name}-${file.size}-${file.lastModified}`
              const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
              return (
                <li
                  key={signature}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{sizeMB} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(signature)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FileUploader
