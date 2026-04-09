import { Button } from '@/shared/ui'

export default function ImageAdjustControls({ settings, onChange, onReset }) {
  const setValue = (key, value) => {
    onChange((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
      <label className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Image Fit</span>
        <select
          value={settings.fit}
          onChange={(event) => setValue('fit', event.target.value)}
          className="h-[34px] rounded-md border border-border bg-surface-elevated px-sm text-xs"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
        </select>
      </label>

        <Button type="button" size="sm" variant="ghost" onClick={onReset}>Reset</Button>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Position X ({settings.positionX}%)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={settings.positionX}
            onChange={(event) => setValue('positionX', Number(event.target.value))}
            className="w-full"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Position Y ({settings.positionY}%)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={settings.positionY}
            onChange={(event) => setValue('positionY', Number(event.target.value))}
            className="w-full"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Zoom ({settings.zoom}%)</span>
          <input
            type="range"
            min="100"
            max="200"
            step="5"
            value={settings.zoom}
            onChange={(event) => setValue('zoom', Number(event.target.value))}
            className="w-full"
          />
        </label>
      </div>
    </div>
  )
}
