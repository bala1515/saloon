import React from 'react'
import studioInterior from '../assets/salon-cinematic.png'
import { editorialImage, salon } from '../data/salonContent'

export function SectionLabel({ number, children }) {
  return <p className="section-label"><span>{number}</span>{children}</p>
}

export function StudioSection() {
  return <section className="studio-section section" id="studio" aria-labelledby="studio-heading">
    <figure className="studio-image depth-image"><img src={studioInterior} alt="Interior concept with leather barber chairs and warm timber finishes" loading="lazy" decoding="async" width="1672" height="941" /><figcaption>THE STUDIO MOOD <span>Interior concept</span></figcaption></figure>
    <div className="studio-copy"><SectionLabel number="03">Your neighbourhood salon</SectionLabel><h2 id="studio-heading">Good company.<br />Even better <em>hair.</em></h2><p className="studio-lead">A fresh look, without the fuss.</p><p>A quick trim before work. A new colour you've been thinking about. Getting ready for a wedding. Whatever brings you in, let's find a look that feels like you.</p><p>Find us in Satchiyapuram, Sivakasi. Walk in, settle into the chair and tell us what you have in mind.</p><a className="text-link" href={salon.phoneUrl}>Talk to the salon <span aria-hidden="true">↗</span></a></div>
  </section>
}

export function TransformationGallery() {
  return <section className="transformation-section section" id="transformations" aria-labelledby="transformation-heading">
    <div className="section-heading"><div><SectionLabel number="02">Find your next look</SectionLabel><h2 id="transformation-heading">A little change.<br /><em>A whole new feeling.</em></h2></div><p>Clean lines. Fresh texture. Your own style.<br />Bring a reference, and let's talk about your next look.</p></div>
    <div className="editorial-gallery">
      <figure className="look-feature"><div className="look-image depth-image"><span className="image-hover-label" aria-hidden="true">THE DETAILS ↗</span><img src={editorialImage('photo-1503951914875-452162b0f3f1',1300)} alt="Editorial inspiration: a barber carefully shaping a beard" loading="lazy" decoding="async" width="1000" height="1200" /></div><figcaption><span>01 / THE DETAILS</span><h3>Small details. Big difference.</h3></figcaption></figure>
      <div className="gallery-side"><p className="gallery-statement">Made for<br /><em>your everyday.</em><span aria-hidden="true">✳</span></p><figure className="look-secondary"><div className="look-image depth-image"><span className="image-hover-label" aria-hidden="true">THE CRAFT ✳</span><img src={editorialImage('photo-1621605815971-fbc98d665033',800)} alt="Editorial inspiration: professional barber tools" loading="lazy" decoding="async" width="800" height="1000" /></div><figcaption><span>02 / THE CRAFT</span><h3>Care in every cut.</h3></figcaption></figure></div>
    <div className="gallery-scroll-cue" aria-hidden="true"><span>SCROLL THROUGH THE DETAILS</span><span>01 — 02</span><i /></div></div><p className="image-disclosure">Style inspiration · Editorial photographs, not ABC Salon client results.</p>
  </section>
}
