import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, Badge, Card, Button } from '../../components/ui'
import { fetchMaterialById, downloadMaterialBundle, downloadMaterialAttachment } from './materialsApi'
import RichTextContent from '../../components/ui/RichTextContent'
import { formatDate, formatDateTime } from '../../lib/utils'

const bytesToReadable = (bytes) => {
  if (!bytes) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(2)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

const MaterialDetail = () => {
  const { materialId } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['materials', 'detail', materialId],
    queryFn: () => fetchMaterialById(materialId),
    enabled: !!materialId,
  })

  const firstPdfAttachment = useMemo(() => {
    return data?.attachments?.find((attachment) => attachment.content_type?.includes('pdf'))
  }, [data])

  const handleDownloadBundle = async (format = 'files') => {
    try {
      const response = await downloadMaterialBundle(materialId, format)
      const blob = response.data
      const filename = response.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || `${data?.title || 'material'}.${format === 'pdf' ? 'pdf' : 'zip'}`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (downloadError) {
      // Soft-fail silently for now; ideally show notification
      console.error('Failed to download material bundle', downloadError)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading material...</p>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Alert variant="error">
        Unable to load this study material. It may have been removed or you do not have permission.
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Link to="/materials" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to materials
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>Updated {formatDateTime(data.updated_at) || formatDateTime(data.created_at)}</span>
            {data.semester && <Badge variant="primary">Semester {data.semester}</Badge>}
            {data.tags?.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            <span>{data.download_count || 0} downloads</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <Button onClick={() => handleDownloadBundle('files')} className="w-full md:w-auto">
            Download attachments (ZIP)
          </Button>
          <Button variant="outline" onClick={() => handleDownloadBundle('pdf')} className="w-full md:w-auto">
            Export summary PDF
          </Button>
        </div>
      </div>

      {firstPdfAttachment && (
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-3">
            <p className="text-sm font-medium text-gray-700">
              Previewing: {firstPdfAttachment.original_name || firstPdfAttachment.name}
            </p>
          </div>
          <iframe
            title="PDF preview"
            src={`${firstPdfAttachment.file_url}#toolbar=0`}
            className="h-[500px] w-full border-0"
          />
        </Card>
      )}

      <Card className="p-6 space-y-6">
        {data.description ? (
          <RichTextContent html={data.description} />
        ) : (
          <p className="text-sm text-gray-500">No description provided.</p>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
          <p className="text-sm text-gray-500">{data.attachments?.length || 0} files</p>
        </div>

        {data.attachments?.length ? (
          <div className="divide-y divide-gray-200">
            {data.attachments.map((attachment) => (
              <div key={attachment.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {attachment.original_name || attachment.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {attachment.content_type || 'Unknown type'} • {bytesToReadable(attachment.file_size)} • Uploaded{' '}
                    {formatDate(attachment.uploaded_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {attachment.download_count || 0} downloads
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadMaterialAttachment(materialId, attachment.id)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No attachments uploaded yet.</p>
        )}
      </Card>
    </div>
  )
}

export default MaterialDetail
