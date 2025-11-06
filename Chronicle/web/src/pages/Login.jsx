import { useState } from 'react'
import { api } from '../api/client'

export default function Login() {
  const [role, setRole] = useState('student')
  const [rollNo, setRollNo] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (role === 'student') {
        const res = await api.post('/api/auth/student/login', { rollNo, password })
        setMessage('Logged in as student: ' + (res.data.data?.student?.name || ''))
      } else {
        const res = await api.post('/api/auth/staff/login', { loginId, password })
        setMessage('Logged in as staff: ' + (res.data.data?.user?.name || ''))
      }
    } catch (err) {
      setMessage(err?.response?.data?.data?.error || 'Login failed')
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <div className="tabs">
        <button onClick={() => setRole('student')} className={role==='student' ? 'active' : ''}>Student</button>
        <button onClick={() => setRole('staff')} className={role==='staff' ? 'active' : ''}>Staff</button>
      </div>
      <form onSubmit={submit} className="form">
        {role === 'student' ? (
          <>
            <label>Roll No
              <input value={rollNo} onChange={e=>setRollNo(e.target.value)} required />
            </label>
          </>
        ) : (
          <>
            <label>Login ID
              <input value={loginId} onChange={e=>setLoginId(e.target.value)} required />
            </label>
          </>
        )}
        <label>Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button type="submit">Sign in</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  )
}

