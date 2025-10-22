import { useState } from 'react'

const ZoomableImage = ({ src, alt, caption, id }) => {
  const [isZoomed, setIsZoomed] = useState(false)

  const handleToggle = () => {
    setIsZoomed((prev) => !prev)
  }

  const imageElement = (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="zoomable-image"
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleToggle()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isZoomed ? 'Close enlarged image' : 'Expand image'}
    />
  )

  return (
    <>
      <figure className="gallery-card" id={id}>
        <div className="gallery-image-wrapper">{imageElement}</div>
        <figcaption>{caption}</figcaption>
      </figure>

      {isZoomed && (
        <div className="gallery-zoom-overlay" role="dialog" aria-modal="true" onClick={handleToggle}>
          <button
            type="button"
            className="gallery-zoom-close"
            aria-label="Close enlarged image"
            onClick={handleToggle}
          >
            ×
          </button>
          <img src={src} alt={alt} className="gallery-zoomed-image" />
          {caption && <p>{caption}</p>}
        </div>
      )}
    </>
  )
}

export default ZoomableImage
