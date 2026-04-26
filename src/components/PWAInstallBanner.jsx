import React, { useState, useEffect } from 'react'

/**
 * PWAInstallBanner
 * Shows a floating install prompt at the bottom of the screen when the
 * browser fires 'beforeinstallprompt'. Dismissed state is persisted in
 * sessionStorage so it doesn't re-appear on every page load.
 */
export default function PWAInstallBanner() {
    const [prompt, setPrompt] = useState(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (sessionStorage.getItem('pwa-dismissed')) return

        const handler = (e) => {
            e.preventDefault()
            setPrompt(e)
            setVisible(true)
        }
        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!prompt) return
        prompt.prompt()
        const { outcome } = await prompt.userChoice
        if (outcome === 'accepted') setVisible(false)
    }

    const handleDismiss = () => {
        sessionStorage.setItem('pwa-dismissed', '1')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div
            id="pwa-install-banner"
            role="dialog"
            aria-label="Install veinsofDrop app"
        >
            <img src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg shrink-0" />
            <span>Install <strong>veinsofDrop</strong> — get offline access &amp; alerts</span>
            <button onClick={handleInstall}>Install</button>
            <button className="dismiss" onClick={handleDismiss} aria-label="Dismiss">✕</button>
        </div>
    )
}
