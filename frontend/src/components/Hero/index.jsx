import { Link } from 'react-router-dom'

const Hero = ({ ctaHref = '/home' }) => {
  const isInternalRoute = ctaHref.startsWith('/')
  const CtaComponent = isInternalRoute ? Link : 'a'
  const ctaProps = isInternalRoute ? { to: ctaHref } : { href: ctaHref }

  return (
    <CtaComponent className="hero hero-home hero-link" aria-label="Enter Museo Vini Nobile" {...ctaProps}>
      <span className="sr-only">Enter Museo Vini Nobile</span>
    </CtaComponent>
  )
}

export default Hero
