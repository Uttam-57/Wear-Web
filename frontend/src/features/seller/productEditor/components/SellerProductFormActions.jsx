import { Button } from '@/shared/ui'

export default function SellerProductFormActions({ mode, submitting, onCancel }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-sm">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button type="submit" loading={submitting}>
        {mode === 'edit' ? 'Save Changes' : 'Create Product'}
      </Button>
    </div>
  )
}
