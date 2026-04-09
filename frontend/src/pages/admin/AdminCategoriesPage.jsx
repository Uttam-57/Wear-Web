import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FormField, Spinner } from '@/shared/ui'
import useAdminCategories from '@/features/category/hooks/useAdminCategories'
import { getCategoryTemplate } from '@/features/category/api/category.api'
import { getApiError } from '@/shared/services/apiClient'
import useUIStore from '@/shared/uiSlice'
import CategoryTreeNode from '@/features/category/admin/components/CategoryTreeNode'
import ImageAdjustControls from '@/features/category/admin/components/ImageAdjustControls'
import {
  buildCategoryImageStyle,
  CATEGORY_CARD_IMAGE_ASPECT_RATIO,
  CATEGORY_CARD_IMAGE_WIDTH,
  normalizeCategoryImageAdjust,
} from '@/shared/utils/categoryImageAdjust'

let specFieldIdSeed = 1
const createSpecField = () => ({ id: `spec-${specFieldIdSeed++}`, label: '', key: '', filterOptionsText: '' })

const toCsvList = (value) => {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const findCategoryById = (nodes = [], id) => {
  for (const node of nodes) {
    if (String(node._id) === String(id)) return node
    const found = findCategoryById(node.children || [], id)
    if (found) return found
  }
  return null
}

const flattenCategoryOptions = (nodes = [], level = 0) => {
  const entries = []

  nodes.forEach((node) => {
    entries.push({
      id: String(node?._id || ''),
      name: node?.name || 'Category',
      level,
    })

    entries.push(...flattenCategoryOptions(node?.children || [], level + 1))
  })

  return entries
}

const getRootCategoryOptions = (nodes = []) => {
  return (nodes || []).map((node) => ({
    id: String(node?._id || ''),
    name: node?.name || 'Category',
  }))
}

export default function AdminCategoriesPage() {
  const pushToast = useUIStore((state) => state.pushToast)
  const categoriesState = useAdminCategories()
  const refreshCategories = categoriesState.refresh

  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [expandedMap, setExpandedMap] = useState({})

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    image: '',
    commissionRate: '',
  })
  const [savingCategory, setSavingCategory] = useState(false)

  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [createCategoryForm, setCreateCategoryForm] = useState({
    name: '',
    image: '',
    rootParentId: '',
    nestedParentId: '',
    commissionRate: '',
  })

  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    sizeOptions: [],
    specFields: [createSpecField()],
  })
  const [createImagePreviewSettings, setCreateImagePreviewSettings] = useState(() => normalizeCategoryImageAdjust())
  const [selectedImagePreviewSettings, setSelectedImagePreviewSettings] = useState(() => normalizeCategoryImageAdjust())
  const [sizeInput, setSizeInput] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)

  const categories = useMemo(() => categoriesState.categories || [], [categoriesState.categories])
  const rootCategoryOptions = useMemo(() => getRootCategoryOptions(categories), [categories])
  const selectedCategory = useMemo(
    () => findCategoryById(categories, selectedCategoryId),
    [categories, selectedCategoryId]
  )
  const subParentOptions = useMemo(() => {
    if (!createCategoryForm.rootParentId) return []

    const selectedRoot = findCategoryById(categories, createCategoryForm.rootParentId)
    if (!selectedRoot) return []

    return flattenCategoryOptions(selectedRoot.children || [], 1)
  }, [categories, createCategoryForm.rootParentId])

  useEffect(() => {
    refreshCategories().catch(() => {})
  }, [refreshCategories])

  useEffect(() => {
    if (!categories.length || selectedCategoryId) return
    setSelectedCategoryId(categories[0]._id)
  }, [categories, selectedCategoryId])

  useEffect(() => {
    if (!selectedCategory) return

    setCategoryForm({
      name: selectedCategory.name || '',
      image: selectedCategory.image || '',
      commissionRate: selectedCategory.commissionRate ?? '',
    })
    setSelectedImagePreviewSettings(normalizeCategoryImageAdjust(selectedCategory.imageAdjust))

    let mounted = true
    setTemplateLoading(true)

    getCategoryTemplate(selectedCategory._id)
      .then((template) => {
        if (!mounted) return

        const nextSpecFields = Array.isArray(template?.specFields) && template.specFields.length > 0
          ? template.specFields.map((field) => ({
            id: `spec-${specFieldIdSeed++}`,
            label: field.label || '',
            key: field.key || '',
            filterOptionsText: (field.filterOptions || []).join(', '),
          }))
          : [createSpecField()]

        setTemplateForm({
          sizeOptions: Array.isArray(template?.sizeOptions) ? template.sizeOptions : [],
          specFields: nextSpecFields,
        })
      })
      .catch(() => {
        if (!mounted) return
        setTemplateForm({ sizeOptions: [], specFields: [createSpecField()] })
      })
      .finally(() => {
        if (mounted) setTemplateLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [selectedCategory])

  const toggleNode = (id) => {
    setExpandedMap((previous) => ({
      ...previous,
      [id]: !previous[id],
    }))
  }

  const updateSpecField = (index, key, value) => {
    setTemplateForm((previous) => {
      const nextFields = [...previous.specFields]
      nextFields[index] = { ...nextFields[index], [key]: value }
      return { ...previous, specFields: nextFields }
    })
  }

  const addSizeOption = () => {
    const value = String(sizeInput || '').trim()
    if (!value) return

    setTemplateForm((previous) => {
      if (previous.sizeOptions.includes(value)) return previous
      return { ...previous, sizeOptions: [...previous.sizeOptions, value] }
    })
    setSizeInput('')
  }

  const removeSizeOption = (size) => {
    setTemplateForm((previous) => ({
      ...previous,
      sizeOptions: previous.sizeOptions.filter((item) => item !== size),
    }))
  }

  const addSpecField = () => {
    setTemplateForm((previous) => ({
      ...previous,
      specFields: [...previous.specFields, createSpecField()],
    }))
  }

  const removeSpecField = (index) => {
    setTemplateForm((previous) => {
      if (previous.specFields.length === 1) return previous
      return {
        ...previous,
        specFields: previous.specFields.filter((_, idx) => idx !== index),
      }
    })
  }

  const saveCategoryInfo = async () => {
    if (!selectedCategory?._id) return

    setSavingCategory(true)
    try {
      await categoriesState.updateCategory(selectedCategory._id, {
        name: categoryForm.name,
        image: categoryForm.image,
        commissionRate: categoryForm.commissionRate === '' ? null : Number(categoryForm.commissionRate),
        imageAdjust: normalizeCategoryImageAdjust(selectedImagePreviewSettings),
      })

      await categoriesState.refresh()
      pushToast({ type: 'success', title: 'Category updated', message: 'Category information has been saved.' })
    } catch (error) {
      pushToast({ type: 'danger', title: 'Update failed', message: getApiError(error, 'Unable to update category.') })
    } finally {
      setSavingCategory(false)
    }
  }

  const blockSelectedCategory = async () => {
    if (!selectedCategory?._id) return

    try {
      await categoriesState.blockCategories([selectedCategory._id])
      await categoriesState.refresh()
      setSelectedCategoryId('')
      pushToast({ type: 'success', title: 'Category blocked', message: 'Category has been blocked successfully.' })
    } catch (error) {
      pushToast({ type: 'danger', title: 'Block failed', message: getApiError(error, 'Unable to block category.') })
    }
  }

  const saveTemplate = async () => {
    if (!selectedCategory?._id) return

    const payload = {
      sizeOptions: templateForm.sizeOptions,
      specFields: templateForm.specFields
        .map((field) => ({
          label: String(field.label || '').trim(),
          key: String(field.key || '').trim().toLowerCase(),
          filterOptions: toCsvList(field.filterOptionsText),
        }))
        .filter((field) => field.label && field.key),
    }

    setSavingTemplate(true)
    try {
      await categoriesState.setCategoryTemplate(selectedCategory._id, payload)
      pushToast({ type: 'success', title: 'Template saved', message: 'Category template updated successfully.' })
    } catch (error) {
      pushToast({ type: 'danger', title: 'Template save failed', message: getApiError(error, 'Unable to save category template.') })
    } finally {
      setSavingTemplate(false)
    }
  }

  const openCreatePanel = () => {
    setCreateCategoryForm({
      name: '',
      image: '',
      rootParentId: '',
      nestedParentId: '',
      commissionRate: '',
    })
    setCreateImagePreviewSettings(normalizeCategoryImageAdjust())
    setShowCreatePanel(true)
  }

  const closeCreatePanel = () => {
    if (creatingCategory) return
    setShowCreatePanel(false)
  }

  const createNewCategory = async () => {
    const payload = {
      name: String(createCategoryForm.name || '').trim(),
      image: String(createCategoryForm.image || '').trim(),
      parentId: createCategoryForm.nestedParentId || createCategoryForm.rootParentId || null,
      commissionRate: createCategoryForm.commissionRate === '' ? null : Number(createCategoryForm.commissionRate),
      imageAdjust: normalizeCategoryImageAdjust(createImagePreviewSettings),
    }

    if (!payload.name || !payload.image) {
      pushToast({ type: 'warning', title: 'Missing fields', message: 'Category name and image URL are required.' })
      return
    }

    setCreatingCategory(true)
    try {
      const created = await categoriesState.createCategory(payload)
      await categoriesState.refresh()
      if (created?._id) setSelectedCategoryId(String(created._id))
      setShowCreatePanel(false)
      pushToast({ type: 'success', title: 'Category created', message: 'New category has been created successfully.' })
    } catch (error) {
      pushToast({ type: 'danger', title: 'Create failed', message: getApiError(error, 'Unable to create category.') })
    } finally {
      setCreatingCategory(false)
    }
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="section-title">Category Management</h1>
          <p className="section-subtitle">Manage category tree, commission, and product templates.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={openCreatePanel}>Add New Category</Button>
          <Button onClick={() => categoriesState.refresh()}>Refresh Categories</Button>
        </div>
      </div>

      {showCreatePanel ? (
        <Card className="space-y-sm">
          <div className="flex items-start justify-between gap-sm">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Create Category</h2>
              <p className="text-sm text-text-secondary">Create a root category or choose a parent to create a nested subcategory.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={closeCreatePanel}>Close</Button>
          </div>

          <div className="grid gap-sm md:grid-cols-2">
            <FormField
              label="Category Name"
              value={createCategoryForm.name}
              onChange={(event) => setCreateCategoryForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Example: Shirts"
            />

            <FormField
              label="Commission Rate (%)"
              type="number"
              value={createCategoryForm.commissionRate}
              onChange={(event) => setCreateCategoryForm((previous) => ({ ...previous, commissionRate: event.target.value }))}
              placeholder="Optional"
            />
          </div>

          <FormField
            label="Category Image URL"
            value={createCategoryForm.image}
            onChange={(event) => setCreateCategoryForm((previous) => ({ ...previous, image: event.target.value }))}
            placeholder="https://..."
          />

          {createCategoryForm.image ? (
            <div className="space-y-2">
              <ImageAdjustControls
                settings={createImagePreviewSettings}
                onChange={setCreateImagePreviewSettings}
                onReset={() => setCreateImagePreviewSettings(normalizeCategoryImageAdjust())}
              />

              <div
                className="overflow-hidden rounded-md border border-border bg-surface-3"
                style={{ width: `${CATEGORY_CARD_IMAGE_WIDTH}px`, aspectRatio: CATEGORY_CARD_IMAGE_ASPECT_RATIO }}
              >
              <img
                src={createCategoryForm.image}
                alt="New category preview"
                className="h-full w-full transition-transform duration-150"
                style={buildCategoryImageStyle(createImagePreviewSettings)}
              />
            </div>
            </div>
          ) : null}

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Parent Root Category (Optional)</span>
            <select
              value={createCategoryForm.rootParentId}
              onChange={(event) => {
                const nextRootId = event.target.value
                setCreateCategoryForm((previous) => ({
                  ...previous,
                  rootParentId: nextRootId,
                  nestedParentId: '',
                }))
              }}
              className="h-[42px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm"
            >
              <option value="">No Parent (Create Root Category)</option>
              {rootCategoryOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </label>

          {createCategoryForm.rootParentId && subParentOptions.length > 0 ? (
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Subcategory Parent (Optional)</span>
              <select
                value={createCategoryForm.nestedParentId}
                onChange={(event) => setCreateCategoryForm((previous) => ({ ...previous, nestedParentId: event.target.value }))}
                className="h-[42px] w-full rounded-md border border-border bg-surface-elevated px-sm text-sm"
              >
                <option value="">No Sub Parent (Attach to selected root)</option>
                {subParentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${'- '.repeat(option.level - 1)}${option.name}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="flex justify-end">
            <Button loading={creatingCategory} onClick={createNewCategory}>Create Category</Button>
          </div>
        </Card>
      ) : null}

      {categoriesState.loading ? (
        <div className="flex justify-center py-2xl"><Spinner /></div>
      ) : (
        <div className="grid gap-md xl:grid-cols-[360px,1fr]">
          <Card className="space-y-sm">
            <h2 className="text-sm font-semibold text-text-primary">Category Tree</h2>

            {categories.length === 0 ? (
              <p className="text-sm text-text-secondary">No categories found.</p>
            ) : (
              <div className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
                {categories.map((node) => (
                  <CategoryTreeNode
                    key={node._id}
                    node={node}
                    selectedId={selectedCategoryId}
                    expandedMap={expandedMap}
                    onToggle={toggleNode}
                    onSelect={setSelectedCategoryId}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-md">
            {!selectedCategory ? (
              <p className="text-sm text-text-secondary">Select a category from the tree to view details and edit template.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-text-muted">Selected Category</p>
                  <h2 className="text-xl font-semibold text-text-primary">{selectedCategory.name}</h2>
                  <p className="text-sm text-text-secondary">Status: {selectedCategory.status || 'active'}</p>
                </div>

                <div className="grid gap-sm md:grid-cols-2">
                  <FormField
                    label="Category Name"
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm((previous) => ({ ...previous, name: event.target.value }))}
                  />
                  <FormField
                    label="Commission Rate (%)"
                    type="number"
                    value={categoryForm.commissionRate}
                    onChange={(event) => setCategoryForm((previous) => ({ ...previous, commissionRate: event.target.value }))}
                  />
                </div>

                <FormField
                  label="Category Image URL"
                  value={categoryForm.image}
                  onChange={(event) => setCategoryForm((previous) => ({ ...previous, image: event.target.value }))}
                />

                {categoryForm.image ? (
                  <div className="space-y-2">
                    <ImageAdjustControls
                      settings={selectedImagePreviewSettings}
                      onChange={setSelectedImagePreviewSettings}
                      onReset={() => setSelectedImagePreviewSettings(normalizeCategoryImageAdjust())}
                    />

                    <div
                      className="overflow-hidden rounded-md border border-border bg-surface-3"
                      style={{ width: `${CATEGORY_CARD_IMAGE_WIDTH}px`, aspectRatio: CATEGORY_CARD_IMAGE_ASPECT_RATIO }}
                    >
                    <img
                      src={categoryForm.image}
                      alt={`${selectedCategory.name} preview`}
                      className="h-full w-full transition-transform duration-150"
                      style={buildCategoryImageStyle(selectedImagePreviewSettings)}
                    />
                  </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" loading={savingCategory} onClick={saveCategoryInfo}>Edit Info</Button>
                  <Button variant="danger" onClick={blockSelectedCategory}>Block or Hide</Button>
                </div>

                <div className="border-t border-border pt-md">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Product Template (Required Specs)</p>
                    <h3 className="text-base font-semibold text-text-primary">Template Builder</h3>
                  </div>

                  {templateLoading ? (
                    <div className="flex justify-center py-lg"><Spinner /></div>
                  ) : (
                    <div className="mt-sm space-y-md">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-text-primary">Allowed Sizes</p>
                        <div className="flex flex-wrap gap-2">
                          {templateForm.sizeOptions.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => removeSizeOption(size)}
                              className="rounded-full border border-border bg-surface-3 px-sm py-1 text-xs text-text-primary"
                              title="Remove size option"
                            >
                              {size} x
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input
                            value={sizeInput}
                            onChange={(event) => setSizeInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                addSizeOption()
                              }
                            }}
                            className="h-[42px] flex-1 rounded-md border border-border bg-surface-elevated px-sm text-sm"
                            placeholder="Add size (example: XXL)"
                          />
                          <Button type="button" variant="secondary" onClick={addSizeOption}>Add Size</Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-text-primary">Required Specifications</p>
                        {templateForm.specFields.map((field, index) => (
                          <div key={field.id} className="rounded-md border border-border bg-surface-3 p-sm space-y-2">
                            <div className="grid gap-sm md:grid-cols-2">
                              <FormField
                                label="Label"
                                value={field.label}
                                onChange={(event) => updateSpecField(index, 'label', event.target.value)}
                                placeholder="Material"
                              />
                              <FormField
                                label="Key"
                                value={field.key}
                                onChange={(event) => updateSpecField(index, 'key', event.target.value)}
                                placeholder="material"
                              />
                            </div>
                            <FormField
                              label="Allowed Options (comma separated)"
                              value={field.filterOptionsText}
                              onChange={(event) => updateSpecField(index, 'filterOptionsText', event.target.value)}
                              placeholder="Cotton, Linen, Polyester"
                            />
                            <div className="flex justify-end">
                              <Button size="sm" variant="ghost" onClick={() => removeSpecField(index)}>Remove Field</Button>
                            </div>
                          </div>
                        ))}

                        <Button type="button" variant="secondary" size="sm" onClick={addSpecField}>Add Spec Field</Button>
                      </div>

                      <div className="flex justify-end">
                        <Button loading={savingTemplate} onClick={saveTemplate}>Save Template</Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
