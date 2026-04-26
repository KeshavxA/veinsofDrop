import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({})

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
    return ctx
}

export function ThemeProvider({ children }) {

    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('vod-theme')
        if (saved) return saved === 'dark'
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    })

    useEffect(() => {
        const root = document.documentElement
        if (dark) {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        localStorage.setItem('vod-theme', dark ? 'dark' : 'light')
    }, [dark])

    const toggle = () => setDark((d) => !d)

    return (
        <ThemeContext.Provider value={{ dark, toggle }}>
            {children}
        </ThemeContext.Provider>
    )
}
