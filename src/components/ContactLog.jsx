import React, { useState, useEffect, useRef } from 'react'
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'

function timeAgo(ts) {
    const date = ts?.toDate?.() ?? (ts ? new Date(ts) : null)
    if (!date) return ''
    const diff = Math.floor((Date.now() - date) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
}

function typeIcon(type) {
    if (type === 'status_change') return '🔄'
    if (type === 'offer') return '🩸'
    return '💬'
}

export default function ContactLog({ requestId, currentUser, requestOwnerName }) {
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        if (!requestId || !db) return
        const q = query(
            collection(db, 'contactLogs'),
            where('requestId', '==', requestId)
        )
        const unsub = onSnapshot(q, (snap) => {
            const msgs = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))

                .sort((a, b) => {
                    const ta = a.createdAt?.toDate?.()?.getTime() ?? 0
                    const tb = b.createdAt?.toDate?.()?.getTime() ?? 0
                    return ta - tb
                })
            setMessages(msgs)
        })
        return () => unsub()
    }, [requestId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e) => {
        e.preventDefault()
        const trimmed = text.trim()
        if (!trimmed || !currentUser) return
        setSending(true)
        try {
            await addDoc(collection(db, 'contactLogs'), {
                requestId,
                authorId: currentUser.uid,
                authorEmail: currentUser.email,
                authorName: currentUser.displayName || currentUser.email,
                message: trimmed,
                type: 'message',
                createdAt: serverTimestamp(),
            })
            setText('')
        } catch (err) {
            console.error('ContactLog send error:', err)
        } finally {
            setSending(false)
        }
    }

    const isMine = (msg) => msg.authorId === currentUser?.uid
    const isSystem = (msg) => msg.authorId === 'system' || msg.type === 'status_change' || msg.type === 'offer'

    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col" style={{ minHeight: 320 }}>

            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="text-base">💬</span>
                <h3 className="text-sm font-bold text-gray-800">Contact Log</h3>
                <span className="ml-auto text-xs text-gray-400">{messages.length} update{messages.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: 380 }}>
                {messages.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">
                        No updates yet. Be the first to respond!
                    </p>
                )}

                {messages.map((msg) => {
                    if (isSystem(msg)) {

                        return (
                            <div key={msg.id} className="flex justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                                    <span>{typeIcon(msg.type)}</span>
                                    <span>{msg.message}</span>
                                    <span className="opacity-60 ml-1">{timeAgo(msg.createdAt)}</span>
                                </div>
                            </div>
                        )
                    }

                    const mine = isMine(msg)
                    return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>

                                <span className="text-[10px] text-gray-400 px-1">
                                    {mine ? 'You' : msg.authorName || msg.authorEmail}
                                </span>

                                <div
                                    className={`px-3.5 py-2 rounded-2xl text-sm leading-snug ${mine
                                        ? 'bg-[#db2b2b] text-white rounded-br-sm'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                        }`}
                                >
                                    {msg.message}
                                </div>
                                <span className="text-[10px] text-gray-400 px-1">{timeAgo(msg.createdAt)}</span>
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {currentUser ? (
                <form onSubmit={handleSend} className="border-t border-gray-100 p-3 flex gap-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message or update…"
                        maxLength={500}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/20"
                    />
                    <button
                        type="submit"
                        disabled={sending || !text.trim()}
                        className="px-4 py-2 bg-[#db2b2b] text-white text-sm font-semibold rounded-lg hover:bg-[#c02525] transition-colors disabled:opacity-40"
                    >
                        {sending ? '…' : 'Send'}
                    </button>
                </form>
            ) : (
                <p className="text-center text-xs text-gray-400 border-t border-gray-100 py-3">
                    Log in to send a message
                </p>
            )}
        </div>
    )
}
