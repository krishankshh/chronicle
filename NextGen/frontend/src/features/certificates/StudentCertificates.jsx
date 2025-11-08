import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Award } from 'lucide-react'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { Card, Badge, Alert, Button } from '../../components/ui'

const StudentCertificates = () => {
  const { role } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['myCertificates'],
    queryFn: async () => {
      const response = await api.get('/certificates/student/my-certificates')
      return response.data.certificates || []
    },
  })

  const certificates = data || []

  const formatDate = (value) => {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleDateString()
  }

  const handleDownload = async (certificateId) => {
    if (!certificateId) {
      return
    }

    try {
      const response = await api.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate_${certificateId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (downloadError) {
      console.error('Failed to download certificate', downloadError)
      alert('Failed to download certificate. Please try again.')
    }
  }

  if (role !== 'student') {
    return (
      <div className="p-6">
        <Alert variant="error">
          Only students can view issued certificates.
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Award className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-600">Certificates that have been issued to your account.</p>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          Failed to load certificates. Please try again.
        </Alert>
      )}

      {isLoading ? (
        <Card className="p-8 text-center text-gray-500">Loading certificates...</Card>
      ) : certificates.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          No certificates have been issued yet.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert._id} className="p-5 space-y-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Certificate Type</p>
                  <h3 className="text-lg font-semibold text-gray-900">{cert.certificate_type_name || 'Certificate'}</h3>
                </div>
                <Badge variant={cert.status === 'Active' ? 'success' : 'warning'}>
                  {cert.status || 'Active'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-800">Issued on:</span> {formatDate(cert.issue_date)}
                </div>
                {cert.remarks && (
                  <div>
                    <span className="font-medium text-gray-800">Remarks:</span> {cert.remarks}
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                className="w-full"
                type="button"
                onClick={() => handleDownload(cert._id)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Certificate
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentCertificates
