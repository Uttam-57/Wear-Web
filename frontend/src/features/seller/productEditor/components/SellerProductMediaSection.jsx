import { Button, Card } from '@/shared/ui'

const formatColorLabel = (value) => String(value || '').trim() || 'Unnamed color'

export default function SellerProductMediaSection({
  images,
  colorImageMap,
  variants,
  uploading,
  imageError,
  onUploadPrimary,
  onRemovePrimary,
  onToggleColorUsePrimary,
  onUploadColor,
  onRemoveColor,
}) {
  const colorNames = Array.from(
    new Set((variants || []).map((item) => String(item?.colorName || '').trim()).filter(Boolean))
  )

  return (
    <Card className="space-y-md">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Media</h2>
        <p className="text-xs text-text-secondary">Upload primary images (1-5) and optional color-specific overrides.</p>
      </div>

      <section className="space-y-sm rounded-lg border border-border bg-surface-3/40 p-sm">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <p className="text-sm font-medium text-text-primary">Primary Images ({images.length}/5)</p>
          <label className="inline-flex cursor-pointer items-center rounded-md border border-border bg-surface px-sm py-1.5 text-xs font-medium text-text-primary hover:bg-surface-elevated">
            Upload images
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || images.length >= 5}
              onChange={(event) => {
                onUploadPrimary(event.target.files)
                event.target.value = ''
              }}
              className="hidden"
            />
          </label>
        </div>

        {imageError ? <p className="text-xs text-danger">{imageError}</p> : null}

        {images.length ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {images.map((image, index) => (
              <div key={`${image?.url || 'img'}-${index}`} className="space-y-1 rounded-md border border-border bg-surface p-2">
                <img src={image?.url} alt={`Primary ${index + 1}`} className="h-24 w-full rounded object-cover" />
                <Button size="sm" variant="ghost" onClick={() => onRemovePrimary(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted">No primary images selected yet.</p>
        )}
      </section>

      {colorNames.length ? (
        <section className="space-y-sm rounded-lg border border-border bg-surface-3/40 p-sm">
          <p className="text-sm font-medium text-text-primary">Color Images (optional)</p>

          <div className="space-y-sm">
            {colorNames.map((colorName) => {
              const entry = colorImageMap?.[colorName] || { usePrimary: true, images: [] }

              return (
                <div key={colorName} className="rounded-md border border-border bg-surface p-sm">
                  <div className="flex flex-wrap items-center justify-between gap-sm">
                    <p className="text-sm font-medium text-text-primary">{formatColorLabel(colorName)}</p>

                    <label className="flex items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={entry.usePrimary}
                        onChange={(event) => onToggleColorUsePrimary(colorName, event.target.checked)}
                      />
                      Use primary images
                    </label>
                  </div>

                  {!entry.usePrimary ? (
                    <div className="mt-sm space-y-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-secondary">Custom images ({entry.images.length}/3)</p>
                        <label className="inline-flex cursor-pointer items-center rounded-md border border-border bg-surface px-sm py-1 text-xs font-medium text-text-primary hover:bg-surface-elevated">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={uploading || entry.images.length >= 3}
                            onChange={(event) => {
                              onUploadColor(colorName, event.target.files)
                              event.target.value = ''
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {entry.images.length ? (
                        <div className="grid gap-2 sm:grid-cols-3">
                          {entry.images.map((image, index) => (
                            <div key={`${image?.url || 'cimg'}-${index}`} className="rounded-md border border-border bg-surface p-2">
                              <img src={image?.url} alt={`${colorName} ${index + 1}`} className="h-20 w-full rounded object-cover" />
                              <Button size="sm" variant="ghost" className="mt-1" onClick={() => onRemoveColor(colorName, index)}>
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted">Upload 1-3 images when primary images do not match this color.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </Card>
  )
}
