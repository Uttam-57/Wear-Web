import { Button, Card } from '@/shared/ui'

const BLOCK_TYPE_OPTIONS = [
  { value: 'heading', label: 'Heading' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'bullets', label: 'Bullets' },
  { value: 'image', label: 'Image URL' },
  { value: 'video', label: 'Video URL' },
]

export default function SellerProductSpecificationsSection({
  templateSpecFields,
  templateLoading,
  specificationValues,
  descriptionBlocks,
  onSpecificationChange,
  onAddDescriptionBlock,
  onRemoveDescriptionBlock,
  onDescriptionBlockChange,
}) {
  return (
    <Card className="space-y-md">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Specifications and Rich Description</h2>
        <p className="text-xs text-text-secondary">Specifications come from category template to match backend validation.</p>
      </div>

      <section className="space-y-sm rounded-lg border border-border bg-surface-3/40 p-sm">
        <div className="flex items-center justify-between gap-sm">
          <p className="text-sm font-medium text-text-primary">Template Specifications</p>
          {templateLoading ? <span className="text-xs text-text-muted">Loading template...</span> : null}
        </div>

        {templateSpecFields.length === 0 ? (
          <p className="text-xs text-text-muted">No specification template found for selected category.</p>
        ) : (
          <div className="grid gap-sm md:grid-cols-2">
            {templateSpecFields.map((field) => {
              const key = String(field?.key || '').toLowerCase()
              const options = Array.isArray(field?.filterOptions) ? field.filterOptions : []

              return (
                <label key={key} className="space-y-1 text-sm text-text-secondary">
                  <span>{field?.label || key}</span>

                  {options.length ? (
                    <select
                      value={specificationValues?.[key] || ''}
                      onChange={(event) => onSpecificationChange(key, event.target.value)}
                      className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
                    >
                      <option value="">Select</option>
                      {options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={specificationValues?.[key] || ''}
                      onChange={(event) => onSpecificationChange(key, event.target.value)}
                      className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
                      placeholder={`Enter ${field?.label || key}`}
                    />
                  )}
                </label>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-sm rounded-lg border border-border bg-surface-3/40 p-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">Description Blocks</p>
          <Button size="sm" variant="secondary" onClick={onAddDescriptionBlock}>+ Add Block</Button>
        </div>

        {!descriptionBlocks.length ? (
          <p className="text-xs text-text-muted">No optional description blocks added.</p>
        ) : (
          <div className="space-y-sm">
            {descriptionBlocks.map((block, index) => (
              <div key={`block-${index}`} className="rounded-md border border-border bg-surface p-sm">
                <div className="mb-sm flex items-center justify-between gap-sm">
                  <label className="space-y-1 text-sm text-text-secondary">
                    <span>Block Type</span>
                    <select
                      value={block.type}
                      onChange={(event) => onDescriptionBlockChange(index, 'type', event.target.value)}
                      className="rounded-md border border-border bg-surface px-sm py-1.5 text-sm text-text-primary"
                    >
                      {BLOCK_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <Button size="sm" variant="ghost" onClick={() => onRemoveDescriptionBlock(index)}>
                    Remove
                  </Button>
                </div>

                {block.type === 'bullets' ? (
                  <label className="space-y-1 text-sm text-text-secondary">
                    <span>Bullet items (one per line)</span>
                    <textarea
                      value={block.itemsText || ''}
                      onChange={(event) => onDescriptionBlockChange(index, 'itemsText', event.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
                    />
                  </label>
                ) : (
                  <label className="space-y-1 text-sm text-text-secondary">
                    <span>Content</span>
                    <textarea
                      value={block.content || ''}
                      onChange={(event) => onDescriptionBlockChange(index, 'content', event.target.value)}
                      rows={block.type === 'paragraph' ? 4 : 2}
                      className="w-full rounded-md border border-border bg-surface px-sm py-2 text-sm text-text-primary"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </Card>
  )
}
