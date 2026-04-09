import { Alert, Spinner } from '@/shared/ui'
import SellerProductCategorySection from '@/features/seller/productEditor/components/SellerProductCategorySection'
import SellerProductCoreSection from '@/features/seller/productEditor/components/SellerProductCoreSection'
import SellerProductMediaSection from '@/features/seller/productEditor/components/SellerProductMediaSection'
import SellerProductVariantsSection from '@/features/seller/productEditor/components/SellerProductVariantsSection'
import SellerProductSpecificationsSection from '@/features/seller/productEditor/components/SellerProductSpecificationsSection'
import SellerProductAdvancedSection from '@/features/seller/productEditor/components/SellerProductAdvancedSection'
import SellerProductFormActions from '@/features/seller/productEditor/components/SellerProductFormActions'

export default function SellerProductEditorForm({ state }) {
  if (!state.hasOwnerAccess) {
    return <Alert variant="warning">Only the store owner can manage products on this route.</Alert>
  }

  if (state.loading) {
    return <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
  }

  return (
    <form className="space-y-md" onSubmit={state.handleSubmit}>
      {state.error ? <Alert>{state.error}</Alert> : null}

      <SellerProductCategorySection
        rootCategoryOptions={state.rootCategoryOptions}
        subCategoryOptions={state.subCategoryOptions}
        rootCategoryId={state.form.rootCategoryId}
        subCategoryId={state.form.subCategoryId}
        onRootChange={state.handleRootCategoryChange}
        onSubChange={state.handleSubCategoryChange}
        categoryError={state.errors.categoryId}
      />

      <SellerProductCoreSection
        form={state.form}
        errors={state.errors}
        onFieldChange={state.updateField}
      />

      <SellerProductMediaSection
        images={state.form.images || []}
        colorImageMap={state.form.colorImageMap || {}}
        variants={state.form.variants || []}
        uploading={state.uploading}
        imageError={state.errors.images}
        onUploadPrimary={state.uploadPrimaryImages}
        onRemovePrimary={state.removePrimaryImage}
        onToggleColorUsePrimary={state.setColorImageUsePrimary}
        onUploadColor={state.uploadColorImages}
        onRemoveColor={state.removeColorImage}
      />

      <SellerProductVariantsSection
        variants={state.form.variants || []}
        variantError={state.errors.variants}
        sizeOptions={state.templateSizeOptions}
        onAddVariant={state.addVariant}
        onRemoveVariant={state.removeVariant}
        onVariantChange={state.updateVariantField}
        onToggleVariantSize={state.toggleVariantSize}
      />

      <SellerProductSpecificationsSection
        templateSpecFields={state.templateSpecFields}
        templateLoading={state.templateLoading}
        specificationValues={state.form.specificationValues || {}}
        descriptionBlocks={state.form.descriptionBlocks || []}
        onSpecificationChange={state.updateSpecificationValue}
        onAddDescriptionBlock={state.addDescriptionBlock}
        onRemoveDescriptionBlock={state.removeDescriptionBlock}
        onDescriptionBlockChange={state.updateDescriptionBlock}
      />

      <SellerProductAdvancedSection
        form={state.form}
        onFieldChange={state.updateField}
      />

      <SellerProductFormActions
        mode={state.mode}
        submitting={state.submitting}
        onCancel={state.onCancel}
      />
    </form>
  )
}
