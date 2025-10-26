import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { apiRequest } from '../services/apiClient'

const TIME_SLOTS = [
  { value: '09:00', label: '09:00 – 10:00' },
  { value: '10:30', label: '10:30 – 11:30' },
  { value: '12:00', label: '12:00 – 13:00' },
  { value: '15:00', label: '15:00 – 16:00' },
  { value: '16:30', label: '16:30 – 17:30' },
  { value: '18:00', label: '18:00 – 19:30' },
]

const getTodayDate = () => new Date().toISOString().slice(0, 10)
const getDefaultDateTime = () => `${getTodayDate()}T${TIME_SLOTS[0].value}`

const createInitialForm = () => ({
  date_time: getDefaultDateTime(),
  people: 1,
  info_message: '',
  experience_type: 'guided_tour',
})

const requestInitialForm = {
  requested_date_time: '',
  requested_people: '',
  requested_info_message: '',
  note: '',
}

const EXPERIENCE_OPTIONS = [
  { value: 'guided_tour', label: 'Guided tour' },
  { value: 'tour_tasting', label: 'Tour + tasting' },
]

const formatDateTimeForInput = (value) => (value ? value.slice(0, 16) : '')

const normalizeDateTimeInput = (value) => {
  if (!value) return ''
  return value.length === 16 ? `${value}:00` : value
}

const isSlotInPast = (value) => {
  if (!value) return false
  const normalized = normalizeDateTimeInput(value)
  const slotDate = new Date(normalized)
  if (Number.isNaN(slotDate.getTime())) {
    return false
  }
  return slotDate <= new Date()
}

const Bookings = () => {
  const { user } = useAuth()
  const [formState, setFormState] = useState(createInitialForm)
  const [bookings, setBookings] = useState([])
  const [updateRequests, setUpdateRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeBookingId, setActiveBookingId] = useState(null)
  const [requestFormState, setRequestFormState] = useState(requestInitialForm)
  const [requestGlobalError, setRequestGlobalError] = useState('')
  const [requestGlobalSuccess, setRequestGlobalSuccess] = useState('')
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false)
  const [requestValidationError, setRequestValidationError] = useState('')
  const [requestOriginalBooking, setRequestOriginalBooking] = useState(null)
  const [toast, setToast] = useState(null)
  const [guestContacts, setGuestContacts] = useState([{ name: '', email: '' }])
  const [availabilityStatus, setAvailabilityStatus] = useState(null)
  const [availabilityError, setAvailabilityError] = useState('')
  const [dateTimeError, setDateTimeError] = useState('')
  const bookingFormRef = useRef(null)
  const toastTimeoutRef = useRef(null)
  const availabilityRequestIdRef = useRef(0)

  const showToast = useCallback((type, message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToast({ type, message })
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, 3500)
  }, [])

  const fetchBookings = async () => {
    setError('')
    setRequestGlobalError('')
    setRequestGlobalSuccess('')
    setLoading(true)
    setRequestsLoading(true)

    try {
      const bookingsData = await apiRequest('/users/me/bookings')
      setBookings(bookingsData)
    } catch (err) {
      setBookings([])
      setError(err.message || 'Unable to load bookings')
      setLoading(false)
      setRequestsLoading(false)
      return
    }

    try {
      const requestsData = await apiRequest('/bookings/update-requests/me')
      setUpdateRequests(requestsData)
    } catch (err) {
      console.warn('Unable to load update requests:', err)
      setUpdateRequests([])
      setRequestGlobalError('Your bookings loaded, but change requests could not be fetched. They will appear once the connection recovers.')
    } finally {
      setLoading(false)
      setRequestsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!formState.date_time) {
      setAvailabilityStatus(null)
      setAvailabilityError('')
      return
    }
    if (dateTimeError) {
      setAvailabilityError(dateTimeError)
      setAvailabilityStatus(null)
      return
    }
    if (isSlotInPast(formState.date_time)) {
      setAvailabilityStatus(null)
      setAvailabilityError('Selected slot has already passed.')
      return
    }
    const slotForApi = normalizeDateTimeInput(formState.date_time)
    if (!slotForApi) {
      setAvailabilityStatus(null)
      setAvailabilityError('')
      return
    }
    const requestId = ++availabilityRequestIdRef.current
    const fetchAvailability = async () => {
      try {
        setAvailabilityError('')
        setAvailabilityStatus('loading')
        const data = await apiRequest(
          `/bookings/availability?date_time=${encodeURIComponent(slotForApi)}&experience_type=${formState.experience_type}`,
          { method: 'GET' },
        )
        if (availabilityRequestIdRef.current === requestId) {
          setAvailabilityStatus(data)
        }
      } catch (err) {
        if (availabilityRequestIdRef.current === requestId) {
          setAvailabilityStatus(null)
          setAvailabilityError(err.message || 'Unable to check availability right now.')
        }
      }
    }
    fetchAvailability()
  }, [formState.date_time, formState.experience_type, dateTimeError])

  useEffect(() => {
    setFormState(createInitialForm())
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: name === 'people' ? Number(value) : value,
    }))
  }

  const handleDateChange = (event) => {
    const { value } = event.target
    setDateTimeError('')
    const safeDate = value || getTodayDate()
    setFormState((prev) => ({
      ...prev,
      date_time: `${safeDate}T${(prev.date_time || getDefaultDateTime()).slice(11, 16) || TIME_SLOTS[0].value}`,
    }))
  }

  const handleSlotChange = (event) => {
    const { value } = event.target
    if (!value) {
      setDateTimeError('Please select a time slot.')
      return
    }
    const composed = `${(formState.date_time || getDefaultDateTime()).slice(0, 10)}T${value}`
    if (isSlotInPast(composed)) {
      setDateTimeError('Selected slot has already passed. Choose a future slot.')
    } else {
      setDateTimeError('')
    }
    setFormState((prev) => ({
      ...prev,
      date_time: composed,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    if (dateTimeError) {
      setError(dateTimeError)
      setIsSubmitting(false)
      return
    }
    const preparedGuestContacts = guestContacts
      .map((contact) => ({ name: contact.name.trim(), email: contact.email.trim() }))
      .filter((contact) => contact.name && contact.email)
    const bookingSlot = normalizeDateTimeInput(formState.date_time)
    if (!bookingSlot) {
      setError('Please select a valid date and time before booking.')
      setIsSubmitting(false)
      return
    }
    if (isSlotInPast(formState.date_time)) {
      setError('Selected slot has already passed. Choose a future slot.')
      setIsSubmitting(false)
      return
    }
    try {
      const payload = {
        date_time: bookingSlot,
        people: Number(formState.people),
        info_message: formState.info_message || null,
        experience_type: formState.experience_type,
        guest_contacts: preparedGuestContacts.length > 0 ? preparedGuestContacts : null,
      }
      const created = await apiRequest('/bookings/', {
        method: 'POST',
        body: payload,
      })
      setBookings((prev) => [...prev, created].sort((a, b) => new Date(a.date_time) - new Date(b.date_time)))
      showToast('success', 'Reservation created successfully')
      setGuestContacts([{ name: '', email: '' }])
      setFormState((prev) => ({ ...createInitialForm(), experience_type: prev.experience_type }))
      setAvailabilityStatus(null)
      setAvailabilityError('')
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
      showToast('info', 'Reservation cancelled')
    } catch (err) {
      setError(err.message || 'Unable to cancel reservation')
    }
  }

  const openUpdateForm = (booking) => {
    setActiveBookingId(booking.id)
    setRequestOriginalBooking(booking)
    setRequestGlobalError('')
    setRequestFormState({
      requested_date_time: formatDateTimeForInput(booking.date_time),
      requested_people: booking.people,
      requested_info_message: booking.info_message || '',
      note: '',
    })
  }

  const closeUpdateForm = () => {
    setActiveBookingId(null)
    setRequestFormState(requestInitialForm)
    setIsRequestSubmitting(false)
    setRequestOriginalBooking(null)
    setRequestValidationError('')
  }

  const handleRequestChange = (event) => {
    const { name, value } = event.target
    setRequestFormState((prev) => ({
      ...prev,
      [name]:
        name === 'requested_people'
          ? value === ''
            ? ''
            : Number(value)
          : value,
    }))
  }

  const updateGuestContact = (index, key, value) => {
    setGuestContacts((prev) =>
      prev.map((contact, contactIndex) => (contactIndex === index ? { ...contact, [key]: value } : contact)),
    )
  }

  const addGuestContactRow = () => {
    setGuestContacts((prev) => [...prev, { name: '', email: '' }])
  }

  const removeGuestContactRow = (index) => {
    setGuestContacts((prev) => prev.filter((_, contactIndex) => contactIndex !== index))
  }

  const toNullableValue = (value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length ? trimmed : null
    }
    return value
  }

  const handleUpdateRequestSubmit = async (event) => {
    event.preventDefault()
    if (!activeBookingId) return
    setRequestGlobalError('')
    setRequestGlobalSuccess('')
    setIsRequestSubmitting(true)

    const payload = {
      requested_date_time: requestFormState.requested_date_time
        ? normalizeDateTimeInput(requestFormState.requested_date_time)
        : null,
      requested_people:
        requestFormState.requested_people === '' || requestFormState.requested_people === null
          ? null
          : Number(requestFormState.requested_people),
      requested_info_message: toNullableValue(requestFormState.requested_info_message),
      note: toNullableValue(requestFormState.note),
    }

    if (requestValidationError) {
      setRequestGlobalError(requestValidationError)
      setIsRequestSubmitting(false)
      return
    }

    try {
      const created = await apiRequest(`/bookings/${activeBookingId}/update-request`, {
        method: 'POST',
        body: payload,
      })
      setUpdateRequests((prev) => [created, ...prev])
      setRequestGlobalSuccess('Update request sent. We will notify you once it is reviewed.')
      showToast('success', 'Update request sent to the admin')
      closeUpdateForm()
    } catch (err) {
      setRequestGlobalError(err.message || 'Unable to send update request')
    } finally {
      setIsRequestSubmitting(false)
    }
  }

  const bookingsByTime = useMemo(() => {
    const now = new Date()
    const upcoming = []
    const past = []
    bookings.forEach((booking) => {
      if (new Date(booking.date_time) >= now) {
        upcoming.push(booking)
      } else {
        past.push(booking)
      }
    })
    return {
      upcoming: upcoming.sort((a, b) => new Date(a.date_time) - new Date(b.date_time)),
      past: past.sort((a, b) => new Date(b.date_time) - new Date(a.date_time)),
    }
  }, [bookings])

  const bookingRequestLookup = useMemo(() => {
    return updateRequests.reduce((acc, request) => {
      const existing = acc[request.booking_id]
      if (!existing || new Date(request.created_at) > new Date(existing.created_at)) {
        acc[request.booking_id] = request
      }
      return acc
    }, {})
  }, [updateRequests])

  const statusLabels = {
    pending: 'Pending review',
    approved: 'Approved',
    rejected: 'Declined',
  }

  const experienceLabels = {
    guided_tour: 'Guided tour',
    tour_tasting: 'Tour + tasting',
  }

  const scrollToBookingForm = () => {
    bookingFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleRebook = (booking) => {
    setFormState({
      date_time: '',
      people: booking.people,
      info_message: booking.info_message || '',
      experience_type: booking.experience_type || 'guided_tour',
    })
    if (booking.guest_contacts && booking.guest_contacts.length > 0) {
      setGuestContacts([...booking.guest_contacts, { name: '', email: '' }])
    } else {
      setGuestContacts([{ name: '', email: '' }])
    }
    scrollToBookingForm()
    showToast('info', 'Details copied from your previous visit. Choose a new date to finish rebooking.')
  }

  const downloadCalendarEvent = (booking) => {
    const start = new Date(booking.date_time)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const format = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
    const description = booking.info_message ? booking.info_message.replace(/\n/g, ' ') : 'Museum reservation'
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Museo Vini//EN\nBEGIN:VEVENT\nUID:booking-${booking.id}@museo-vini\nDTSTAMP:${format(new Date())}\nDTSTART:${format(start)}\nDTEND:${format(end)}\nSUMMARY:${experienceLabels[booking.experience_type] || 'Museum visit'}\nDESCRIPTION:${description}\nEND:VEVENT\nEND:VCALENDAR`
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `museo-booking-${booking.id}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const validateRequestInputs = useCallback(() => {
    if (!requestOriginalBooking || !activeBookingId) {
      setRequestValidationError('')
      return
    }

    const originalDate = requestOriginalBooking.date_time
    const formattedOriginal = formatDateTimeForInput(originalDate)
    const hasDateChange =
      requestFormState.requested_date_time && requestFormState.requested_date_time !== formattedOriginal
    const hasPeopleChange =
      requestFormState.requested_people !== '' && requestFormState.requested_people !== requestOriginalBooking.people
    const hasInfoChange =
      (requestFormState.requested_info_message || '').trim() !== (requestOriginalBooking.info_message || '').trim()

    if (!hasDateChange && !hasPeopleChange && !hasInfoChange) {
      setRequestValidationError('Update at least one field before sending your request.')
      return
    }

    if (requestFormState.requested_date_time) {
      const requested = new Date(requestFormState.requested_date_time)
      if (requested <= new Date()) {
        setRequestValidationError('Requested date must be in the future.')
        return
      }
    }

    setRequestValidationError('')
  }, [requestFormState, requestOriginalBooking, activeBookingId])

  useEffect(() => {
    validateRequestInputs()
  }, [validateRequestInputs])

  return (
    <main className="bookings-page">
      {toast && (
        <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
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
            {error && (
              <div className="auth-error">
                {error}
                <div className="inline-actions">
                  <button type="button" className="link-button" onClick={fetchBookings}>
                    Retry fetch
                  </button>
                  <button type="button" className="link-button" onClick={scrollToBookingForm}>
                    Book manually
                  </button>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="booking-form" ref={bookingFormRef}>
              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={formState.date_time ? formState.date_time.slice(0, 10) : ''}
                min={getTodayDate()}
                onChange={handleDateChange}
                required
              />

              <label htmlFor="time-slot">Time slot</label>
              <select
                id="time-slot"
                name="time-slot"
                value={formState.date_time ? formState.date_time.slice(11, 16) : ''}
                onChange={handleSlotChange}
                required
              >
                <option value="" disabled>
                  Select a time slot
                </option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
              <p className="field-hint">Available slots: 09:00–10:00, 10:30–11:30, 12:00–13:00, 15:00–16:00, 16:30–17:30, 18:00–19:30.</p>

              <label htmlFor="experience_type">Experience type</label>
              <select
                id="experience_type"
                name="experience_type"
                value={formState.experience_type}
                onChange={handleChange}
                required
              >
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {availabilityStatus === 'loading' ? (
                <p className="availability-hint">Checking availability…</p>
              ) : availabilityStatus ? (
                <p
                  className={`availability-hint ${
                    availabilityStatus.is_full
                      ? 'danger'
                      : availabilityStatus.remaining <= 3
                        ? 'warning'
                        : 'success'
                  }`}
                >
                  {availabilityStatus.is_full
                    ? 'This slot is fully booked. Consider choosing another time.'
                    : availabilityStatus.remaining <= 3
                      ? `Only ${availabilityStatus.remaining} of ${availabilityStatus.capacity} spots left for this experience.`
                      : `${availabilityStatus.remaining} of ${availabilityStatus.capacity} spots available for this experience.`}
                </p>
              ) : (
                availabilityError && <p className="availability-hint danger">{availabilityError}</p>
              )}

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

              <div className="guest-contacts">
                <div className="guest-contacts__header">
                  <label>Guest contacts (optional)</label>
                  <span>Add names and emails so everyone receives reminders.</span>
                </div>
                {guestContacts.map((contact, index) => (
                  <div key={`guest-${index}`} className="guest-contacts__row">
                    <input
                      type="text"
                      placeholder="Guest name"
                      value={contact.name}
                      onChange={(event) => updateGuestContact(index, 'name', event.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="Guest email"
                      value={contact.email}
                      onChange={(event) => updateGuestContact(index, 'email', event.target.value)}
                    />
                    {guestContacts.length > 1 && (
                      <button type="button" className="link-button" onClick={() => removeGuestContactRow(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="link-button" onClick={addGuestContactRow}>
                  + Add another guest
                </button>
              </div>

              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Confirm reservation'}
              </button>
            </form>
          </div>

          <div className="booking-list-card">
            <h2>Your upcoming reservations</h2>
            {requestGlobalError && <div className="auth-error">{requestGlobalError}</div>}
            {requestGlobalSuccess && <div className="auth-success">{requestGlobalSuccess}</div>}
            {requestsLoading && !loading && !requestGlobalError && (
              <div className="booking-request-hint">Fetching latest change requests…</div>
            )}
            {loading ? (
              <div className="booking-skeleton-list">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="booking-skeleton" />
                ))}
              </div>
            ) : bookingsByTime.upcoming.length === 0 ? (
              <div className="booking-empty-state">
                <p>No reservations yet. Once you book, you&apos;ll see the details here.</p>
                <button type="button" className="auth-submit ghost" onClick={scrollToBookingForm}>
                  Book your first visit
                </button>
              </div>
            ) : (
              <ul className="booking-list">
                {bookingsByTime.upcoming.map((booking) => {
                  const latestRequest = bookingRequestLookup[booking.id]
                  return (
                    <li key={booking.id} className="booking-item">
                      <div className="booking-item-header">
                      <div>
                        <h3>
                          {new Date(booking.date_time).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </h3>
                        <span className="experience-chip">
                          {experienceLabels[booking.experience_type] || 'Museum visit'}
                        </span>
                        <p>
                          Guests: <strong>{booking.people}</strong>
                        </p>
                        {booking.created_at && (
                          <p className="booking-meta">
                            Reservation made on{' '}
                            {new Date(booking.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                          </p>
                        )}
                        {booking.info_message && <p className="booking-note">{booking.info_message}</p>}
                        {booking.guest_contacts && booking.guest_contacts.length > 0 && (
                          <ul className="guest-contact-list">
                            {booking.guest_contacts.map((contact, index) => (
                              <li key={`${booking.id}-guest-${index}`}>
                                {contact.name} · {contact.email}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="booking-actions">
                        <button type="button" className="secondary" onClick={() => openUpdateForm(booking)}>
                          Request change
                        </button>
                        <button type="button" className="secondary" onClick={() => downloadCalendarEvent(booking)}>
                          Add to calendar
                        </button>
                        <button type="button" className="danger" onClick={() => handleDelete(booking.id)}>
                          Cancel
                        </button>
                      </div>
                    </div>

                      {latestRequest && (
                        <div className="booking-request-summary">
                          <div className="booking-request-summary__header">
                            <span className={`booking-request-status booking-request-status--${latestRequest.status}`}>
                              {statusLabels[latestRequest.status] || latestRequest.status}
                            </span>
                            <span className="booking-request-timestamp">
                              Sent {new Date(latestRequest.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <ul>
                            {latestRequest.requested_date_time && (
                              <li>
                                New date:{' '}
                                <strong>
                                  {new Date(latestRequest.requested_date_time).toLocaleString([], {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </strong>
                              </li>
                            )}
                            {latestRequest.requested_people && (
                              <li>
                                Guests: <strong>{latestRequest.requested_people}</strong>
                              </li>
                            )}
                            {latestRequest.requested_info_message && <li>{latestRequest.requested_info_message}</li>}
                          </ul>
                          {latestRequest.note && <p className="booking-request-note">Your note: {latestRequest.note}</p>}
                          {latestRequest.admin_note && (
                            <p className="booking-request-note admin">Admin reply: {latestRequest.admin_note}</p>
                          )}
                        </div>
                      )}

                      {activeBookingId === booking.id && (
                        <form className="booking-update-form" onSubmit={handleUpdateRequestSubmit}>
                          <p>
                            Propose new details and we&apos;ll forward them to the admin team for approval.
                          </p>
                          <label htmlFor={`requested_date_time-${booking.id}`}>Requested date &amp; time</label>
                          <input
                            id={`requested_date_time-${booking.id}`}
                            name="requested_date_time"
                            type="datetime-local"
                            value={requestFormState.requested_date_time}
                            min={new Date().toISOString().slice(0, 16)}
                            onChange={handleRequestChange}
                          />

                          <label htmlFor={`requested_people-${booking.id}`}>Requested number of guests</label>
                          <input
                            id={`requested_people-${booking.id}`}
                            name="requested_people"
                            type="number"
                            min={1}
                            value={requestFormState.requested_people}
                            onChange={handleRequestChange}
                          />

                          <label htmlFor={`requested_info_message-${booking.id}`}>Notes for the visit</label>
                          <textarea
                            id={`requested_info_message-${booking.id}`}
                            name="requested_info_message"
                            rows={3}
                            value={requestFormState.requested_info_message}
                            onChange={handleRequestChange}
                            placeholder="Share accessibility needs or itinerary changes"
                          />

                          <label htmlFor={`note-${booking.id}`}>Message</label>
                          <textarea
                            id={`note-${booking.id}`}
                            name="note"
                            rows={3}
                            value={requestFormState.note}
                            onChange={handleRequestChange}
                            placeholder="Explain why you need to adjust this booking"
                          />

                          <div className="booking-update-form__actions">
                            <button type="button" className="secondary" onClick={closeUpdateForm}>
                              Close
                            </button>
                            <button type="submit" className="auth-submit" disabled={isRequestSubmitting}>
                              {isRequestSubmitting ? 'Sending…' : 'Send request'}
                            </button>
                          </div>
                        </form>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
      {!loading && bookingsByTime.past.length > 0 && (
        <section className="section">
          <div className="section-container booking-history-card">
            <h2>Past visits</h2>
            <p className="account-card-subtitle">Rebook your favourite experiences with one click.</p>
            <ul className="booking-history-list">
              {bookingsByTime.past.map((booking) => (
                <li key={booking.id}>
                  <div>
                    <strong>
                      {new Date(booking.date_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </strong>
                    <span>
                      {booking.people} guests · {experienceLabels[booking.experience_type] || 'Museum visit'}
                    </span>
                  </div>
                  <button type="button" className="secondary" onClick={() => handleRebook(booking)}>
                    Rebook
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  )
}

export default Bookings
