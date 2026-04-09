import Input from '@/shared/ui/atoms/Input'
import Button from '@/shared/ui/atoms/Button'
import { cn } from '@/shared/utils/cn'

/**
 * SearchBar molecule — Input + Button
 *
 * Composes: Input atom + Button atom
 * Used by: ProductsPage, AdminUsersPage, AdminProductsPage
 *
 * value:       string  — controlled input value
 * onChange:    fn      — input change handler
 * onSubmit:    fn      — called on form submit or button click
 * placeholder: string
 * loading:     boolean — disables while searching
 * className:   string  — wrapper override
 */
const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  loading = false,
  className,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) onSubmit(value)
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn('flex items-center gap-sm', className)}
    >
      <Input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label="Search"
        className="flex-1"
      />
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        aria-label="Submit search"
      >
        Find
      </Button>
    </form>
  )
}

export default SearchBar