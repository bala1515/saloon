import React, { lazy, Suspense } from 'react'
import studioInterior from '../assets/salon-cinematic.png'
import { editorialImage, salon } from '../data/salonContent'
const CraftScissorsScene = lazy(() => import('./CraftScissorsScene'))

export function SectionLabel({ number, children, light = false }) {
  return <p className={`section-label${light ? ' section-label-light' : ''}`}><span>{number}</span>{children}</p>
}

export function CraftSection() {
  return (
    <section className="craft-section" id="craft" aria-label="The Craft of ABC Salon">
      {/* Dynamic feather that only appears on scroll — invisible at scroll 0 */}
      <div className="craft-scroll-feather" aria-hidden="true" />

      {/* Top micro-bar (Gazzar style) */}
      <div className="craft-top-bar">
        <div className="craft-brand-tag">
          <span className="accent">02 / CRAFT</span>
          <span className="divider">·</span>
          <span>THE PRECISION ATELIER</span>
        </div>
        <div className="craft-location-tag">
          <span>ABC SALON · SIVAKASI</span>
        </div>
      </div>

      {/* Center 3D Scissors Canvas */}
      <div className="craft-scissors-layer"><Suspense fallback={null}><CraftScissorsScene /></Suspense></div>

      {/* Giant Statement Typography with line masks for GSAP reveal */}
      <div className="craft-statement-container">
        <div className="craft-line-mask">
          <h2 className="craft-statement-line craft-line-1">
            Sharpen the craft.
          </h2>
        </div>
        <div className="craft-line-mask">
          <h2 className="craft-statement-line craft-line-2">
            Shape the vision.
          </h2>
        </div>
        <div className="craft-line-mask">
          <h2 className="craft-statement-line craft-line-3">
            <em>Cut beyond.</em>
          </h2>
        </div>
      </div>

      {/* Bottom micro-bar (Gazzar style) */}
      <div className="craft-bottom-bar">
        <div className="craft-meta-tag">
          <span className="accent">PERSPECTIVE</span>
          <span className="divider">·</span>
          <span>HAIRCUTS · GROOMING · INDIVIDUALITY</span>
        </div>
        <div className="craft-scroll-tag">
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
        <div className="craft-index-tag">
          <span>02 / 07</span>
        </div>
      </div>
    </section>
  )
}

export function StudioSection() {
  return <section className="studio-section section" id="studio" aria-labelledby="studio-heading">
    <div className="studio-composition">
    <div className="studio-stage">
    <figure className="studio-image editorial-image">
      <img src={studioInterior} alt="Interior design concept with leather barber chairs, dark timber and warm brass lighting" loading="lazy" decoding="async" width="1672" height="941" />
      <figcaption>The studio mood <span>Interior concept</span></figcaption>
    </figure>
    <div className="studio-scrim" aria-hidden="true" />
    <div className="studio-aperture studio-aperture-left" aria-hidden="true" />
    <div className="studio-aperture studio-aperture-right" aria-hidden="true" />
    <div className="studio-depth-title" aria-hidden="true"><span>A SPACE</span><em>to reset.</em></div>
    </div>
    <div className="studio-story">
    <div className="studio-copy">
      <SectionLabel number="03" light>About the salon</SectionLabel>
      <h2 id="studio-heading">Your local salon<br /><em>in Sivakasi.</em></h2>
      <p className="studio-lead">Right here in Satchiyapuram.</p>
      <p>We are open every day from 9 AM to 8 PM. Walk in or call us to check availability. We do haircuts, beard styling, hair colour, hair spa, facials and occasion makeup.</p>
      <p>Whether it is a weekly trim before work or a full grooming session before a wedding — we are here for it. Call us and we will sort it out.</p>
      <a className="text-link" href="#visit">How to find us <span aria-hidden="true">↗</span></a>
    </div>
    <div className="studio-footnote"><span>SATCHIYAPURAM / SIVAKASI</span><a href={salon.phoneUrl}>Call the salon ↗</a></div>
    </div>
    </div>
  </section>
}

export function TransformationGallery() {
  return <section className="transformation-section section" id="transformations" aria-labelledby="transformation-heading">
    <span className="portfolio-depth-word" aria-hidden="true">INDIVIDUALITY</span>
    <div className="transformation-heading">
      <SectionLabel number="04">Our work</SectionLabel>
      <h2 id="transformation-heading">Good cuts.<br /><em>Every time.</em></h2>
      <p>We handle everything from everyday trims to wedding-day styling. Here is a look at the kind of work we do.</p>
    </div>
    <div className="editorial-gallery">
      <figure className="look-feature">
        <div className="look-image"><img src={editorialImage('photo-1503951914875-452162b0f3f1', 1300)} alt="Barber at work in a grooming studio, an editorial style reference" loading="lazy" decoding="async" width="1000" height="1200" /></div>
        <figcaption><span>01 / THE CUT</span><h3>Clean edges, sharp lines.</h3></figcaption>
      </figure>
      <figure className="look-secondary">
        <div className="look-image"><img src={editorialImage('photo-1621605815971-fbc98d665033', 800)} alt="Clippers, scissors and combs arranged as an editorial grooming reference" loading="lazy" decoding="async" width="800" height="1000" /></div>
        <figcaption><span>02 / THE TOOLS</span><h3>Proper equipment, proper results.</h3></figcaption>
      </figure>
      <div className="gallery-note"><span className="fine-cross" aria-hidden="true">+</span><p>Ready for your<br />next haircut?</p><a className="text-link" href="#visit">Find us <span aria-hidden="true">↗</span></a></div>
    </div>
    <p className="image-disclosure">Editorial reference photography. Salon client photos will be added when available.</p>
  </section>
}

