import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * Sun / Moon toggle button. Drop into any header.
 */
export default function ThemeToggle({ className = '' }) {
    const { dark, toggle } = useTheme()

    return (
        <button
            onClick={toggle}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`
        relative w-10 h-10 rounded-full flex items-center justify-center
        transition-all duration-300
        bg-white/15 hover:bg-white/25 backdrop-blur-sm
        border border-white/20 shadow-inner
        ${className}
      `}
        >
            {/* Sun */}
            <span
                className="absolute text-lg transition-all duration-300"
                style={{
                    opacity: dark ? 0 : 1,
                    transform: dark ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
                }}
                aria-hidden
            >
                ☀️
            </span>
            {/* Moon */}
            <span
                className="absolute text-lg transition-all duration-300"
                style={{
                    opacity: dark ? 1 : 0,
                    transform: dark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
                }}
                aria-hidden
            >
                🌙
            </span>
        </button>
    )
}
