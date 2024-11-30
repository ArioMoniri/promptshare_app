'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface AnimatedButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function AnimatedButton({ children, onClick, className, variant = 'default', size = 'default' }: AnimatedButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
    if (onClick) onClick()
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
      <motion.div
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: isAnimating ? 2 : 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-primary rounded-full"
      />
    </Button>
  )
}

