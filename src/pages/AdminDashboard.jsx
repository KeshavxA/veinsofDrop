import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../../firebase'
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore'

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
    { key: 'overview', icon: '📊', label: 'Overview' },
    { key: 'donors', icon: '👥', label: 'Donors' },
    { key: 'requests', icon: '🩸', label: 'Requests' },
    { key: 'reports', icon: '🚩', label: 'Reports' },
    { key: 'verify', icon: '🛡️', label: 'Verification' },
]

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

const BG_GRADIENT = [
    'from-red-700   to-red-500',
    'from-red-600   to-orange-400',
    'from-red-500   to-pink-400',
    'from-orange-600 to-amber-400',
    'from-violet-600 to-purple-400',
    'from-blue-600  to-cyan-400',
    'from-emerald-600 to-green-400',
    'from-rose-600  to-red-400',
]

const STATUS_CHIP = {
    pending: 'bg-gray-100 text-gray-700 border border-gray-200',
    contacted: 'bg-blue-50  text-blue-700  border border-blue-200',
    accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    fulfilled: 'bg-red-50   text-red-700   border border-red-200',
}

const EMERGENCY_CHIP = {
    critical: 'bg-red-600    text-white',
    urgent: 'bg-orange-500 text-white',
    normal: 'bg-gray-200   text-gray-700',
}

const REPORT_STATUS_CHIP = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    reviewed: 'bg-blue-50  text-blue-700  border border-blue-200',
    actioned: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

const VER_STATUS_CHIP = {
    pending: 'bg-amber-50   text-amber-700   border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-50     text-red-700     border border-red-200',
}

// ─── Small Reusable Components ────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, from, to }) {
    return (
        <div className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${from} ${to}`}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest">{label}</p>
                    <p className="text-4xl font-black mt-2 tabular-nums leading-none">{value ?? '—'}</p>
                    {sub && <p className="text-white/65 text-xs mt-2 leading-snug">{sub}</p>}
                </div>
                <span className="text-4xl mt-0.5 shrink-0 opacity-90">{icon}</span>
            </div>
        </div>
    )
}

function Chip({ status, map, label }) {
    const cls = (map && map[status]) || 'bg-gray-100 text-gray-600'
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
            {label ?? status}
        </span>
    )
}

function Btn({ onClick, disabled, children, variant = 'primary', size = 'sm' }) {
    const v = {
        primary: 'bg-[#db2b2b] text-white hover:bg-[#c02525]',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700',
        ghost: 'border border-gray-300 text-gray-600 hover:bg-gray-50',
        danger: 'bg-red-800 text-white hover:bg-red-900',
        amber: 'bg-amber-500 text-white hover:bg-amber-600',
        slate: 'bg-slate-700 text-white hover:bg-slate-800',
    }
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${v[variant]}`}
        >
            {children}
        </button>
    )
}

function TableEmpty({ icon = '📭', msg = 'Nothing here yet.' }) {
    return (
        <tr>
            <td colSpan={99} className="text-center py-14 text-gray-400">
                <p className="text-3xl mb-2">{icon}</p>
                <p className="text-sm">{msg}</p>
            </td>
        </tr>
    )
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────
function BloodGroupChart({ donors }) {
    const counts = BLOOD_GROUPS.map((bg) => ({
        bg,
        count: donors.filter((d) => (d.bloodGroup || '').replace(/\s/g, '').toUpperCase() === bg).length,
    }))
    const max = Math.max(...counts.map((c) => c.count), 1)

    return (
        <div className="space-y-2.5">
            {counts.map(({ bg, count }, i) => (
                <div key={bg} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 w-8 shrink-0 text-right">{bg}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${BG_GRADIENT[i]} transition-all duration-700`}
                            style={{ width: `${(count / max) * 100}%`, minWidth: count > 0 ? 24 : 0 }}
                        />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-6 shrink-0">{count}</span>
                </div>
            ))}
        </div>
    )
}

// ─── CSS Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ segments, size = 160 }) {
    const total = segments.reduce((s, g) => s + g.value, 0) || 1
    let angle = 0
    const stops = segments
        .map((seg) => {
            const start = angle
            const deg = (seg.value / total) * 360
            angle += deg
            return `${seg.color} ${start}deg ${angle}deg`
        })
        .join(', ')

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <div
                className="rounded-full"
                style={{
                    width: size,
                    height: size,
                    background: `conic-gradient(${stops})`,
                }}
            />
            {/* Hole */}
            <div
                className="absolute bg-white rounded-full flex flex-col items-center justify-center"
                style={{ width: size * 0.62, height: size * 0.62 }}
            >
                <span className="text-xl font-black text-gray-800">{total}</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">total</span>
            </div>
        </div>
    )
}

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmtDate = (ts) => {
    const d = ts?.toDate?.() ?? null
    if (!d) return '—'
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fmtMin = (min) => {
    if (min === null || min === undefined) return '—'
    if (min < 60) return `${min}m`
    if (min < 1440) return `${Math.floor(min / 60)}h ${min % 60}m`
    return `${Math.floor(min / 1440)}d`
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
    const { currentUser } = useAuth()
    const [tab, setTab] = useState('overview')
    const [mobileOpen, setMobileOpen] = useState(false)

    // ── Live data ──────────────────────────────────────────────────────────────
    const [donors, setDonors] = useState([])
    const [requests, setRequests] = useState([])
    const [reports, setReports] = useState([])
    const [verifyReqs, setVerifyReqs] = useState([])
    const [matches, setMatches] = useState([])
    const [dataReady, setDataReady] = useState(false)

    // ── Per-row loading state ─────────────────────────────────────────────────
    const [busyId, setBusyId] = useState(null)

    // ── Donor tab filter ──────────────────────────────────────────────────────
    const [donorFilter, setDonorFilter] = useState('all')  // all | unverified | blocked
    const [requestFilter, setRequestFilter] = useState('all')  // all | urgent | active | fulfilled
    const [reportFilter, setReportFilter] = useState('pending') // all | pending | reviewed | actioned
    const [verFilter, setVerFilter] = useState('pending') // all | pending | approved | rejected

    useEffect(() => {
        if (!db) return
        const unsubs = []

        unsubs.push(
            onSnapshot(query(collection(db, 'donors'), orderBy('createdAt', 'desc')), (s) =>
                setDonors(s.docs.map((d) => ({ id: d.id, ...d.data() })))
            )
        )
        unsubs.push(
            onSnapshot(query(collection(db, 'requests'), orderBy('createdAt', 'desc')), (s) => {
                setRequests(s.docs.map((d) => ({ id: d.id, ...d.data() })))
                setDataReady(true)
            })
        )
        unsubs.push(
            onSnapshot(query(collection(db, 'reports'), orderBy('createdAt', 'desc')), (s) =>
                setReports(s.docs.map((d) => ({ id: d.id, ...d.data() })))
            )
        )
        unsubs.push(
            onSnapshot(query(collection(db, 'verificationRequests'), orderBy('createdAt', 'desc')), (s) =>
                setVerifyReqs(s.docs.map((d) => ({ id: d.id, ...d.data() })))
            )
        )
        unsubs.push(
            onSnapshot(collection(db, 'matches'), (s) =>
                setMatches(s.docs.map((d) => ({ id: d.id, ...d.data() })))
            )
        )

        return () => unsubs.forEach((u) => u())
    }, [])

    // ── Analytics ──────────────────────────────────────────────────────────────
    const analytics = useMemo(() => {
        const urgentActive = requests.filter(
            (r) => (r.emergencyLevel === 'urgent' || r.emergencyLevel === 'critical') && r.status !== 'fulfilled'
        ).length

        const pendingReports = reports.filter((r) => r.status === 'pending').length
        const pendingVerifications = verifyReqs.filter((v) => v.status === 'pending').length
        const unverifiedDonors = donors.filter((d) => !d.verified && !d.blocked).length

        // Request status breakdown
        const statusSeg = [
            { label: 'Pending', value: requests.filter((r) => r.status === 'pending').length, color: '#94a3b8' },
            { label: 'Contacted', value: requests.filter((r) => r.status === 'contacted').length, color: '#3b82f6' },
            { label: 'Accepted', value: requests.filter((r) => r.status === 'accepted').length, color: '#10b981' },
            { label: 'Fulfilled', value: requests.filter((r) => r.status === 'fulfilled').length, color: '#db2b2b' },
        ]

        // Emergency breakdown
        const emgSeg = [
            { label: 'Critical', value: requests.filter((r) => r.emergencyLevel === 'critical').length, color: '#dc2626' },
            { label: 'Urgent', value: requests.filter((r) => r.emergencyLevel === 'urgent').length, color: '#f97316' },
            { label: 'Normal', value: requests.filter((r) => !r.emergencyLevel || r.emergencyLevel === 'normal').length, color: '#94a3b8' },
        ]

        // Average response time: time from request.createdAt to first match.createdAt
        const responseTimes = []
        requests.forEach((req) => {
            const reqMatches = matches.filter((m) => m.requestId === req.id)
            if (reqMatches.length > 0) {
                const reqTime = req.createdAt?.toDate?.()?.getTime()
                const firstReplyTime = Math.min(
                    ...reqMatches.map((m) => m.createdAt?.toDate?.()?.getTime() ?? Infinity)
                )
                if (reqTime && firstReplyTime > reqTime && firstReplyTime !== Infinity) {
                    responseTimes.push((firstReplyTime - reqTime) / 60000)
                }
            }
        })
        const avgResponseMin =
            responseTimes.length > 0
                ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
                : null

        const fulfillRate =
            requests.length > 0
                ? Math.round((requests.filter((r) => r.status === 'fulfilled').length / requests.length) * 100)
                : 0

        return {
            urgentActive, pendingReports, pendingVerifications, unverifiedDonors,
            statusSeg, emgSeg, avgResponseMin, fulfillRate,
        }
    }, [donors, requests, reports, verifyReqs, matches])

    // ── Actions ────────────────────────────────────────────────────────────────
    const withBusy = async (id, fn) => {
        setBusyId(id)
        try { await fn() } catch (e) { console.error(e) }
        finally { setBusyId(null) }
    }

    const verifyDonor = (id) => withBusy(id, () =>
        updateDoc(doc(db, 'donors', id), { verified: true })
    )

    const toggleBlock = (id, blocked) => withBusy(id, () =>
        updateDoc(doc(db, 'donors', id), { blocked: !blocked })
    )

    const fulfillRequest = (reqId) => withBusy(reqId, async () => {
        await updateDoc(doc(db, 'requests', reqId), { status: 'fulfilled' })
        await addDoc(collection(db, 'contactLogs'), {
            requestId: reqId,
            authorId: 'admin',
            authorEmail: currentUser?.email || 'admin',
            authorName: 'Admin',
            message: 'Marked as Fulfilled by admin.',
            type: 'status_change',
            createdAt: serverTimestamp(),
        })
    })

    const setReportStatus = (id, status) => withBusy(id, () =>
        updateDoc(doc(db, 'reports', id), { status, reviewedBy: currentUser?.email, reviewedAt: serverTimestamp() })
    )

    const approveVerification = (verId, userId) => withBusy(verId, async () => {
        await updateDoc(doc(db, 'verificationRequests', verId), {
            status: 'approved', reviewedBy: currentUser?.email, reviewedAt: serverTimestamp(),
        })
        const donorDoc = donors.find((d) => d.userId === userId)
        if (donorDoc) await updateDoc(doc(db, 'donors', donorDoc.id), { verified: true })
    })

    const rejectVerification = (verId) => withBusy(verId, () =>
        updateDoc(doc(db, 'verificationRequests', verId), {
            status: 'rejected', reviewedBy: currentUser?.email, reviewedAt: serverTimestamp(),
        })
    )

    // ── Filtered lists ─────────────────────────────────────────────────────────
    const visibleDonors = donors.filter((d) => {
        if (donorFilter === 'unverified') return !d.verified && !d.blocked
        if (donorFilter === 'blocked') return d.blocked
        return true
    })

    const visibleRequests = requests.filter((r) => {
        if (requestFilter === 'urgent') return r.emergencyLevel === 'urgent' || r.emergencyLevel === 'critical'
        if (requestFilter === 'active') return r.status !== 'fulfilled'
        if (requestFilter === 'fulfilled') return r.status === 'fulfilled'
        return true
    })

    const visibleReports = reportFilter === 'all' ? reports : reports.filter((r) => r.status === reportFilter)
    const visibleVerify = verFilter === 'all' ? verifyReqs : verifyReqs.filter((v) => v.status === verFilter)

    // ─────────────────────────────────────────────────────────────────────────
    // TAB RENDERERS
    // ─────────────────────────────────────────────────────────────────────────

    // ── Overview ───────────────────────────────────────────────────────────────
    const renderOverview = () => (
        <div className="space-y-8">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="👥" label="Total Donors" value={donors.length}
                    sub={`${analytics.unverifiedDonors} awaiting verification`}
                    from="from-rose-600" to="to-rose-400" />
                <StatCard icon="🚨" label="Active Urgent" value={analytics.urgentActive}
                    sub="critical + urgent unfulfilled"
                    from="from-orange-600" to="to-amber-400" />
                <StatCard icon="📋" label="Total Requests" value={requests.length}
                    sub={`${analytics.fulfillRate}% fulfilled`}
                    from="from-blue-600" to="to-cyan-500" />
                <StatCard icon="🚩" label="Pending Reports" value={analytics.pendingReports}
                    sub={`${analytics.pendingVerifications} verifications queued`}
                    from="from-violet-600" to="to-purple-400" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Blood group distribution */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5">
                        🩸 Donors by Blood Group
                    </h3>
                    <BloodGroupChart donors={donors} />
                </div>

                {/* Request status donut */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5">
                        📋 Request Status Breakdown
                    </h3>
                    <div className="flex items-center gap-8">
                        <DonutChart segments={analytics.statusSeg} size={150} />
                        <div className="space-y-2.5 flex-1">
                            {analytics.statusSeg.map((s) => (
                                <div key={s.label} className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                                    <span className="text-xs text-gray-500 flex-1">{s.label}</span>
                                    <span className="text-xs font-bold text-gray-800">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Avg response time */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
                    <p className="text-3xl font-black text-[#db2b2b] tabular-nums">
                        {fmtMin(analytics.avgResponseMin)}
                    </p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
                        Avg Donor Response Time
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {matches.length} total donor offers
                    </p>
                </div>

                {/* Emergency breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
                        ⚡ Emergency Breakdown
                    </p>
                    <div className="flex items-end gap-3 h-20">
                        {analytics.emgSeg.map((seg) => {
                            const max = Math.max(...analytics.emgSeg.map((s) => s.value), 1)
                            return (
                                <div key={seg.label} className="flex flex-col items-center gap-1 flex-1">
                                    <span className="text-xs font-bold text-gray-600">{seg.value}</span>
                                    <div
                                        className="w-full rounded-t-lg"
                                        style={{ height: `${(seg.value / max) * 56}px`, background: seg.color, minHeight: seg.value > 0 ? 8 : 3 }}
                                    />
                                    <span className="text-[10px] text-gray-500 font-semibold">{seg.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Fulfillment rate */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
                    <p className="text-3xl font-black text-emerald-600 tabular-nums">
                        {analytics.fulfillRate}%
                    </p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
                        Request Fulfillment Rate
                    </p>
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700"
                            style={{ width: `${analytics.fulfillRate}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                        {requests.filter((r) => r.status === 'fulfilled').length} / {requests.length} requests
                    </p>
                </div>
            </div>
        </div>
    )

    // ── Donors ─────────────────────────────────────────────────────────────────
    const renderDonors = () => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-bold text-gray-800 mr-auto">
                    Donors
                    <span className="ml-2 text-xs font-normal text-gray-400">({visibleDonors.length})</span>
                </h3>
                {['all', 'unverified', 'blocked'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setDonorFilter(f)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${donorFilter === f ? 'bg-[#db2b2b] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f === 'all' ? `All (${donors.length})` : f === 'unverified' ? `Unverified (${analytics.unverifiedDonors})` : `Blocked (${donors.filter((d) => d.blocked).length})`}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {['Name', 'Email', 'Blood', 'Location', 'Status', 'Registered', 'Actions'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {visibleDonors.length === 0 ? (
                            <TableEmpty icon="👥" msg="No donors match this filter." />
                        ) : (
                            visibleDonors.map((d) => (
                                <tr key={d.id} className={`hover:bg-gray-50/50 transition-colors ${d.blocked ? 'opacity-60' : ''}`}>
                                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-[#db2b2b]/10 text-[#db2b2b] flex items-center justify-center text-xs font-bold shrink-0">
                                                {(d.name || '?')[0].toUpperCase()}
                                            </span>
                                            {d.name || '—'}
                                            {d.verified && (
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">✓</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{d.email || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className="font-bold text-[#db2b2b] bg-red-50 border border-red-100 px-2 py-0.5 rounded text-xs">
                                            {d.bloodGroup || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{d.location || '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 flex-wrap">
                                            {d.verified && <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Verified</span>}
                                            {d.blocked && <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Blocked</span>}
                                            {!d.verified && !d.blocked && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Unverified</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(d.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5 items-center flex-wrap">
                                            {!d.verified && (
                                                <Btn variant="success" onClick={() => verifyDonor(d.id)} disabled={busyId === d.id}>
                                                    {busyId === d.id ? '…' : '✓ Verify'}
                                                </Btn>
                                            )}
                                            <Btn
                                                variant={d.blocked ? 'ghost' : 'danger'}
                                                onClick={() => toggleBlock(d.id, d.blocked)}
                                                disabled={busyId === d.id}
                                            >
                                                {busyId === d.id ? '…' : d.blocked ? 'Unblock' : 'Block'}
                                            </Btn>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )

    // ── Requests ───────────────────────────────────────────────────────────────
    const renderRequests = () => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-bold text-gray-800 mr-auto">
                    Blood Requests
                    <span className="ml-2 text-xs font-normal text-gray-400">({visibleRequests.length})</span>
                </h3>
                {[
                    { key: 'all', label: `All (${requests.length})` },
                    { key: 'urgent', label: `Urgent/Critical (${requests.filter(r => r.emergencyLevel === 'urgent' || r.emergencyLevel === 'critical').length})` },
                    { key: 'active', label: `Active (${requests.filter(r => r.status !== 'fulfilled').length})` },
                    { key: 'fulfilled', label: `Fulfilled (${requests.filter(r => r.status === 'fulfilled').length})` },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setRequestFilter(f.key)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${requestFilter === f.key ? 'bg-[#db2b2b] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {['Patient', 'Blood', 'Location', 'Emergency', 'Status', 'Date', 'Actions'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {visibleRequests.length === 0 ? (
                            <TableEmpty icon="🩸" msg="No requests match this filter." />
                        ) : (
                            visibleRequests.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap max-w-[140px] truncate">
                                        {r.patientName || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-bold text-[#db2b2b] bg-red-50 border border-red-100 px-2 py-0.5 rounded text-xs">
                                            {r.bloodGroup || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{r.hospitalLocation || '—'}</td>
                                    <td className="px-4 py-3">
                                        <Chip status={r.emergencyLevel || 'normal'} map={EMERGENCY_CHIP} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Chip status={r.status || 'pending'} map={STATUS_CHIP} />
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5 items-center">
                                            {r.status !== 'fulfilled' && (
                                                <Btn variant="success" onClick={() => fulfillRequest(r.id)} disabled={busyId === r.id}>
                                                    {busyId === r.id ? '…' : '✓ Fulfill'}
                                                </Btn>
                                            )}
                                            <Link
                                                to={`/request/${r.id}`}
                                                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                View →
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )

    // ── Reports ────────────────────────────────────────────────────────────────
    const renderReports = () => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-bold text-gray-800 mr-auto">
                    Flagged Content
                    <span className="ml-2 text-xs font-normal text-gray-400">({visibleReports.length})</span>
                </h3>
                {['pending', 'reviewed', 'actioned', 'all'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setReportFilter(f)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${reportFilter === f ? 'bg-[#db2b2b] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {['Type', 'Subject', 'Reporter', 'Reason', 'Status', 'Date', 'Actions'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {visibleReports.length === 0 ? (
                            <TableEmpty icon="🚩" msg="No reports match this filter." />
                        ) : (
                            visibleReports.map((rep) => (
                                <tr key={rep.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${rep.targetType === 'donor' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                            {rep.targetType || 'unknown'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 text-xs max-w-[140px] truncate" title={rep.targetName}>{rep.targetName || rep.targetId || '—'}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[130px] truncate">{rep.reporterEmail || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[180px]">
                                        <span className="line-clamp-2">{rep.reason || '—'}</span>
                                        {rep.details && <span className="text-gray-400 block">{rep.details.slice(0, 60)}{rep.details.length > 60 ? '…' : ''}</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Chip status={rep.status || 'pending'} map={REPORT_STATUS_CHIP} />
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(rep.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5 items-center flex-wrap">
                                            {rep.status === 'pending' && (
                                                <>
                                                    <Btn variant="ghost" onClick={() => setReportStatus(rep.id, 'reviewed')} disabled={busyId === rep.id}>
                                                        {busyId === rep.id ? '…' : 'Reviewed'}
                                                    </Btn>
                                                    <Btn variant="amber" onClick={() => setReportStatus(rep.id, 'actioned')} disabled={busyId === rep.id}>
                                                        {busyId === rep.id ? '…' : 'Action'}
                                                    </Btn>
                                                </>
                                            )}
                                            {rep.status !== 'pending' && (
                                                <span className="text-xs text-gray-400 italic">Done</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )

    // ── Verification ───────────────────────────────────────────────────────────
    const renderVerification = () => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-bold text-gray-800 mr-auto">
                    Verification Requests
                    <span className="ml-2 text-xs font-normal text-gray-400">({visibleVerify.length})</span>
                </h3>
                {['pending', 'approved', 'rejected', 'all'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setVerFilter(f)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${verFilter === f ? 'bg-[#db2b2b] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f === 'pending' ? `Pending (${verifyReqs.filter(v => v.status === 'pending').length})` : f}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {['Applicant', 'Email', 'Blood Type', 'Phone', 'Submitted', 'Status', 'Actions'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {visibleVerify.length === 0 ? (
                            <TableEmpty icon="🛡️" msg="No verification requests match this filter." />
                        ) : (
                            visibleVerify.map((v) => (
                                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                {(v.name || '?')[0].toUpperCase()}
                                            </span>
                                            {v.name || '—'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{v.email || '—'}</td>
                                    <td className="px-4 py-3">
                                        {v.bloodType ? (
                                            <span className="font-bold text-[#db2b2b] bg-red-50 border border-red-100 px-2 py-0.5 rounded text-xs">
                                                {v.bloodType}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{v.phone || '—'}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(v.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <Chip status={v.status || 'pending'} map={VER_STATUS_CHIP} />
                                    </td>
                                    <td className="px-4 py-3">
                                        {v.status === 'pending' ? (
                                            <div className="flex gap-1.5 items-center">
                                                <Btn variant="success" onClick={() => approveVerification(v.id, v.userId)} disabled={busyId === v.id}>
                                                    {busyId === v.id ? '…' : '✓ Approve'}
                                                </Btn>
                                                <Btn variant="ghost" onClick={() => rejectVerification(v.id)} disabled={busyId === v.id}>
                                                    {busyId === v.id ? '…' : 'Reject'}
                                                </Btn>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                {v.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                                {v.reviewedBy && <span className="block text-[10px]">by {v.reviewedBy}</span>}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )

    const TAB_MAP = {
        overview: renderOverview,
        donors: renderDonors,
        requests: renderRequests,
        reports: renderReports,
        verify: renderVerification,
    }

    const pendingBadge = {
        reports: analytics.pendingReports,
        verify: analytics.pendingVerifications,
    }

    // ─── Layout ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex bg-slate-950 font-sans">

            {/* ── Sidebar ────────────────────────────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-slate-900 border-r border-slate-800 sticky top-0 h-screen">

                {/* Brand */}
                <div className="px-5 py-5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🩸</span>
                        <div>
                            <p className="text-white font-black text-sm leading-tight">Admin Panel</p>
                            <p className="text-slate-500 text-[11px]">veinsofDrop</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {TABS.map((t) => {
                        const badge = pendingBadge[t.key]
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key
                                        ? 'bg-gradient-to-r from-[#db2b2b] to-red-700 text-white shadow-lg shadow-red-900/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <span className="text-lg">{t.icon}</span>
                                <span className="flex-1 text-left">{t.label}</span>
                                {badge > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20 text-white' : 'bg-[#db2b2b] text-white'}`}>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800">
                    <p className="text-slate-500 text-[11px] truncate mb-3">{currentUser?.email}</p>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                    >
                        ← Back to App
                    </Link>
                </div>
            </aside>

            {/* ── Mobile header ──────────────────────────────────────────────────── */}
            <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-slate-900 border-b border-slate-800 flex items-center px-4 h-14">
                <span className="text-lg mr-2">🩸</span>
                <span className="text-white font-black text-sm flex-1">Admin Panel</span>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="text-slate-400 hover:text-white p-2"
                >
                    {mobileOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile nav drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed top-14 inset-x-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex gap-2 flex-wrap">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => { setTab(t.key); setMobileOpen(false) }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t.key ? 'bg-[#db2b2b] text-white' : 'bg-slate-800 text-slate-300'
                                }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                    <Link to="/" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 ml-auto">
                        ← App
                    </Link>
                </div>
            )}

            {/* ── Main content ───────────────────────────────────────────────────── */}
            <main className="flex-1 min-h-screen overflow-x-hidden">
                {/* Top bar */}
                <div className="bg-slate-900/70 border-b border-slate-800 px-6 py-4 flex items-center gap-3 lg:mt-0 mt-14">
                    <div>
                        <h1 className="text-white font-black text-lg leading-tight">
                            {TABS.find((t) => t.key === tab)?.icon} {TABS.find((t) => t.key === tab)?.label}
                        </h1>
                        <p className="text-slate-500 text-xs mt-0.5">
                            {!dataReady ? 'Loading…' : 'Live data — updates automatically'}
                        </p>
                    </div>
                    {!dataReady && (
                        <div className="ml-auto inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#db2b2b]" />
                    )}
                </div>

                <div className="p-6">
                    {TAB_MAP[tab]?.()}
                </div>
            </main>
        </div>
    )
}
