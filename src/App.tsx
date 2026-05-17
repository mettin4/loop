import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Feed from './pages/Feed'
import Upload from './pages/Upload'
import Profile from './pages/Profile'
import VideoDetail from './pages/VideoDetail'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/v/:owner/:blobName" element={<VideoDetail />} />
      </Routes>
    </>
  )
}

export default App
