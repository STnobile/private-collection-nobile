const contactDetails = [
  {
    id: 'address',
    icon: 'fa-solid fa-location-dot',
    title: 'Visit the courtyard',
    description: ['Via Piave, 2', 'Pachino (SR), Sicilia'],
    note: 'Five minutes from Piazza Vittorio Emanuele.',
  },
  {
    id: 'contact',
    icon: 'fa-solid fa-phone',
    title: 'Talk to our team',
    description: ['+39 0931 123 456', 'info@museovinonobile.it'],
    note: 'We reply within 24 hours for tour requests.',
  },
  {
    id: 'hours',
    icon: 'fa-solid fa-clock',
    title: 'Opening hours',
    description: ['Tuesday – Saturday', '10:30 · 16:00'],
    note: 'Sunday is reserved for private conservation work.',
  },
]

const experiences = [
  {
    id: 'tour',
    title: 'Guided Tour',
    description:
      'Stroll through the private collection with our storytellers and learn how the wine press, carts, and tools evolved.',
    details: ['Duration: 2 hours', 'Available: Tuesday · Thursday'],
  },
  {
    id: 'tasting',
    title: 'Tour + Tasting',
    description:
      'Extend your visit with curated tastings of local produce in the courtyard after exploring the museum spaces.',
    details: ['Duration: 3 hours', 'Available: Wednesday · Friday · Saturday'],
  },
]

const Contact = () => (
  <main className="contact-page">
    <section className="section contact-hero">
      <div className="section-container">
        <span className="eyebrow">Parliamone</span>
        <h1>Plan your visit or talk with us</h1>
        <p>
          We love hearing from curious travellers, schools, and wine lovers planning a stop in
          Pachino. Reach out and we&apos;ll craft the experience that fits your group.
        </p>
      </div>
    </section>

    <section className="section">
      <div className="section-container contact-info-grid">
        {contactDetails.map((item) => (
          <article className="contact-info-card" key={item.id}>
            <span className="contact-icon">
              <i className={item.icon} />
            </span>
            <div>
              <h3>{item.title}</h3>
              <ul>
                {item.description.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p>{item.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="section contact-experiences">
      <div className="section-container">
        <div className="section-heading">
          <span className="eyebrow">Esperienze su misura</span>
          <h2>Choose how you want to explore</h2>
          <p>
            Every visit includes moments to ask questions, photograph rare artefacts, and enjoy the
            quiet corners of our courtyard.
          </p>
        </div>
        <div className="contact-experiences-grid">
          {experiences.map((item) => (
            <article className="contact-experience-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ul>
                {item.details.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="section contact-location" id="location">
      <div className="section-container contact-location-grid">
        <div className="contact-map-wrapper">
          <iframe
            title="Museo Del Vino Nobile location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3198.4275973000094!2d15.08400197528683!3d36.71229057265097!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x131221a9c069c163%3A0xca7b368e8910d832!2sMuseo%20Del%20Vino!5e0!3m2!1sen!2sse!4v1668431250543!5m2!1sen!2sse"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="contact-location-copy">
          <h2>Museo del Vino Nobile</h2>
          <p>
            The private collection sits inside a traditional Sicilian courtyard. When you arrive,
            you&apos;ll be welcomed by our team and guided through the tools, carts, and stories that
            shaped the region&apos;s winemaking craft.
          </p>
          <div className="contact-location-details">
            <div>
              <h4>Group visits</h4>
              <p>We accommodate school groups, sommeliers in training, and family reunions.</p>
            </div>
            <div>
              <h4>Accessibility</h4>
              <p>Accessible routes are available. Let us know your needs before you arrive.</p>
            </div>
          </div>
          <a className="contact-location-cta" href="mailto:info@museovinonobile.it">
            Request a bespoke itinerary
          </a>
        </div>
      </div>
    </section>

    <section className="section contact-newsletter">
      <div className="section-container contact-newsletter-card">
        <div>
          <span className="eyebrow">Newsletter</span>
          <h3>Join our circle</h3>
          <p>
            Receive early notes about special tastings, newly restored artefacts, and seasonal
            gatherings in the courtyard.
          </p>
        </div>
        <form method="POST" action="https://formdump.codeinstitute.net/" className="contact-form">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
          />
          <button type="submit">Subscribe</button>
        </form>
      </div>
    </section>
  </main>
)

export default Contact
