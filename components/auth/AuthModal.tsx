'use client'

import { useState } from 'react'
import { X, Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/format'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  if (!isOpen) return null

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-brand-card border border-brand-border rounded-xl shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-bg-secondary transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-brand-text-primary mb-1">
          {mode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </h2>
        <p className="text-sm text-brand-text-secondary mb-6">
          {mode === 'signin'
            ? 'เข้าใช้งาน StockGuru ด้วยบัญชีของคุณ'
            : 'เริ่มใช้งาน StockGuru ฟรี พร้อมอัพเกรดเมื่อต้องการ'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Input
              type="text"
              placeholder="ชื่อที่แสดง"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User size={16} className="text-brand-text-muted" />}
              required
            />
          )}
          <Input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={16} className="text-brand-text-muted" />}
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
            <p className="text-sm text-brand-danger">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={loading}>
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
    </div>
  )
}
