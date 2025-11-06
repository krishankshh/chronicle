import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Home() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/notices')
        setNotices(res.data.data || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <h2>Latest Notices</h2>
      {notices.length === 0 && <p>No notices yet.</p>}
      <ul className="list">
        {notices.map(n => (
          <li key={n.id} className="card">
            <h3>{n.title}</h3>
            <small>{n.type}</small>
            <p>{n.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

