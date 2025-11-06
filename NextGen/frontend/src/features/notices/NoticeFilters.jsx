import { NOTICE_TYPES } from './constants'
import { cn, capitalize } from '../../lib/utils'

const NoticeFilters = ({ activeType, onChange }) => {
  const options = [{ value: 'all', label: 'All' }, ...NOTICE_TYPES]

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            activeType === option.value
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {capitalize(option.label)}
        </button>
      ))}
    </div>
  )
}

export default NoticeFilters
