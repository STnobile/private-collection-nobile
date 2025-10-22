import ZoomableImage from '../components/Gallery/ZoomableImage'

const stillMedia = [
  {
    id: 'register',
    src: '/images/register.jpg',
    alt: 'Handwritten vineyard register from the estate archives',
    caption: 'Handwritten register documenting historic harvests and trades.',
  },
  {
    id: 'entrance',
    src: '/images/hero3.jpg',
    alt: 'Gate to enter the museo',
    caption: 'The main gate welcoming guests into the courtyard.',
  },
  {
    id: 'stone-plaque',
    src: '/images/museostone.jpg',
    alt: 'Museo name carved in stones',
    caption: 'Stone engraving celebrating the Museo Vini Nobile legacy.',
  },
  {
    id: 'welcome',
    src: '/images/welcome.jpeg',
    alt: 'Welcome entrance with lanterns',
    caption: 'Warm lantern light guides visitors into the main hall.',
  },
  {
    id: 'caravans',
    src: '/images/museo5.jpg',
    alt: 'Different types of caravans',
    caption: 'Restored Sicilian carrettis lined up for display.',
  },
  {
    id: 'grapes',
    src: '/images/grapes.jpg',
    alt: 'Red grape close-up',
    caption: 'Sun-kissed Nero d’Avola grapes from the surrounding vineyards.',
  },
  {
    id: 'cortile',
    src: '/images/cortile.jpg',
    alt: 'Outside of the museo',
    caption: 'The inner courtyard where tours begin their storytelling arc.',
  },
  {
    id: 'wall-writing',
    src: '/images/wallwriting.jpg',
    alt: 'Wall with writing',
    caption: 'Historic handwritten notes preserved on the cellar walls.',
  },
  {
    id: 'barrels',
    src: '/images/barrels.jpg',
    alt: 'Barrels and wine tools',
    caption: 'Tools and barrels once used to press and store the wine.',
  },
  {
    id: 'doorway',
    src: '/images/hero2.jpg',
    alt: 'Door showing the museo',
    caption: 'Ornate doorway framing the entrance to our private collection.',
  },
  {
    id: 'vineyard',
    src: '/images/discovery.jpg',
    alt: 'Grape on the vineyard',
    caption: 'A morning stroll among the vines overlooking the sea breeze.',
  },
  {
    id: 'carretti',
    src: '/images/carrettis.jpg',
    alt: 'Typical Sicilian caravan',
    caption: 'A brightly painted Sicilian cart restored by local artisans.',
  },
  {
    id: 'carrettored',
    src: '/images/carrettored.jpg',
    alt: 'Back of Sicilian caravan',
    caption: 'Intricate craftsmanship on the back of a traditional cart.',
  },
]

const motionMedia = [
  {
    id: 'courtyard-tour',
    src: '/videos/video2_.mp4',
    caption: 'Guided tour through the courtyard and artisan workshops.',
  },
  {
    id: 'museum-overview',
    src: '/videos/video3_.mp4',
    caption: 'Curator commentary highlighting the most beloved artifacts.',
  },
]

const Gallery = () => (
  <main className="gallery-page">
    <section className="section gallery-hero">
      <div className="section-container">
        <span className="eyebrow">Archivio visivo</span>
        <h1>Photo &amp; Media Gallery</h1>
        <p>
          A glimpse into the textures, colors, and craftsmanship that define Museo Vini Nobile.
          Browse the stills below or play the short films for a guided look inside.
        </p>
      </div>
    </section>

    <section className="section">
      <div className="section-container">
        <div className="gallery-grid">
          {stillMedia.map((item) => (
            <ZoomableImage key={item.id} {...item} />
          ))}
        </div>
      </div>
    </section>

    <section className="section section-gallery-motion">
      <div className="section-container">
        <div className="section-heading">
          <span className="eyebrow">Video tour</span>
          <h2>Immersive glimpses</h2>
          <p>
            Press play to hear the voices of our curators and see the collection come alive from
            different angles and lighting throughout the day.
          </p>
        </div>
        <div className="gallery-motion-grid">
          {motionMedia.map((item) => (
            <figure className="gallery-motion-card" key={item.id}>
              <video controls muted playsInline src={item.src} />
              <figcaption>{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>

    <section className="section gallery-cta">
      <div className="section-container">
        <div className="gallery-cta-card">
          <h3>More stories on the way</h3>
          <p>
            Our archivists are digitising letters, oral histories, and previously unseen footage.
            Visit again soon or book a tour to preview the newest additions in person.
          </p>
        </div>
      </div>
    </section>
  </main>
)

export default Gallery
