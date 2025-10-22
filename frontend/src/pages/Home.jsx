const Home = () => (
  <main>
    <section className="section section-history" id="our-history">
      <div className="section-container">
        <div className="history-layout">
          <div className="history-media">
            <img src="/images/background-1.jpeg" alt="Entrance of the museo" />
          </div>
          <div className="history-copy">
            <span className="eyebrow">La nostra storia</span>
            <h2>Our History</h2>
            <p>
              The Nobile collection gathers 120 pieces recognized as an ethno-anthropological
              treasure. It chronicles Pachino&apos;s winemaking journey, when harvests relied on
              skilled hands and the strength of animals.
            </p>
            <p>
              From the 1700s to the arrival of electricity, the museum preserves the only complete
              testimony in Sicily of every phase—from tending the vines, to preparing the presses,
              to moving the wine to market.
            </p>
            <p>
              Ingenious contraptions like the eight-barrel cart reveal how local producers measured
              and traded their wine. Each room lets you relive the ingenuity and resilience of the
              artisans who perfected these traditions.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section className="section section-services" id="experiences">
      <div className="section-container">
        <div className="section-heading">
          <span className="eyebrow">Esperienze</span>
          <h2>Curated ways to explore</h2>
          <p>
            Whether you&apos;re discovering Sicilian wine culture for the first time or returning to
            uncover new details, choose the experience that matches your pace.
          </p>
        </div>
        <div className="service-grid">
          <article className="card-service">
            <i className="fa-solid fa-building-columns" />
            <h3 className="h5title">Collection</h3>
            <p>
              Wander through the private archive alongside our guides and get close to restored
              tools, carriages, and presses that shaped our region.
            </p>
          </article>
          <article className="card-service">
            <i className="fa-brands fa-wpexplorer" />
            <h3 className="h5title">Explore</h3>
            <p>
              Move freely between the courtyards, workshops, and gardens. Pause to sketch, photograph,
              or simply absorb the atmosphere.
            </p>
          </article>
          <article className="card-service">
            <i className="fa-regular fa-circle" />
            <h3 className="h5title">Circle</h3>
            <p>
              Join our intimate gatherings where storytellers, winemakers, and guests connect over
              local heritage and seasonal tastings.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section className="section section-times" id="visit-plans">
      <div className="section-container">
        <div className="section-heading section-heading--light">
          <span className="eyebrow">Orari &amp; Percorsi</span>
          <h2>Plan your visit</h2>
          <p>Choose the experience that fits your schedule and discover Museo Vini Nobile.</p>
        </div>
        <div className="times-grid">
          <article className="times-card">
            <h3>Tour</h3>
            <p className="times-day">Tuesday</p>
            <p className="times-duration">2 hours</p>
            <p>Guided visit of our museum</p>
            <p className="times-schedule">10:30 - 16:00</p>
          </article>
          <article className="times-card">
            <h3>Tasting</h3>
            <p className="times-day">Wednesday</p>
            <p className="times-duration">3 hours</p>
            <p>Tour of the collection with curated tastings</p>
            <p className="times-schedule">11:00 - 15:30</p>
          </article>
          <article className="times-card">
            <h3>Tour</h3>
            <p className="times-day">Thursday</p>
            <p className="times-duration">2 hours</p>
            <p>Explore our court and private archive</p>
            <p className="times-schedule">10:30 - 16:00</p>
          </article>
          <article className="times-card">
            <h3>Tasting</h3>
            <p className="times-day">Friday &amp; Saturday</p>
            <p className="times-duration">3 hours</p>
            <p>Immersive visit with tasting of local products</p>
            <p className="times-schedule">09:00 - 12:30 &amp; 16:00</p>
          </article>
          <article className="times-card">
            <h3>Buona Domenica</h3>
            <p className="times-day">Sunday</p>
            <p className="times-duration">—</p>
            <p>We rest and prepare new stories for the week ahead.</p>
            <p className="times-schedule">Closed</p>
          </article>
        </div>
      </div>
    </section>
  </main>
)

export default Home
