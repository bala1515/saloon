import React, { useState, useEffect, useRef } from 'react'

export default function GoogleReviewModal({ isOpen, onClose, onAddReview, services = [] }) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [name, setName] = useState('')
  const [service, setService] = useState(services[0]?.name || 'Haircut & styling')
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false)
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const ratingDescriptions = {
    1: 'Poor — Very disappointed',
    2: 'Fair — Needs improvement',
    3: 'Average — Met expectations',
    4: 'Good — Satisfied with the service',
    5: 'Excellent — Loved the experience!'
  }

  const effectiveRating = hoverRating || rating

  function handleSubmit(e) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedText = text.trim()
    if (!trimmedName || !trimmedText) return

    // Derive initials
    const parts = trimmedName.split(' ').filter(Boolean)
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : trimmedName.slice(0, 2).toUpperCase()

    const newReview = {
      name: trimmedName,
      initials,
      rating,
      date: 'Just now',
      service,
      text: trimmedText,
      url: 'https://www.google.com/maps/place/Citizen+Hub+Hairstyling+%26+Makeup'
    }

    onAddReview(newReview)
    setSubmitted(true)
    setTimeout(() => {
      setName('')
      setText('')
      setRating(5)
      setSubmitted(false)
      onClose()
    }, 1200)
  }

  return (
    <div
      className="review-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="review-modal-box">
        <button
          type="button"
          className="review-modal-close"
          aria-label="Close review dialog"
          onClick={onClose}
        >
          ✕
        </button>

        {submitted ? (
          <div className="review-modal-success">
            <div className="success-icon">✓</div>
            <h3>Thank you for your review!</h3>
            <p>Your 5.0 Google review has been recorded and posted to the feedback highlights.</p>
          </div>
        ) : (
          <form className="review-modal-form" onSubmit={handleSubmit}>
            <div className="review-modal-header">
              <div className="google-badge-header">
                <svg className="google-g-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google Review</span>
              </div>
              <h3 id="review-modal-title">Rate and review ABC Salon</h3>
              <p className="review-modal-subtitle">Satchiyapuram, Sivakasi · Public review</p>
            </div>

            {/* Interactive Star Rating */}
            <div className="review-star-rating-group">
              <span className="rating-label">Your overall rating</span>
              <div
                className="stars-interactive"
                role="radiogroup"
                aria-label="Star rating"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    className={`star-btn ${star <= effectiveRating ? 'star-filled' : 'star-empty'}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span className="rating-desc-text">
                {ratingDescriptions[effectiveRating] || 'Click stars to rate'}
              </span>
            </div>

            {/* Reviewer Name */}
            <div className="review-field">
              <label htmlFor="reviewer-name">Your Name *</label>
              <input
                ref={nameInputRef}
                id="reviewer-name"
                type="text"
                required
                maxLength={60}
                placeholder="e.g. Ramesh Kannan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Service Selection */}
            <div className="review-field">
              <label htmlFor="reviewer-service">Service experienced</label>
              <select
                id="reviewer-service"
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                {services.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="General Haircut & Styling">General Haircut & Styling</option>
                <option value="Beard Grooming">Beard Grooming</option>
                <option value="Complete Groom Package">Complete Groom Package</option>
              </select>
            </div>

            {/* Review Textarea */}
            <div className="review-field">
              <label htmlFor="reviewer-text">Share your experience *</label>
              <textarea
                id="reviewer-text"
                required
                rows={4}
                maxLength={400}
                placeholder="Share details of your experience with our styling, hygiene, staff hospitality, and overall visit..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="review-modal-actions">
              <button
                type="button"
                className="review-btn-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="review-btn-submit"
              >
                Post Review ↗
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
