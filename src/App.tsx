import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Feed from './pages/Feed'
import Upload from './pages/Upload'
import Profile from './pages/Profile'
import Video from './pages/Video'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/video/:id" element={<Video />} />
      </Routes>
    </>
  )
}

export default App
