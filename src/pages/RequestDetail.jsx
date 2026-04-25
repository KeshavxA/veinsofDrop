import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../../firebase'
import {
    doc,
    onSnapshot,
    updateDoc,
    addDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
} from 'firebase/firestore'
import StatusPipeline from '../components/StatusPipeline'
import ContactLog from '../components/ContactLog'

const BG_COLORS = {
    critical: 'bg-red-600 text-white',
    urgent: 'bg-orange-500 text-white',
    normal: 'bg-gray-400 text-white',
}

const STATUS_BADGE = {
    pending: 'bg-gray-100 text-gray-600',
    contacted: 'bg-blue-100 text-blue-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    fulfilled: 'bg-red-100 text-red-700',
}
function OfferCard({ match, isOwner, onAccept, onDecline }) {
    const isBusy = match._loading
    return (
        <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#db2b2b]/10 flex items-center justify-center text-[#db2b2b] font-bold text-sm">
                    {(match.donorName || match.donorEmail || '?')[0].toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">
                        {match.donorName || match.donorEmail}
                    </p>
                    {match.donorBloodGroup && (
                        <span className="text-xs font-bold text-[#db2b2b] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                            {match.donorBloodGroup}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">

                {match.status === 'offered' && !isOwner && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                        ⏳ Offer sent
                    </span>
                )}
                {match.status === 'accepted' && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                        ✓ Accepted
                    </span>
                )}
                {match.status === 'declined' && (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full">
                        Declined
                    </span>
                )}

                {isOwner && match.status === 'offered' && (
                    <>
                        <button
                            onClick={() => onAccept(match.id)}
                            disabled={isBusy}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => onDecline(match.id)}
                            disabled={isBusy}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Decline
                        </button>
                    </>
                )}
            </div>
        </li>
    )
}
export default function RequestDetail() {
    const { id } = useParams()
    const { currentUser, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    const [request, setRequest] = useState(null)
    const [loadingReq, setLoadingReq] = useState(true)
    const [matches, setMatches] = useState([])
    const [currentDonorProfile, setCurrentDonorProfile] = useState(null)
    const [donating, setDonating] = useState(false)
    const [statusUpdating, setStatusUpdating] = useState(false)
    const [donateError, setDonateError] = useState('')
    const [matchLoadingId, setMatchLoadingId] = useState(null)

    const isOwner = currentUser?.uid && request?.userId === currentUser.uid
    const alreadyOffered = matches.some((m) => m.donorId === currentUser?.uid)

    useEffect(() => {
        if (!db || !id) return
        const unsub = onSnapshot(
            doc(db, 'requests', id),
            (snap) => {
                if (snap.exists()) {
                    setRequest({ id: snap.id, ...snap.data() })
                } else {
                    setRequest(null)
                }
                setLoadingReq(false)
            },
            (err) => {
                console.error('RequestDetail onSnapshot error:', err)
                setLoadingReq(false)
            }
        )
        return () => unsub()
    }, [id])
    useEffect(() => {
        if (!db || !id) return
        const q = query(collection(db, 'matches'), where('requestId', '==', id))
        const unsub = onSnapshot(q, (snap) => {
            setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        })
        return () => unsub()
    }, [id])

    useEffect(() => {
        if (!currentUser?.uid || !db) return
        const q = query(collection(db, 'donors'), where('userId', '==', currentUser.uid))
        getDocs(q).then((snap) => {
            if (!snap.empty) {
                setCurrentDonorProfile({ id: snap.docs[0].id, ...snap.docs[0].data() })
            }
        })
    }, [currentUser])
    const handleICanDonate = async () => {
        if (!currentUser || !request) return
        setDonating(true)
        setDonateError('')
        try {
            const matchRef = await addDoc(collection(db, 'matches'), {
                requestId: id,
                requestBloodGroup: request.bloodGroup,
                requestHospitalLocation: request.hospitalLocation || '',
                requesterId: request.userId,
                requesterEmail: request.requestEmail || '',
                donorId: currentUser.uid,
                donorEmail: currentUser.email,
                donorName: currentDonorProfile?.name || currentUser.email,
                donorBloodGroup: currentDonorProfile?.bloodGroup || '',
                donorPhone: currentDonorProfile?.phone || '',
                status: 'offered',
                createdAt: serverTimestamp(),
            })

            await addDoc(collection(db, 'contactLogs'), {
                requestId: id,
                matchId: matchRef.id,
                authorId: currentUser.uid,
                authorEmail: currentUser.email,
                authorName: currentDonorProfile?.name || currentUser.email,
                message: `${currentDonorProfile?.name || currentUser.email} offered to donate${currentDonorProfile?.bloodGroup ? ` (${currentDonorProfile.bloodGroup})` : ''}.`,
                type: 'offer',
                createdAt: serverTimestamp(),
            })

            if (request.status === 'pending') {
                await updateDoc(doc(db, 'requests', id), { status: 'contacted' })
                await addDoc(collection(db, 'contactLogs'), {
                    requestId: id,
                    authorId: 'system',
                    authorEmail: '',
                    authorName: 'System',
                    message: 'Status updated to Contacted — a donor has responded.',
                    type: 'status_change',
                    createdAt: serverTimestamp(),
                })
            }
        } catch (err) {
            console.error('Donation offer error:', err)
            setDonateError('Could not submit offer. Please try again.')
        } finally {
            setDonating(false)
        }
    }
    const handleAdvanceStatus = async (nextStatus) => {
        if (!isOwner || !db) return
        setStatusUpdating(true)
        try {
            await updateDoc(doc(db, 'requests', id), { status: nextStatus })
            await addDoc(collection(db, 'contactLogs'), {
                requestId: id,
                authorId: currentUser.uid,
                authorEmail: currentUser.email,
                authorName: 'Requester',
                message: `Status updated to "${nextStatus}".`,
                type: 'status_change',
                createdAt: serverTimestamp(),
            })
        } catch (err) {
            console.error('Status advance error:', err)
        } finally {
            setStatusUpdating(false)
        }
    }

    const handleMatchAction = async (matchId, action) => {
        setMatchLoadingId(matchId)
        try {
            await updateDoc(doc(db, 'matches', matchId), { status: action })
            const matchData = matches.find((m) => m.id === matchId)
            await addDoc(collection(db, 'contactLogs'), {
                requestId: id,
                matchId,
                authorId: currentUser.uid,
                authorEmail: currentUser.email,
                authorName: 'Requester',
                message: `Donor offer from ${matchData?.donorName || matchData?.donorEmail || 'donor'} was ${action}.`,
                type: 'status_change',
                createdAt: serverTimestamp(),
            })

            if (action === 'accepted' && request?.status === 'contacted') {
                await updateDoc(doc(db, 'requests', id), { status: 'accepted' })
                await addDoc(collection(db, 'contactLogs'), {
                    requestId: id,
                    authorId: 'system',
                    authorEmail: '',
                    authorName: 'System',
                    message: 'Status updated to Accepted — a donor has been confirmed.',
                    type: 'status_change',
                    createdAt: serverTimestamp(),
                })
            }
        } catch (err) {
            console.error('Match action error:', err)
        } finally {
            setMatchLoadingId(null)
        }
    }

    if (loadingReq) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafa]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#db2b2b]" />
                    <p className="mt-4 text-gray-500 text-sm">Loading request…</p>
                </div>
            </div>
        )
    }

    if (!request) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafa]">
                <div className="text-center">
                    <p className="text-4xl mb-2">🔍</p>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">Request not found</h2>
                    <p className="text-gray-500 text-sm mb-4">This request may have been removed.</p>
                    <Link to="/" className="text-sm font-semibold text-[#db2b2b] hover:underline">← Back to dashboard</Link>
                </div>
            </div>
        )
    }

    const createdAt = request.createdAt?.toDate?.()
    const dateStr = createdAt ? createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8fafa] to-[#e6fffb] font-sans">

            <header className="bg-gradient-to-r from-[rgb(191,203,203)] to-[rgb(219,43,43)] text-white sticky top-0 z-40 shadow">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
                    <Link
                        to="/"
                        className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                        ← Back
                    </Link>
                    <span className="text-white/50">|</span>
                    <span className="text-sm font-semibold truncate">
                        Blood Request · {request.bloodGroup || '?'}
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">

                    <div className="bg-gradient-to-r from-[#db2b2b] to-[#a81c1c] px-6 py-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-3xl font-black text-white">{request.bloodGroup || '?'}</span>
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${BG_COLORS[request.emergencyLevel] || BG_COLORS.normal} bg-white/20`}
                                    >
                                        {(request.emergencyLevel || 'normal').toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-white/90 text-sm">
                                    {request.unitsRequired ? `${request.unitsRequired} unit${request.unitsRequired > 1 ? 's' : ''} required` : 'Units not specified'}
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <span
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[request.status] || STATUS_BADGE.pending}`}
                                >
                                    {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
                                </span>
                                <span className="text-white/60 text-xs">Posted {dateStr}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Patient</p>
                            <p className="text-sm font-semibold text-gray-800">{request.patientName || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Hospital / Location</p>
                            <p className="text-sm font-semibold text-gray-800">{request.hospitalLocation || '—'}</p>
                        </div>
                        {isOwner && (
                            <>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Contact Email</p>
                                    <p className="text-sm text-gray-700">{request.requestEmail || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Contact Phone</p>
                                    <p className="text-sm text-gray-700">{request.requestPhone || '—'}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <StatusPipeline
                    currentStatus={request.status || 'pending'}
                    onAdvance={handleAdvanceStatus}
                    isOwner={isOwner}
                    loading={statusUpdating}
                />

                {isAuthenticated && !isOwner && request.status !== 'fulfilled' && (
                    <div className="rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-orange-50 p-5 shadow-sm">
                        {alreadyOffered ? (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <div>
                                    <p className="text-sm font-bold text-emerald-800">Offer submitted!</p>
                                    <p className="text-xs text-gray-500">The requester will review your offer and contact you.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-base font-bold text-gray-800">Can you help?</p>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        If you can donate <strong>{request.bloodGroup}</strong> blood, click below to let the requester know.
                                    </p>
                                    {donateError && <p className="text-xs text-red-600 mt-1">{donateError}</p>}
                                </div>
                                <button
                                    onClick={handleICanDonate}
                                    disabled={donating}
                                    className="shrink-0 flex items-center gap-2 px-6 py-3 bg-[#db2b2b] text-white font-bold rounded-xl hover:bg-[#c02525] transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
                                >
                                    🩸 {donating ? 'Submitting…' : 'Yes, I Can Donate!'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!isAuthenticated && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
                        <p className="text-sm text-amber-800 font-semibold">
                            <Link to="/login" className="underline">Log in</Link> to offer to donate or send a message.
                        </p>
                    </div>
                )}

                {(isOwner || matches.some((m) => m.donorId === currentUser?.uid)) && (
                    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                            <span className="text-base">🩸</span>
                            <h3 className="text-sm font-bold text-gray-800">
                                Donor Offers
                            </h3>
                            {matches.length > 0 && (
                                <span className="ml-auto text-xs font-semibold text-[#db2b2b] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                    {matches.length} offer{matches.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {matches.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-8">No donor offers yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-50 px-4 py-3 space-y-2">
                                {matches.map((m) => (
                                    <OfferCard
                                        key={m.id}
                                        match={{ ...m, _loading: matchLoadingId === m.id }}
                                        isOwner={isOwner}
                                        onAccept={(mid) => handleMatchAction(mid, 'accepted')}
                                        onDecline={(mid) => handleMatchAction(mid, 'declined')}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                )}
                <ContactLog
                    requestId={id}
                    currentUser={currentUser}
                    requestOwnerName={request.patientName || 'Requester'}
                />

            </main>
        </div>
    )
}
