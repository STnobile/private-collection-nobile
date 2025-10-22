import { useEffect, useState } from 'react'
import { apiRequest } from '../services/apiClient'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsResponse, usersResponse, bookingsResponse] = await Promise.all([
        apiRequest('/admin/stats'),
        apiRequest('/admin/users'),
        apiRequest('/admin/bookings'),
      ])
      setStats(statsResponse)
      setUsers(usersResponse)
      setBookings(bookingsResponse)
    } catch (err) {
      setError(err.message || 'Unable to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <main className="admin-page">
      <section className="section">
        <div className="section-container">
          <span className="eyebrow">Admin area</span>
          <h1>Museum operations overview</h1>
          <p>Monitor visitors, bookings, and account activity to keep the collection running smoothly.</p>
          {error && <div className="auth-error">{error}</div>}
        </div>
      </section>

      <section className="section">
        <div className="section-container admin-grid">
          <div className="admin-stats-card">
            <h2>Key metrics</h2>
            {loading ? (
              <div className="page-spinner">Loading…</div>
            ) : stats ? (
              <ul>
                <li>
                  <span>Registered users</span>
                  <strong>{stats.total_users}</strong>
                </li>
                <li>
                  <span>Active bookings</span>
                  <strong>{stats.active_bookings}</strong>
                </li>
                <li>
                  <span>Admins</span>
                  <strong>{stats.total_admins}</strong>
                </li>
                <li>
                  <span>Deleted bookings</span>
                  <strong>{stats.deleted_bookings}</strong>
                </li>
              </ul>
            ) : (
              <p>No statistics available.</p>
            )}
          </div>

          <div className="admin-list-card">
            <h2>Recent bookings</h2>
            {loading ? (
              <div className="page-spinner">Loading…</div>
            ) : bookings.length === 0 ? (
              <p>No bookings yet.</p>
            ) : (
              <ul>
                {bookings.slice(0, 8).map((booking) => (
                  <li key={booking.id}>
                    <div>
                      <strong>{new Date(booking.date_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                      <span>{booking.people} guests</span>
                    </div>
                    <span>Booking #{booking.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-list-card">
            <h2>Registered users</h2>
            {loading ? (
              <div className="page-spinner">Loading…</div>
            ) : users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <ul>
                {users.slice(0, 10).map((user) => (
                  <li key={user.id}>
                    <div>
                      <strong>
                        {user.name} {user.surname}
                      </strong>
                      <span>{user.email}</span>
                    </div>
                    <span>{user.is_admin ? 'Admin' : 'Visitor'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard
