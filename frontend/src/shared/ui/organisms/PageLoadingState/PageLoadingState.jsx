import { Spinner } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'

const PageLoadingState = ({ className, spinnerSize = 'lg' }) => {
  return (
    <div className={cn('page-shell py-2xl', className)}>
      <div className="flex justify-center"><Spinner size={spinnerSize} /></div>
    </div>
  )
}

export default PageLoadingState
