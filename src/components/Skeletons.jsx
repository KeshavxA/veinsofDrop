/**
 * SkeletonDonorTable
 * Animated placeholder rows while donor data loads.
 */
export function SkeletonDonorTable({ rows = 6 }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                        {['Blood', 'Name', 'City', 'Last Seen', 'Verified', ''].map((h) => (
                            <th
                                key={h}
                                className="px-6 py-3 text-left text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                            {/* Blood type pill */}
                            <td className="px-6 py-4">
                                <div className="h-6 w-10 rounded-full bg-red-100 dark:bg-slate-700" />
                            </td>
                            {/* Name + avatar */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0" />
                                    <div className="h-4 rounded bg-gray-200 dark:bg-slate-700 w-32" />
                                </div>
                            </td>
                            {/* City */}
                            <td className="px-6 py-4">
                                <div className="h-4 rounded bg-gray-200 dark:bg-slate-700 w-24" />
                            </td>
                            {/* Last seen */}
                            <td className="px-6 py-4">
                                <div className="h-4 rounded bg-gray-200 dark:bg-slate-700 w-20" />
                            </td>
                            {/* Badge */}
                            <td className="px-6 py-4">
                                <div className="h-5 rounded-full bg-gray-200 dark:bg-slate-700 w-16" />
                            </td>
                            {/* Actions */}
                            <td className="px-6 py-4">
                                <div className="h-8 rounded-lg bg-gray-200 dark:bg-slate-700 w-28" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/**
 * SkeletonUrgentCard
 * Placeholder card for urgent/critical request cards.
 */
export function SkeletonUrgentCard({ count = 3 }) {
    return (
        <div className="mb-6 rounded-xl border border-amber-100 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-800/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-amber-300 dark:bg-amber-600" />
                <div className="h-4 w-48 rounded bg-amber-200 dark:bg-slate-700" />
            </div>
            <ul className="space-y-2">
                {Array.from({ length: count }).map((_, i) => (
                    <li
                        key={i}
                        className="animate-pulse flex items-center justify-between rounded-lg bg-white dark:bg-slate-800 p-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-10 rounded-full bg-red-100 dark:bg-slate-700" />
                            <div className="h-4 w-40 rounded bg-gray-200 dark:bg-slate-700" />
                        </div>
                        <div className="h-7 w-24 rounded-lg bg-gray-200 dark:bg-slate-700" />
                    </li>
                ))}
            </ul>
        </div>
    )
}

/**
 * SkeletonCard
 * Generic shimmer card placeholder.
 */
export function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
        </div>
    )
}

/**
 * EmptyState
 * Consistent empty state across the entire app.
 */
export function EmptyState({ icon = '🔍', title, sub, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="text-5xl mb-4 block">{icon}</span>
            <h3 className="text-base font-bold text-gray-800 dark:text-slate-200 mb-1">{title}</h3>
            {sub && <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs">{sub}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
