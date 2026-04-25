import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'

/**
 * Check whether a user has exceeded the rate limit for a given action.
 *
 * @param {string} userId          - The authenticated user's UID
 * @param {string} collectionName  - Firestore collection to query (e.g. 'requests', 'donors')
 * @param {number} maxCount        - Maximum allowed docs in the window
 * @param {number} windowHours     - Rolling time window in hours
 * @returns {Promise<{ allowed: boolean, count: number, remaining: number, resetAt: Date|null }>}
 */
export async function checkRateLimit(userId, collectionName, maxCount, windowHours) {
    if (!db || !userId) return { allowed: true, count: 0, remaining: maxCount, resetAt: null }

    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000)

    try {
        const q = query(
            collection(db, collectionName),
            where('userId', '==', userId),
            where('createdAt', '>=', Timestamp.fromDate(windowStart)),
            orderBy('createdAt', 'asc')
        )
        const snap = await getDocs(q)
        const count = snap.size

        // Oldest doc in the window → rolling reset time
        const oldest = snap.docs[0]?.data()?.createdAt?.toDate?.() ?? null
        const resetAt = oldest ? new Date(oldest.getTime() + windowHours * 60 * 60 * 1000) : null

        return {
            allowed: count < maxCount,
            count,
            remaining: Math.max(0, maxCount - count),
            resetAt,
        }
    } catch (err) {
        console.warn('Rate limit check failed (allowing):', err)
        return { allowed: true, count: 0, remaining: maxCount, resetAt: null }
    }
}

/** Human-readable countdown to a Date */
export function timeUntil(date) {
    if (!date) return ''
    const diff = date - Date.now()
    if (diff <= 0) return 'now'
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    if (h > 0) return `${h}h ${m}m`
    return `${m} min`
}
