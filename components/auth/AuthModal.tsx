'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleAuth() {
    setError('')
    setOauthLoading(true)

    try {
      const next = `${window.location.pathname}${window.location.search}`
      // Use production URL if available, otherwise fallback to window.location.origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(next || '/')}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้')
      setOauthLoading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md rounded-xl border border-brand-border bg-brand-card p-6 shadow-xl shadow-black/30"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
          className="absolute top-4 right-4 p-1 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-bg-secondary transition-colors"
        >
          <X size={18} />
        </button>

        <h2 id="auth-modal-title" className="text-xl font-bold text-brand-text-primary mb-1">
          {mode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </h2>
        <p className="text-sm text-brand-text-secondary mb-6">
          {mode === 'signin'
            ? 'เข้าใช้งาน StockGuru ด้วยบัญชีของคุณ'
            : 'เริ่มใช้งาน StockGuru ฟรี พร้อมอัพเกรดเมื่อต้องการ'}
        </p>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleGoogleAuth}
          isLoading={oauthLoading}
          disabled={loading}
        >
          {!oauthLoading && <GoogleIcon />}
          ดำเนินการต่อด้วย Google
        </Button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-border" />
          <span className="text-xs text-brand-text-secondary">หรือใช้อีเมล</span>
          <div className="h-px flex-1 bg-brand-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Input
              type="text"
              placeholder="ชื่อที่แสดง"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User size={16} className="text-brand-text-muted" />}
              autoFocus
              required
            />
          )}
          <Input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={16} className="text-brand-text-muted" />}
            autoFocus={mode === 'signin'}
            required
          />
          <Input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} className="text-brand-text-muted" />}
            required
          />

          {error && (
            <p role="alert" className="text-sm text-brand-danger">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={loading} disabled={oauthLoading}>
            {mode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            className="text-sm text-brand-primary hover:underline"
          >
            {mode === 'signin' ? 'ยังไม่มีบัญชี? สมัครเลย' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.1 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.3 7.3 0 0 1-10.8-3.8h-4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8L20 3.2A12 12 0 0 0 1.2 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z" />
    </svg>
  )
}
