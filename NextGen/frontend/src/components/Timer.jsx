import { useEffect, useState } from 'react'

const Timer = ({ durationSeconds, onExpire, isPaused = false }) => {
  const [remaining, setRemaining] = useState(durationSeconds)

  useEffect(() => {
    setRemaining(durationSeconds)
  }, [durationSeconds])

  useEffect(() => {
    if (isPaused) return
    if (remaining <= 0) {
      if (onExpire) onExpire()
      return
    }
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (onExpire) onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [remaining, onExpire, isPaused])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <span className={`font-semibold ${remaining < 60 ? 'text-red-600' : 'text-gray-800'}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  )
}

export default Timer
