import { Loader2 } from 'lucide-react'

const sizeClasses = {
  sm: 16,
  md: 20,
  lg: 24,
}

/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'} props.size
 */
function Spinner({ size = 'md' }) {
  return <Loader2 size={sizeClasses[size]} className="animate-spin text-primary" />
}

export default Spinner
