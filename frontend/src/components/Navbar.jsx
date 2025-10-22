import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const linkClass = ({ isActive }) => (isActive ? 'active' : undefined)

const Navbar = () => {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)

  return (
    <nav>
      <h2 className="logo">
        Museo Vini <span>Nobile</span>
      </h2>
      {!isLanding && (
        <>
          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
            onClick={toggleMenu}
          >
            <span />
            <span />
            <span />
          </button>
          <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
            <li>
              <NavLink to="/home" end className={linkClass}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/gallery" className={linkClass}>
                Gallery
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={linkClass}>
                Contact Us
              </NavLink>
            </li>
          </ul>
        </>
      )}
    </nav>
  )
}

export default Navbar
