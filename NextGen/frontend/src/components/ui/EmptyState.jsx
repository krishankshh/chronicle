const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
    {Icon && <Icon className="mb-3 h-8 w-8 text-gray-400" />}
    <p className="text-lg font-semibold text-gray-900">{title}</p>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export default EmptyState
