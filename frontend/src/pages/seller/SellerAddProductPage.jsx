import SellerProductEditorHeader from '@/features/seller/productEditor/components/SellerProductEditorHeader'
import SellerProductEditorForm from '@/features/seller/productEditor/components/SellerProductEditorForm'
import useSellerProductEditorPage from '@/features/seller/productEditor/hooks/useSellerProductEditorPage'

export default function SellerAddProductPage() {
  const state = useSellerProductEditorPage('create')

  return (
    <div className="space-y-md">
      <SellerProductEditorHeader mode="create" storeRoute={state.storeRoute} />
      <SellerProductEditorForm state={state} />
    </div>
  )
}
