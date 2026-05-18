import { Loader2 } from 'lucide-react'
import { cn } from '../../utils'

const sizeMap = { sm: 16, md: 24, lg: 36 }

/**
 * Spinner
 * @param {'sm'|'md'|'lg'} size
 * @param {string} className
 */
function Spinner({ size = 'md', className, ...props }) {
  return (
    <Loader2
      size={sizeMap[size]}
      className={cn('animate-spin text-primary', className)}
      {...props}
    />
  )
}

export default Spinner
