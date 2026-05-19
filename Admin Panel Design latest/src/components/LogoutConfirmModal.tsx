import { useEffect, useRef } from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ isOpen, onCancel, onConfirm }: LogoutConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ animation: 'logoutOverlayIn 0.2s ease-out' }}
    >
      {/* Overlay — click to close */}
      <div
        className="absolute inset-0"
        onClick={onCancel}
        style={{
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'logoutOverlayIn 0.2s ease-out',
        }}
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#ffffff',
          borderRadius: '16px',
          width: '460px',
          maxWidth: '92vw',
          minHeight: '280px',
          boxShadow: '0 15px 50px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'logoutModalIn 0.25s ease-out',
        }}
      >
        {/* Close button — top right */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#9ca3af',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }}
          aria-label="Close"
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>

        {/* Content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 36px 24px',
            gap: '20px',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LogOut style={{ width: '24px', height: '24px', color: '#ef4444' }} />
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#111827',
              margin: 0,
              textAlign: 'center',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            Confirm Logout
          </h2>

          {/* Message */}
          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#6b7280',
              margin: 0,
              textAlign: 'center',
              maxWidth: '340px',
            }}
          >
            Are you sure you want to logout from the system? Any unsaved work may be lost.
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            padding: '0 36px 32px',
          }}
        >
          {/* Cancel */}
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: '48px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#374151',
              background: '#ffffff',
              border: '1.5px solid #d1d5db',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            Cancel
          </button>

          {/* Logout */}
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: '48px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#ffffff',
              background: '#dc2626',
              border: '1.5px solid #dc2626',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#b91c1c';
              e.currentTarget.style.borderColor = '#b91c1c';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.borderColor = '#dc2626';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(220, 38, 38, 0.25)';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes logoutOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes logoutModalIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
