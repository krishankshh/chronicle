import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { fetchReport } from '../admin/adminApi'
import { Card, Button, Select } from '../../components/ui'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/ToastProvider'

const REPORT_TYPES = [
  { value: 'students', label: 'Students' },
  { value: 'quizzes', label: 'Quizzes' },
  { value: 'discussions', label: 'Discussions' },
]

const ReportsPage = () => {
  const { role } = useAuthStore()
  const toast = useToast()
  const [reportType, setReportType] = useState('students')
  const [format, setFormat] = useState('table')

  const isStudent = role === 'student'

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['reports', reportType],
    queryFn: () => fetchReport(reportType),
    enabled: !isStudent,
  })

  if (isStudent) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="Reports unavailable"
        description="Switch to a staff or admin account to export data."
      />
    )
  }

  const rows = data?.rows || []

  const downloadCSV = () => {
    if (!rows.length) {
      toast.error('No rows available to export.')
      return
    }
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? '')).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}-report.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported successfully.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Phase 10</p>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Exports</h1>
        <p className="text-gray-600">Generate CSVs or queue asynchronous reports for archival.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
            options={REPORT_TYPES}
            label="Report type"
          />
          <Select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            options={[
              { value: 'table', label: 'Preview table' },
              { value: 'csv', label: 'Download CSV' },
            ]}
            label="Format"
          />
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                if (format === 'table') {
                  refetch()
                } else {
                  downloadCSV()
                }
              }}
            >
              {format === 'table' ? (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Refresh preview
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>
        {isFetching ? (
          <Skeleton className="h-48 rounded-2xl" />
        ) : rows.length === 0 ? (
          <EmptyState title="No results" description="Adjust filters or wait for new data." />
        ) : (
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(rows[0]).map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.slice(0, 20).map((row) => (
                  <tr key={row.id || row.title}>
                    {Object.keys(rows[0]).map((key) => (
                      <td key={`${row.id}-${key}`} className="px-4 py-2 text-gray-800">
                        {row[key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="px-4 py-2 text-xs text-gray-500">
                Showing first 20 rows. Use CSV export for the full dataset.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default ReportsPage
