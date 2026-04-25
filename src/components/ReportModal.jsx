import React, { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../contexts/AuthContext'

const REASONS = [
    'Fake / incorrect information',
    'Abusive or inappropriate contact',
    'Spam / duplicate listing',
    'Suspicious activity',
    'Already fulfilled / no longer needed',
    'Other',
]


export default function ReportModal({ target, onClose }) {
    const { currentUser } = useAuth()
    const [reason, setReason] = useState('')
    const [details, setDetails] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!reason) { setError('Please select a reason.'); return }
        setSubmitting(true)
        setError('')
        try {
            await addDoc(collection(db, 'reports'), {
                targetId: target.id,
                targetType: target.type,
                targetName: target.name || '',
                reportedBy: currentUser?.uid || 'anonymous',
                reporterEmail: currentUser?.email || '',
                reason,
                details: details.trim(),
                status: 'pending',
                createdAt: serverTimestamp(),
            })
            setSubmitted(true)
        } catch (err) {
            console.error('Error submitting report:', err)
            setError('Failed to send report. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'modalIn 0.2s ease-out' }}
            >
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-white font-bold text-lg leading-tight">Report</p>
                        <p className="text-white/80 text-xs mt-0.5 truncate max-w-[260px]">
                            {target.type === 'donor' ? '🩸 Donor' : '🚨 Request'}: {target.name || target.id}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white text-2xl leading-none transition-colors"
                        aria-label="Close"
                    >×</button>
                </div>

                {submitted ? (
                    <div className="px-6 py-10 text-center">
                        <div className="text-4xl mb-3">✅</div>
                        <p className="text-gray-800 font-bold text-lg">Report submitted</p>
                        <p className="text-gray-500 text-sm mt-1">
                            Our team will review this and take action within 24 hours.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-6 px-6 py-2 bg-[#db2b2b] text-white rounded-lg font-semibold hover:bg-[#c02525] transition-colors"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                        {error && (
                            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-1.5">
                                {REASONS.map((r) => (
                                    <label
                                        key={r}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${reason === r
                                            ? 'border-[#db2b2b] bg-red-50 text-[#db2b2b]'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={r}
                                            checked={reason === r}
                                            onChange={() => setReason(r)}
                                            className="accent-[#db2b2b]"
                                        />
                                        <span className="text-sm">{r}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Additional details <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                rows={3}
                                maxLength={500}
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="Describe the issue in more detail…"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30 resize-none"
                            />
                            <p className="text-right text-xs text-gray-400 mt-0.5">{details.length}/500</p>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-[#db2b2b] text-white rounded-lg font-semibold hover:bg-[#c02525] transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Sending…' : 'Submit Report'}
                            </button>
                        </div>
                    </form>
                )}

                <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.94) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
            </div>
        </div>
    )
}
