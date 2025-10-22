import { Link } from 'react-router-dom'

const Hero = ({ ctaHref = '#visit-plans' }) => {
  const isInternalRoute = ctaHref.startsWith('/')
  const CtaComponent = isInternalRoute ? Link : 'a'
  const ctaProps = isInternalRoute ? { to: ctaHref } : { href: ctaHref }

  return (
    <section className="hero hero-home">
      <div className="hero-overlay">
        <div className="hero-content">
          <h1>Discover Museo Vini Nobile</h1>
          <p>
            Step inside our historic courtyard and explore the craftsmanship that shaped
            Pachino&apos;s winemaking tradition. Every artifact tells a story of passion, land,
            and community.
          </p>
          <CtaComponent className="hero-cta" {...ctaProps}>
            Plan your visit
          </CtaComponent>
        </div>
      </div>
    </section>
  )
}

export default Hero
