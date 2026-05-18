import { cn, getInitials } from '../../utils'

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
}

const colors = [
  'bg-primary-bg text-primary',
  'bg-secondary-bg text-secondary',
  'bg-info-bg text-info',
  'bg-success-bg text-success',
  'bg-warning-bg text-warning',
]

function getColorFromName(name = '') {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[code % colors.length]
}

/**
 * Avatar
 * @param {string} src - image URL
 * @param {string} name - full name (for initials fallback)
 * @param {'sm'|'md'|'lg'|'xl'} size
 */
function Avatar({ src, name = '', size = 'md', className, ...props }) {
  const initials = getInitials(name)
  const colorClass = getColorFromName(name)

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center overflow-hidden shrink-0 font-semibold select-none',
        sizeClasses[size],
        !src && colorClass,
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || '?'}</span>
      )}
    </div>
  )
}

export default Avatar
