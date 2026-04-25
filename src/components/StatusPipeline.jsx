import React from 'react'

const STAGES = [
    {
        key: 'pending',
        label: 'Pending',
        icon: '⏳',
        desc: 'Request posted, seeking a donor',
        color: 'text-gray-500',
        activeBg: 'bg-gray-600',
        activeRing: 'ring-gray-300',
    },
    {
        key: 'contacted',
        label: 'Contacted',
        icon: '📞',
        desc: 'Donor has responded',
        color: 'text-blue-600',
        activeBg: 'bg-blue-600',
        activeRing: 'ring-blue-200',
    },
    {
        key: 'accepted',
        label: 'Accepted',
        icon: '✅',
        desc: 'Donation confirmed',
        color: 'text-emerald-600',
        activeBg: 'bg-emerald-600',
        activeRing: 'ring-emerald-200',
    },
    {
        key: 'fulfilled',
        label: 'Fulfilled',
        icon: '🩸',
        desc: 'Donation completed!',
        color: 'text-red-700',
        activeBg: 'bg-[#db2b2b]',
        activeRing: 'ring-red-200',
    },
]

const ORDER = STAGES.map((s) => s.key)

export default function StatusPipeline({ currentStatus, onAdvance, isOwner, loading }) {
    const currentIdx = ORDER.indexOf(currentStatus) ?? 0
    const nextStage = STAGES[currentIdx + 1] ?? null

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                    Request Status
                </h3>
                {isOwner && nextStage && (
                    <button
                        onClick={() => onAdvance(nextStage.key)}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#db2b2b] text-white hover:bg-[#c02525] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Updating…' : `Mark as ${nextStage.label} →`}
                    </button>
                )}
                {isOwner && !nextStage && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                        ✓ Request Fulfilled
                    </span>
                )}
            </div>

            {/* Pipeline track */}
            <div className="flex items-center">
                {STAGES.map((stage, idx) => {
                    const isPast = idx < currentIdx
                    const isCurrent = idx === currentIdx
                    const isFuture = idx > currentIdx

                    return (
                        <React.Fragment key={stage.key}>
                            {/* Step */}
                            <div className="flex flex-col items-center min-w-0 flex-1">
                                {/* Circle */}
                                <div
                                    className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all
                    ${isCurrent ? `${stage.activeBg} ring-4 ${stage.activeRing} text-white shadow-md` : ''}
                    ${isPast ? 'bg-emerald-500 text-white' : ''}
                    ${isFuture ? 'bg-gray-100 text-gray-400' : ''}
                  `}
                                >
                                    {isPast ? '✓' : stage.icon}
                                </div>

                                {/* Label */}
                                <p
                                    className={`mt-1.5 text-[11px] font-semibold text-center leading-tight ${isCurrent ? stage.color : isPast ? 'text-emerald-600' : 'text-gray-400'
                                        }`}
                                >
                                    {stage.label}
                                </p>
                                {isCurrent && (
                                    <p className="mt-0.5 text-[10px] text-gray-500 text-center leading-tight hidden sm:block max-w-[80px]">
                                        {stage.desc}
                                    </p>
                                )}
                            </div>

                            {/* Connector line */}
                            {idx < STAGES.length - 1 && (
                                <div
                                    className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${idx < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
