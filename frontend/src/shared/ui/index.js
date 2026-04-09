// ─── Atoms ────────────────────────────────────────────────────────────────────
// Smallest units. No logic. No API calls. Pure JSX + Tailwind.
export { default as Button }   from '@/shared/ui/atoms/Button'
export { default as Input }    from '@/shared/ui/atoms/Input'
export { default as Label }    from '@/shared/ui/atoms/Label'
export { default as Checkbox } from '@/shared/ui/atoms/Checkbox'
export { default as Badge }    from '@/shared/ui/atoms/Badge'
export { default as Avatar }   from '@/shared/ui/atoms/Avatar'
export { default as Toggle }   from '@/shared/ui/atoms/Toggle'
export { default as Spinner }  from '@/shared/ui/atoms/Spinner'
export { default as Alert }    from '@/shared/ui/atoms/Alert'
export { default as Card }     from '@/shared/ui/atoms/Card'
export { default as Typography } from '@/shared/ui/atoms/Typography'

// ─── Molecules ────────────────────────────────────────────────────────────────
// Two or three atoms composed. No business logic. No API calls.
export { default as FormField }     from '@/shared/ui/molecules/FormField'
export { default as PasswordField } from '@/shared/ui/molecules/PasswordField'
export { default as SearchBar }     from '@/shared/ui/molecules/SearchBar'
export { default as PriceTag }      from '@/shared/ui/molecules/PriceTag'
export { default as RatingStars }   from '@/shared/ui/molecules/RatingStars'
export { default as QuantityInput } from '@/shared/ui/molecules/QuantityInput/QuantityInput'
export { default as Pagination }    from '@/shared/ui/molecules/Pagination'
export { default as Drawer }        from '@/shared/ui/molecules/Drawer'
export { default as Tabs }          from '@/shared/ui/molecules/Tabs'
export { default as KeyValueRow }   from '@/shared/ui/molecules/KeyValueRow/KeyValueRow'

// ─── Organisms ────────────────────────────────────────────────────────────────
export { default as PageHeader }       from '@/shared/ui/organisms/PageHeader/PageHeader'
export { default as PageLoadingState } from '@/shared/ui/organisms/PageLoadingState/PageLoadingState'
export { default as PageMessageState } from '@/shared/ui/organisms/PageMessageState/PageMessageState'