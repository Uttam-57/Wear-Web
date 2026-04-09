import { cn } from '@/shared/utils/cn'

/**
 * Avatar atom — pure UI, zero logic
 *
 * src:      string | null  — image URL. Falls back to initials if null
 * name:     string         — used to generate initials fallback
 * size:     'sm' | 'md' | 'lg'
 *
 * Used by: Navbar UserMenu, review cards, seller profile
 */
const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const Avatar = ({ src, name = '', size = 'md', className, ...props }) => {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const base = cn(
    'inline-flex items-center justify-center rounded-full',
    'font-medium bg-primary-soft text-primary flex-shrink-0',
    sizes[size],
    className
  )

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        className={cn(base, 'object-cover')}
        {...props}
      />
    )
  }

  return (
    <span className={base} aria-label={name || 'User avatar'} {...props}>
      {getInitials(name)}
    </span>
  )
}

export default Avatar