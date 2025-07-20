'use client'

export default function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#conversation-controls" className="skip-link">
        Skip to conversation controls
      </a>
      <a href="#session-info" className="skip-link">
        Skip to session information
      </a>
      <style jsx>{`
        .skip-links {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 100;
        }
        
        .skip-link {
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
          background: var(--warm-coral);
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
        }
        
        .skip-link:focus {
          position: fixed;
          left: 16px;
          top: 16px;
          width: auto;
          height: auto;
          z-index: 1000;
        }
      `}</style>
    </div>
  )
}