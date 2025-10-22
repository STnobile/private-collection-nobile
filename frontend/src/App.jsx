import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import IndexPage from './pages/Index'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route
          path="/home"
          element={
            <>
              <Home />
              <Footer />
            </>
          }
        />
        <Route
          path="/gallery"
          element={
            <>
              <Gallery />
              <Footer />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Contact />
              <Footer />
            </>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
