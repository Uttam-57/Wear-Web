import { cn } from '@/shared/utils/cn'

const Card = ({ children, className = '', ...props }) => {
  return (
    <article className={cn('glass-panel p-md', className)} {...props}>
      {children}
    </article>
  )
}

export default Card
