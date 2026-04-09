import { Alert } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'

const PageMessageState = ({ className, message, alertVariant = 'default', action = null }) => {
  return (
    <div className={cn('page-shell space-y-md', className)}>
      <Alert variant={alertVariant}>{message}</Alert>
      {action}
    </div>
  )
}

export default PageMessageState
