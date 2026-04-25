import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from './AuthContext'



const NotificationContext = createContext({})

export const useNotifications = () => {
    const ctx = useContext(NotificationContext)
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
    return ctx
}
function playAlertSound(level = 'critical') {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()

        const freqs = level === 'critical' ? [880, 660, 880] : [660, 880]
        let time = ctx.currentTime

        freqs.forEach((freq) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = freq
            osc.type = 'sine'
            gain.gain.setValueAtTime(0.001, time)
            gain.gain.exponentialRampToValueAtTime(0.3, time + 0.05)
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25)
            osc.start(time)
            osc.stop(time + 0.3)
            time += 0.28
        })
    } catch (_) {

    }
}

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth()

    const [notifications, setNotifications] = useState([])

    const [bannerQueue, setBannerQueue] = useState([])
    const [activeBanner, setActiveBanner] = useState(null)

    const seenIdsRef = useRef(new Set())

    const initialLoadRef = useRef(true)

    const unreadCount = notifications.filter((n) => !n.read).length

    const markRead = useCallback((id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id || id === 'all' ? { ...n, read: true } : n))
        )
    }, [])

    const dismiss = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, [])

    useEffect(() => {
        if (activeBanner || bannerQueue.length === 0) return
        const [next, ...rest] = bannerQueue
        setActiveBanner(next)
        setBannerQueue(rest)
        const t = setTimeout(() => setActiveBanner(null), 5500)
        return () => clearTimeout(t)
    }, [bannerQueue, activeBanner])

    useEffect(() => {
        if (!isAuthenticated || !db) return

        const q = query(
            collection(db, 'requests'),
            orderBy('createdAt', 'desc'),
            limit(50)
        )

        const unsub = onSnapshot(q, (snapshot) => {
            if (initialLoadRef.current) {

                snapshot.docs.forEach((d) => seenIdsRef.current.add(d.id))
                initialLoadRef.current = false
                return
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type !== 'added') return
                const id = change.doc.id
                if (seenIdsRef.current.has(id)) return
                seenIdsRef.current.add(id)

                const data = change.doc.data()
                const level = data.emergencyLevel
                if (level !== 'critical' && level !== 'urgent') return

                const notification = {
                    id: `notif-${id}`,
                    requestId: id,
                    bloodGroup: data.bloodGroup || '?',
                    hospitalLocation: data.hospitalLocation || 'Unknown location',
                    emergencyLevel: level,
                    patientName: data.patientName || '',
                    createdAt: data.createdAt?.toDate?.() ?? new Date(),
                    read: false,
                }

                setNotifications((prev) => [notification, ...prev].slice(0, 50))
                setBannerQueue((prev) => [...prev, notification])


                playAlertSound(level)
            })
        })

        return () => {
            unsub()
            initialLoadRef.current = true
            seenIdsRef.current = new Set()
        }
    }, [isAuthenticated])

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, markRead, dismiss, activeBanner, setActiveBanner }}
        >
            {children}
        </NotificationContext.Provider>
    )
}
