const ProgressBar = ({ value, max = 100 }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div className="h-2 w-full rounded-full bg-gray-200">
      <div
        className="h-2 rounded-full bg-primary-500 transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export default ProgressBar
