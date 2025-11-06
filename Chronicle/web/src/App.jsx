import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'

export default function App() {
  return (
    <div className="container">
      <header className="header">
        <h1><Link to="/">Chronicle</Link></h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

