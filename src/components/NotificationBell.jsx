import React, { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../contexts/NotificationContext'

function timeAgo(date) {
    if (!date) return ''
    const diff = Math.floor((Date.now() - date) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
}

export default function NotificationBell() {
    const { notifications, unreadCount, markRead, dismiss } = useNotifications()
    const [open, setOpen] = useState(false)
    const panelRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const handleOpen = () => {
        setOpen((v) => !v)
        if (!open) markRead('all')
    }

    return (
        <div className="relative" ref={panelRef}>

            <button
                onClick={handleOpen}
                aria-label={`Notifications – ${unreadCount} unread`}
                className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
            >

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-5 h-5 text-white ${unreadCount > 0 ? 'animate-[wiggle_0.6s_ease-in-out_infinite]' : ''}`}
                >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-600 rounded-full flex items-center justify-center px-0.5 ring-2 ring-white/30 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[10000] overflow-hidden"
                    style={{ animation: 'slideDown 0.18s ease-out' }}
                >

                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <span className="font-bold text-gray-800 text-sm">Notifications</span>
                        {notifications.length > 0 && (
                            <button
                                onClick={() => notifications.forEach((n) => dismiss(n.id))}
                                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                            >
                                Clear all
                            </button>
                        )}
                    </div>


                    <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                            <li className="px-4 py-6 text-center text-sm text-gray-400">
                                No notifications yet
                            </li>
                        ) : (
                            notifications.map((n) => (
                                <li
                                    key={n.id}
                                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${n.read ? 'opacity-70' : ''}`}
                                >

                                    <div
                                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs mt-0.5 ${n.emergencyLevel === 'critical' ? 'bg-red-600' : 'bg-orange-500'
                                            }`}
                                    >
                                        {n.bloodGroup}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 font-semibold leading-tight truncate">
                                            {n.emergencyLevel === 'critical' ? '🚨 Critical' : '⚠️ Urgent'} blood needed
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            {n.hospitalLocation}
                                            {n.patientName ? ` · ${n.patientName}` : ''}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {timeAgo(n.createdAt)}
                                        </p>
                                    </div>


                                    <button
                                        onClick={() => dismiss(n.id)}
                                        className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none mt-0.5"
                                        aria-label="Dismiss"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            <style>{`
        @keyframes wiggle {
          0%,100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    )
}
