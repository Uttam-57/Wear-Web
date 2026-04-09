import { cn } from '@/shared/utils/cn'

const KeyValueRow = ({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className={labelClassName}>{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  )
}

export default KeyValueRow
