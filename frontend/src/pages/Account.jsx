import { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { apiRequest } from '../services/apiClient'
import { setStoredUser } from '../services/authService'

const Account = () => {
  const { user, setUser } = useAuth()
  const [contactForm, setContactForm] = useState({ email: user?.email || '', phone: user?.phone || '' })
  const [contactStatus, setContactStatus] = useState({ success: '', error: '', loading: false })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_new_password: '' })
  const [passwordStatus, setPasswordStatus] = useState({ success: '', error: '', loading: false })

  useEffect(() => {
    if (user) {
      setContactForm({ email: user.email || '', phone: user.phone || '' })
    }
  }, [user])

  const handleContactChange = (event) => {
    const { name, value } = event.target
    setContactForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleContactSubmit = async (event) => {
    event.preventDefault()
    setContactStatus({ success: '', error: '', loading: true })
    try {
      const updated = await apiRequest('/users/me', {
        method: 'PUT',
        body: {
          email: contactForm.email,
          phone: contactForm.phone,
        },
      })
      setUser(updated)
      setStoredUser(updated)
      setContactStatus({ success: 'Contact info updated.', error: '', loading: false })
    } catch (error) {
      setContactStatus({
        success: '',
        error: error.message || 'Unable to update contact info',
        loading: false,
      })
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordStatus({ success: '', error: '', loading: true })

    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setPasswordStatus({ success: '', error: 'New passwords do not match', loading: false })
      return
    }

    try {
      await apiRequest('/users/me/password', {
        method: 'POST',
        body: {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        },
      })
      setPasswordForm({ current_password: '', new_password: '', confirm_new_password: '' })
      setPasswordStatus({ success: 'Password updated successfully.', error: '', loading: false })
    } catch (error) {
      setPasswordStatus({
        success: '',
        error: error.message || 'Unable to update password',
        loading: false,
      })
    }
  }

  return (
    <main className="account-page">
      <section className="section section-container account-hero">
        <div>
          <span className="eyebrow">Account settings</span>
          <h1>Keep your details up to date</h1>
          <p>Update your contact information or change your password whenever you need to.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-container account-grid">
          <div className="account-card">
            <h2>Contact information</h2>
            <p className="account-card-subtitle">We use these details to reach you about bookings.</p>
            {contactStatus.error && <div className="auth-error">{contactStatus.error}</div>}
            {contactStatus.success && <div className="auth-success">{contactStatus.success}</div>}
            <form onSubmit={handleContactSubmit} className="account-form">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={contactForm.email}
                onChange={handleContactChange}
                required
              />

              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={contactForm.phone}
                onChange={handleContactChange}
                required
              />

              <button type="submit" className="auth-submit" disabled={contactStatus.loading}>
                {contactStatus.loading ? 'Saving…' : 'Save contact info'}
              </button>
            </form>
          </div>

          <div className="account-card">
            <h2>Security</h2>
            <p className="account-card-subtitle">Choose a strong password to protect your account.</p>
            {passwordStatus.error && <div className="auth-error">{passwordStatus.error}</div>}
            {passwordStatus.success && <div className="auth-success">{passwordStatus.success}</div>}
            <form onSubmit={handlePasswordSubmit} className="account-form">
              <label htmlFor="current_password">Current password</label>
              <input
                id="current_password"
                name="current_password"
                type="password"
                autoComplete="current-password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                required
              />

              <label htmlFor="new_password">New password</label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />

              <label htmlFor="confirm_new_password">Confirm new password</label>
              <input
                id="confirm_new_password"
                name="confirm_new_password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirm_new_password}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />

              <button type="submit" className="auth-submit" disabled={passwordStatus.loading}>
                {passwordStatus.loading ? 'Updating…' : 'Change password'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Account
