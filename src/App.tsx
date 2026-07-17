import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Acceuil from './pages/Acceuil'
import Contact from './pages/Contact'
import Post from './pages/Post'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Acceuil />} />
            <Route path="/post/:slug" element={<Post />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
