/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext({
  success: () => {},
  error: () => {},
  info: () => {},
})

let toastCounter = 0

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (message, variant = 'info', duration = 3500) => {
      toastCounter += 1
      const id = toastCounter
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => removeToast(id), duration)
    },
    [removeToast],
  )

  const api = useMemo(
    () => ({
      success: (message) => pushToast(message, 'success'),
      error: (message) => pushToast(message, 'error', 4500),
      info: (message) => pushToast(message, 'info'),
    }),
    [pushToast],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm text-white shadow-lg transition ${
              toast.variant === 'success'
                ? 'bg-green-600'
                : toast.variant === 'error'
                  ? 'bg-red-600'
                  : 'bg-gray-900'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

export default ToastProvider
