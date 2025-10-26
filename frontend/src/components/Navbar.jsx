import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const linkClass = ({ isActive }) => (isActive ? 'active' : undefined)

const Navbar = () => {
  const { pathname } = useLocation()
  const { isAuthenticated, isAdmin, logout } = useAuth()
  const isLanding = pathname === '/'
  const hideNavigation = isLanding && !isAuthenticated
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)
  const closeMenu = () => setIsMenuOpen(false)

  const baseLinks = [
    { to: '/home', label: 'Home', end: true },
    { to: '/gallery', label: 'Gallery' },
    { to: '/contact', label: 'Contact Us' },
  ]

  const authLinks = isAuthenticated
    ? [
        { to: '/bookings', label: 'My Bookings' },
        { to: '/account', label: 'Account' },
        ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
      ]
    : [
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' },
      ]

  const navLinks = [...baseLinks, ...authLinks]

  return (
    <nav>
      <h2 className="logo">
        Museo Vini <span>Nobile</span>
      </h2>
      {!hideNavigation && (
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
            {navLinks.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={linkClass} onClick={closeMenu}>
                  {label}
                </NavLink>
              </li>
            ))}
            {isAuthenticated && (
              <li>
                <button type="button" className="nav-logout" onClick={() => { closeMenu(); logout() }}>
                  Logout
                </button>
              </li>
            )}
          </ul>
        </>
      )}
    </nav>
  )
}

export default Navbar
