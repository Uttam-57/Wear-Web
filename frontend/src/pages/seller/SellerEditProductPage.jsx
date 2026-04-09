import SellerProductEditorHeader from '@/features/seller/productEditor/components/SellerProductEditorHeader'
import SellerProductEditorForm from '@/features/seller/productEditor/components/SellerProductEditorForm'
import useSellerProductEditorPage from '@/features/seller/productEditor/hooks/useSellerProductEditorPage'

export default function SellerEditProductPage() {
  const state = useSellerProductEditorPage('edit')

  return (
    <div className="space-y-md">
      <SellerProductEditorHeader mode="edit" storeRoute={state.storeRoute} />
      <SellerProductEditorForm state={state} />
    </div>
  )
}
