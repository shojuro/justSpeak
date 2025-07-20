'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export default function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-warm-coral/20'
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }

  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
      role="progressbar"
      aria-label="Loading content"
    />
  )
}

// Skeleton components for specific use cases
export function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  )
}

export function ConversationSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  )
}

export function ButtonSkeleton({ width = 120, height = 40 }: { width?: number; height?: number }) {
  return (
    <Skeleton 
      variant="rounded" 
      width={width} 
      height={height}
      className="inline-block"
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-jet/50 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="75%" />
      </div>
      <div className="flex gap-2 pt-2">
        <ButtonSkeleton width={100} height={32} />
        <ButtonSkeleton width={100} height={32} />
      </div>
    </div>
  )
}