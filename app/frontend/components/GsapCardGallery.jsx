import React from 'react'
import { SectionLabel } from './EditorialSections'
import { categories } from '../data/salonContent'

// Keep the existing import contract while giving services a normal reading flow.
export default function GsapCardGallery({ allServices, category, setCategory, phoneUrl, phone }) {
  const filtered = allServices.filter(service => category === 'All' || service.category === category)
  return <section className="service-menu-section section" id="services" aria-labelledby="services-heading">
    <div className="section-heading">
      <div><SectionLabel number="01">The service menu</SectionLabel><h2 id="services-heading">Your look.<br /><em>Your way.</em></h2></div>
      <p>From your regular refresh to your big day.<br />Find what you need, then call or walk in.</p>
    </div>
    <div className="filters" role="group" aria-label="Filter services">
      {categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
    </div>
    <p className="service-menu-count" role="status">{filtered.length} services · Pricing confirmed by the salon</p>
    <ol className="service-menu-list">
      {filtered.map((service, index) => <li className="service-menu-row" key={service.name}>
        <span className="service-menu-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <div><span className="service-menu-category">{service.category}</span><h3>{service.name}</h3></div>
        <p>{service.description}</p>
      </li>)}
    </ol>
    <div className="service-note"><p>Not sure where to begin? Let's talk about your next look.</p><a href={phoneUrl}>Call {phone} <span aria-hidden="true">↗</span></a></div>
  </section>
}
