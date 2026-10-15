import { useEffect, useRef, useState } from 'react'
import './ProfilePopup.css'

type ProfilePopupProps = {
  name: string
  email: string
  onPreferences: () => void
  onSignOut: () => void
}

export default function ProfilePopup({ name, email, onPreferences, onSignOut }: ProfilePopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!popupRef.current?.contains(event.target as Node)) setIsOpen(false)
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

  const closePopup = () => setIsOpen(false)

  return (
    <div className="profile-menu-wrapper" ref={popupRef}>
      <button
        className="business-switcher"
        type="button"
        ref={triggerRef}
        aria-label="Open profile menu for Business Co."
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="profile-popup"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="avatar" aria-hidden="true">B</span>
        <span>Business Co.</span>
      </button>

      {isOpen && (
        <section className="profile-popup" id="profile-popup" role="dialog" aria-label="Profile options">
          <div className="profile-popup-identity">
            <strong>{name}</strong>
            <span>{email}</span>
          </div>
          <div className="profile-popup-divider" />
          <div className="profile-popup-actions">
            <button type="button" onClick={() => { closePopup(); onPreferences() }}>Preferences</button>
            <button type="button" onClick={closePopup}>Notifications</button>
          </div>
          <div className="profile-popup-divider" />
          <div className="profile-popup-actions">
            <button type="button" onClick={closePopup}>Help &amp; Support</button>
            <button className="profile-signout" type="button" onClick={() => { closePopup(); onSignOut() }}>Sign Out</button>
          </div>
        </section>
      )}
    </div>
  )
}
