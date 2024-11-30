'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ButtonProps } from '@/components/ui/button'

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode
}

export function AnimatedButton({ children, className, onClick, ...props }: AnimatedButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
    if (onClick) onClick(e)
  }

  return (
    <Button
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
      {...props}
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
