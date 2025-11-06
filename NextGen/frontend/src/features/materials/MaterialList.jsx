import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Card, Alert } from '../../components/ui'
import MaterialCard from './MaterialCard'
import MaterialFilters from './MaterialFilters'
import { fetchMaterials } from './materialsApi'

const mapToOptions = (items = [], labelKey = 'name') =>
  items.map((item) => ({
    value: item._id || item.id,
    label: item[labelKey] || item.name || 'Unnamed',
  }))

const MaterialList = () => {
  const [filters, setFilters] = useState({
    courseId: 'all',
    subjectId: 'all',
    semester: '',
    search: '',
  })

  const { data: coursesData } = useQuery({
    queryKey: ['courses', 'material-filters'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { limit: 100 } })
      return response.data?.courses || []
    },
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', 'material-filters', filters.courseId],
    queryFn: async () => {
      if (filters.courseId === 'all') return []
      const response = await api.get('/subjects', {
        params: { limit: 200, course_id: filters.courseId },
      })
      return response.data?.subjects || []
    },
    enabled: filters.courseId !== 'all',
  })

  const materialsQuery = useQuery({
    queryKey: ['materials', 'list', filters],
    queryFn: () =>
      fetchMaterials({
        page: 1,
        limit: 24,
        ...(filters.courseId !== 'all' ? { course_id: filters.courseId } : {}),
        ...(filters.subjectId !== 'all' ? { subject_id: filters.subjectId } : {}),
        ...(filters.semester ? { semester: filters.semester } : {}),
        ...(filters.search ? { search: filters.search } : {}),
      }),
  })

  const courseOptions = useMemo(
    () => mapToOptions(coursesData, 'course_name'),
    [coursesData]
  )

  const subjectOptions = useMemo(
    () => mapToOptions(subjectsData, 'subject_name'),
    [subjectsData]
  )

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({
        courseId: 'all',
        subjectId: 'all',
        semester: '',
        search: '',
      })
      return
    }

    if (key === 'courseId') {
      setFilters((prev) => ({
        ...prev,
        courseId: value || 'all',
        subjectId: 'all',
      }))
      return
    }

    if (key === 'subjectId') {
      setFilters((prev) => ({
        ...prev,
        subjectId: value || 'all',
      }))
      return
    }

    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const materials = materialsQuery.data?.materials || []
  const isResetDisabled =
    filters.courseId === 'all' &&
    filters.subjectId === 'all' &&
    filters.semester === '' &&
    filters.search === ''

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
        <p className="text-gray-600">
          Browse downloadable notes, lecture resources, and supporting documents shared by your faculty.
        </p>
      </div>

      <Card className="p-6">
        <MaterialFilters
          courses={courseOptions}
          subjects={subjectOptions}
          courseId={filters.courseId}
          subjectId={filters.subjectId}
          semester={filters.semester}
          search={filters.search}
          onChange={handleFilterChange}
          isResetDisabled={isResetDisabled}
        />
      </Card>

      {materialsQuery.isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">Loading study materials...</p>
        </Card>
      ) : materialsQuery.error ? (
        <Alert variant="error">
          Failed to load study materials. Please try again later.
        </Alert>
      ) : materials.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">
            No materials found for the selected filters. Try adjusting your search criteria.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {materials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MaterialList
