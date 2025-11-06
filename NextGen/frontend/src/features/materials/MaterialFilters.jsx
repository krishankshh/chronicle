import { useEffect } from 'react'
import { Input, Select, Button } from '../../components/ui'

const MaterialFilters = ({
  courses = [],
  subjects = [],
  courseId,
  subjectId,
  semester,
  search,
  onChange,
  isResetDisabled,
}) => {
  useEffect(() => {
    if (!courses.find((course) => course.value === courseId) && courseId !== 'all') {
      onChange('courseId', 'all')
    }
  }, [courseId, courses, onChange])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div>
        <Select
          label="Course"
          value={courseId}
          onChange={(event) => onChange('courseId', event.target.value)}
          options={[{ value: 'all', label: 'All courses' }, ...courses]}
        />
      </div>
      <div>
        <Select
          label="Subject"
          value={subjectId}
          onChange={(event) => onChange('subjectId', event.target.value)}
          options={[{ value: 'all', label: 'All subjects' }, ...subjects]}
          disabled={courseId === 'all'}
        />
      </div>
      <div>
        <Input
          label="Semester"
          value={semester}
          onChange={(event) => onChange('semester', event.target.value)}
          placeholder="e.g. 3"
          type="number"
          min={1}
        />
      </div>
      <div className="space-y-2">
        <Input
          label="Search"
          value={search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder="Search title or description"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange('reset')}
          disabled={isResetDisabled}
          className="w-full"
        >
          Reset filters
        </Button>
      </div>
    </div>
  )
}

export default MaterialFilters
