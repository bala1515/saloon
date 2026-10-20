import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion'
import CinematicHero from '../components/CinematicHero'
import { SectionLabel, StudioSection, TransformationGallery } from '../components/EditorialSections'
import GsapCardGallery from '../components/GsapCardGallery'
import { days, reviews, salon, services } from '../data/salonContent'
import './salon.css'
import useSalonScroll from '../animations/useSalonScroll'
import useSalonInteractions from '../animations/useSalonInteractions'
import '../animations/salonScroll.css'

function Arrow() { return <span aria-hidden="true">↗</span> }
function Brand() {
  return <a className="brand" href="#top" aria-label="ABC Salon home"><span className="brand-name">ABC</span><span className="brand-category">SALON<span>SIVAKASI</span></span></a>
}


function App() {
  useSalonScroll()
  useSalonInteractions()
  const [menu, setMenu] = useState(false)
  const [category, setCategory] = useState('All')
  const [review, setReview] = useState(0)
  const reduced = useReducedMotion()
  const menuButton = useRef(null)

  useEffect(() => {
    function escape(event) {
      if (event.key === 'Escape' && menu) {
        setMenu(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [menu])

  return <MotionConfig reducedMotion="user">
    <div className="reading-progress" aria-hidden="true" />
    <a className="skip" href="#main">Skip to content</a>
    <div id="top" className="top-shell">
      <header className="header">
        <Brand />
        <nav id="navigation" className={`navigation${menu ? ' is-open' : ''}`} aria-label="Main navigation">
          {[['Services', 'services'], ['Style inspiration', 'transformations'], ['The salon', 'studio'], ['Reviews', 'reviews']].map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{label}</a>)}
        </nav>
        <a className="nav-visit" href="#visit">Find us <Arrow /></a>
        <button ref={menuButton} className="menu-button" aria-controls="navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? 'Close −' : 'Menu +'}</button>
      </header>
      <CinematicHero />
    </div>

    <main id="main">

      <GsapCardGallery
        allServices={services}
        category={category}
        setCategory={setCategory}
        phoneUrl={salon.phoneUrl}
        phone={salon.phone}
      />

      <TransformationGallery />
      <StudioSection />
      <section className="reviews-section section" id="reviews" aria-labelledby="reviews-heading">
        <div className="section-heading">
          <div>
            <SectionLabel number="04">Word from the chair</SectionLabel>
            <h2 id="reviews-heading">Good words.<br /><em>From the chair.</em></h2>
          </div>
          <p>Explore feedback from the supplied Google listing.<br />Read more, or share your own experience.</p>
        </div>

        <div className="reviews-layout">
          <div className="google-summary">
            <span className="google-label">Google reviews</span>
            <div className="rating">
              <strong>5.0</strong>
              <div>
                <span className="stars" aria-label="5 out of 5 stars">★★★★★</span>
                <span>39 Google reviews</span>
              </div>
            </div>
            <p>{salon.source}</p>
            <span className="source-date">Reference listing · Checked {salon.checkedAt}</span>

            <div className="google-summary-actions">
              <a
                className="write-review-btn"
                href={salon.writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Write a review on Google</span>
                <span className="btn-star" aria-hidden="true">★</span>
              </a>
              <a className="text-link" href={salon.listingUrl} target="_blank" rel="noreferrer">
                Read on Google <Arrow />
              </a>
            </div>
          </div>

          <div className="testimonial-area">
            {(() => {
              const current = reviews[review] || reviews[0]
              return (
                <>
                  <div className="testimonial-top">
                    <div className="testimonial-meta-left">
                      <span className="testimonial-badge">GOOGLE REVIEW HIGHLIGHT</span>
                      <div className="testimonial-star-row">
                        <span className="stars">{'★'.repeat(current.rating || 5)}</span>
                        <strong className="star-num">{(current.rating || 5).toFixed(1)}</strong>
                        {current.service && <span className="review-service-pill">{current.service}</span>}
                      </div>
                    </div>
                    <span className="testimonial-counter">
                      {String(review + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}
                    </span>
                  </div>

                  <div aria-live="polite" aria-atomic="true">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.figure
                        key={review}
                        initial={{ opacity: 0, x: reduced ? 0 : 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: reduced ? 0 : -12 }}
                        transition={{ duration: 0.2 }}
                      >
                        <blockquote>{current.text}</blockquote>
                        <figcaption>
                          <span className="reviewer-initials">{current.initials}</span>
                          <div>
                            <strong>{current.name}</strong>
                            <span>Review summary · Reference listing</span>
                          </div>
                        </figcaption>
                      </motion.figure>
                    </AnimatePresence>
                  </div>

                  <div className="review-controls">
                    <div className="review-dots" role="tablist" aria-label="Review pagination">
                      {reviews.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          role="tab"
                          aria-selected={i === review}
                          aria-label={`Go to review ${i + 1}`}
                          className={`review-dot${i === review ? ' review-dot--active' : ''}`}
                          onClick={() => setReview(i)}
                        />
                      ))}
                    </div>
                    <div className="review-nav-btns">
                      <button
                        type="button"
                        aria-label="Previous review"
                        onClick={() => setReview((review - 1 + reviews.length) % reviews.length)}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        aria-label="Next review"
                        onClick={() => setReview((review + 1) % reviews.length)}
                      >
                        →
                      </button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
        <p className="source-note">ABC Salon is the preview name. These ratings and review summaries belong to {salon.source}, the business in the supplied Google listing. Ratings may change.</p>
      </section>

      <section className="visit-section section" id="visit" aria-labelledby="visit-heading">
        <div className="visit-copy"><p className="eyebrow">RIGHT HERE IN SIVAKASI</p><h2 id="visit-heading">Your next stop.<br /><em>ABC Salon.</em></h2><address><strong>Satchiyapuram, Sivakasi</strong><span>1st floor, 66/581B, Sivakasi Industrial Complex,<br />Arumugam Colony, next to Jamuna Devi Hospital,<br />Tamil Nadu 626123.</span></address><a className="visit-phone" href={salon.phoneUrl}>Call {salon.phone} ↗</a><a className="text-link" href={salon.mapsUrl} target="_blank" rel="noreferrer">Get directions <Arrow /></a><p className="source-note">Address and contact details from the supplied {salon.source} listing.</p></div>
        <div className="hours"><div className="hours-title"><h3>Opening hours</h3><span>IST</span></div><dl>{days.map(day => <div key={day}><dt>{day}</dt><dd>9:00 AM – 8:00 PM</dd></div>)}</dl><p className="hours-footnote">Google-listed hours · Checked {salon.checkedAt}.<br />Holiday hours may differ. Please call before visiting.</p></div>
      </section>
    </main>

    <footer className="footer"><div className="footer-top"><Brand /><p>FRESH CUTS. GOOD ENERGY.<br /><span>HAIRSTYLING & MAKEUP / SIVAKASI</span></p><nav aria-label="Footer navigation"><a href="#reviews">Reviews</a><a href="#visit">Visit us</a><a href="#top">Back to top ↑</a></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} ABC Salon · Preview brand & concept imagery</span><a href={salon.listingUrl} target="_blank" rel="noreferrer">Business details: {salon.source} on Google ↗</a></div></footer>
  </MotionConfig>
}

createRoot(document.getElementById('root')).render(<App />)
