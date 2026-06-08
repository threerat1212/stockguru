'use client'

import { X, Crown, Zap } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  feature?: string
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = 'ต้องการแผน Pro',
  description = 'ฟีเจอร์นี้ใช้ได้เฉพาะสมาชิก Pro',
  feature = 'ฟีเจอร์นี้',
}: UpgradeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-brand-card border border-brand-border rounded-xl shadow-2xl p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-bg-secondary transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown size={28} className="text-brand-primary" />
        </div>

        <h2 className="text-xl font-bold text-brand-text-primary mb-2">{title}</h2>
        <p className="text-sm text-brand-text-secondary mb-6">{description}</p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between p-3 bg-brand-bg-secondary rounded-lg">
            <span className="text-sm text-brand-text-secondary">แผนปัจจุบัน</span>
            <span className="text-sm font-medium text-brand-text-primary">Free</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-lg">
            <span className="text-sm text-brand-text-secondary">Pro</span>
            <span className="text-sm font-bold text-brand-primary">199 THB/เดือน</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/pricing">
            <Button variant="primary" className="w-full gap-1">
              <Zap size={16} />
              ดูรายละเอียดแผน Pro
            </Button>
          </Link>
          <Button variant="ghost" onClick={onClose}>
            ยังไม่สนใจตอนนี้
          </Button>
        </div>
      </div>
    </div>
  )
}
