import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { businessListQuery } from '@/queries/businesses'

type BusinessSwitcherProps = {
  /** The business in the URL, if any. */
  currentId: string | undefined
}

export default function BusinessSwitcher({ currentId }: BusinessSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const { data: businesses = [] } = useQuery(businessListQuery())

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const current = businesses.find((business) => business.id === currentId)
  const others = businesses.filter((business) => business.id !== currentId)

  // No business at all: a plain label, as in the design.
  if (businesses.length === 0) {
    return <p className="business-switcher business-switcher-empty">No business yet</p>
  }

  const label = current?.name ?? 'Choose a business'
  const close = () => setIsOpen(false)

  return (
    <div className="business-menu-wrapper" ref={wrapperRef}>
      <button
        className="business-switcher"
        type="button"
        ref={triggerRef}
        aria-label={`Switch business. Current: ${label}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="avatar" aria-hidden="true">{label.charAt(0).toUpperCase()}</span>
        <span>{label}</span>
      </button>

      {isOpen && (
        <nav className="business-menu" id={menuId} aria-label="Businesses">
          {others.length > 0 && (
            <ul>
              {others.map((business) => (
                <li key={business.id}>
                  <Link to={`/b/${business.id}`} onClick={close}>{business.name}</Link>
                </li>
              ))}
            </ul>
          )}
          {others.length > 0 && <div className="business-menu-divider" />}
          <ul>
            <li><Link to="/onboarding/business" onClick={close}>Create a business</Link></li>
          </ul>
        </nav>
      )}
    </div>
  )
}
