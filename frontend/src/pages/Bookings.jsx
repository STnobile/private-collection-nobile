import { useEffect, useMemo, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { apiRequest } from '../services/apiClient'

const initialForm = {
  date_time: '',
  people: 1,
  info_message: '',
}

const Bookings = () => {
  const { user } = useAuth()
  const [formState, setFormState] = useState(initialForm)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchBookings = async () => {
    setError('')
    try {
      const data = await apiRequest('/users/me/bookings')
      setBookings(data)
    } catch (err) {
      setError(err.message || 'Unable to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: name === 'people' ? Number(value) : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    try {
      const payload = {
        date_time: new Date(formState.date_time).toISOString(),
        people: Number(formState.people),
        info_message: formState.info_message || null,
      }
      const created = await apiRequest('/bookings/', {
        method: 'POST',
        body: payload,
      })
      setBookings((prev) => [...prev, created].sort((a, b) => new Date(a.date_time) - new Date(b.date_time)))
      setSuccess('Reservation created successfully.')
      setFormState(initialForm)
    } catch (err) {
      setError(err.message || 'Unable to create reservation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (bookingId) => {
    setError('')
    try {
      await apiRequest(`/bookings/${bookingId}`, { method: 'DELETE' })
      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId))
    } catch (err) {
      setError(err.message || 'Unable to cancel reservation')
    }
  }

  const upcomingBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
  }, [bookings])

  return (
    <main className="bookings-page">
      <section className="section section-container bookings-hero">
        <div>
          <span className="eyebrow">Le tue prenotazioni</span>
          <h1>Manage your museum experience</h1>
          <p>
            {user?.name
              ? `Ciao ${user.name}! Reserve your visit, invite friends, and keep track of upcoming tours.`
              : 'Reserve your visit, invite friends, and keep track of upcoming tours.'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-container bookings-layout">
          <div className="booking-form-card">
            <h2>Book a new visit</h2>
            <p className="booking-form-subtitle">
              Select a date and time that suits you. We&apos;ll confirm availability by email.
            </p>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}
            <form onSubmit={handleSubmit} className="booking-form">
              <label htmlFor="date_time">Date &amp; time</label>
              <input
                id="date_time"
                name="date_time"
                type="datetime-local"
                value={formState.date_time}
                min={new Date().toISOString().slice(0, 16)}
                onChange={handleChange}
                required
              />

              <label htmlFor="people">Number of guests</label>
              <input
                id="people"
                name="people"
                type="number"
                min={1}
                value={formState.people}
                onChange={handleChange}
                required
              />

              <label htmlFor="info_message">Special requests (optional)</label>
              <textarea
                id="info_message"
                name="info_message"
                rows={3}
                value={formState.info_message}
                onChange={handleChange}
                placeholder="Tell us about accessibility needs or interests you’d like us to highlight."
              />

              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Confirm reservation'}
              </button>
            </form>
          </div>

          <div className="booking-list-card">
            <h2>Your upcoming reservations</h2>
            {loading ? (
              <div className="page-spinner">Loading bookings…</div>
            ) : upcomingBookings.length === 0 ? (
              <p className="booking-empty-state">
                No reservations yet. Once you book, you&apos;ll see the details here.
              </p>
            ) : (
              <ul className="booking-list">
                {upcomingBookings.map((booking) => (
                  <li key={booking.id} className="booking-item">
                    <div>
                      <h3>{new Date(booking.date_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</h3>
                      <p>
                        Guests: <strong>{booking.people}</strong>
                      </p>
                      {booking.info_message && <p className="booking-note">{booking.info_message}</p>}
                    </div>
                    <button type="button" onClick={() => handleDelete(booking.id)}>
                      Cancel
                    </button>
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

export default Bookings
