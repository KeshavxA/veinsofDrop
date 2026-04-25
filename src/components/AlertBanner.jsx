import React from 'react'
import { useNotifications } from '../contexts/NotificationContext'

export default function AlertBanner() {
    const { activeBanner, setActiveBanner } = useNotifications()

    if (!activeBanner) return null

    const isCritical = activeBanner.emergencyLevel === 'critical'

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white max-w-md w-[calc(100%-2rem)] ${isCritical
                ? 'bg-gradient-to-r from-red-700 to-red-500'
                : 'bg-gradient-to-r from-orange-600 to-amber-500'
                }`}
            style={{ animation: 'bannerIn 0.35s cubic-bezier(.17,.67,.35,1.3)' }}
        >

            <span className="flex-shrink-0 relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>

            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">
                    {isCritical ? '🚨 Critical blood request' : '⚠️ Urgent blood request'}
                </p>
                <p className="text-xs opacity-90 truncate mt-0.5">
                    <strong>{activeBanner.bloodGroup}</strong> needed · {activeBanner.hospitalLocation}
                    {activeBanner.patientName ? ` · ${activeBanner.patientName}` : ''}
                </p>
            </div>

            <button
                onClick={() => setActiveBanner(null)}
                className="flex-shrink-0 text-white/70 hover:text-white text-xl leading-none transition-colors"
                aria-label="Dismiss alert"
            >
                ×
            </button>

            <style>{`
        @keyframes bannerIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
        </div>
    )
}
