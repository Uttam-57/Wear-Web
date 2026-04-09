import { Alert, Button, Card, Checkbox, FormField, Label, Spinner, Toggle } from '@/shared/ui'
import { formatBytes } from '@/shared/utils/formatters'
import useSellerProfileSetupPage from '@/features/seller/hooks/useSellerProfileSetupPage'
import { MAX_PROOF_FILES, STEP_ITEMS } from '@/features/seller/profileSetup/constants'

export default function SellerProfileSetupPage() {
  const {
    addProofFiles,
    categoryLabelMap,
    categoryPickerOpen,
    categorySearch,
    checkingProfile,
    errors,
    fileErrors,
    fileInputRef,
    filteredCategories,
    form,
    furthestStep,
    handleBack,
    handleBankToggle,
    handleFieldBlur,
    handleLogout,
    handleNext,
    handleProofDrop,
    handleSubmit,
    isDragActive,
    loadingCategories,
    mode,
    profileError,
    proofFiles,
    setCategoryPickerOpen,
    setCategorySearch,
    setIsDragActive,
    setProofFiles,
    setStep,
    setTouched,
    step,
    submitError,
    submitting,
    totalProofCount,
    touched,
    updateFormField,
  } = useSellerProfileSetupPage()
if (checkingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface-elevated/90 backdrop-blur">
        <div className="page-shell flex items-center justify-between py-md">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Wear Web</p>
            <p className="text-sm font-semibold text-text-primary">Seller Setup Wizard</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      <main className="page-shell py-xl">
        <section className="mx-auto max-w-4xl space-y-lg">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Welcome to WearWeb Seller Hub</p>
            <h1 className="mt-2 text-3xl font-display text-text-primary">Let us set up your seller profile.</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-text-secondary">
              Complete these three steps to unlock your seller dashboard. You can logout any time and resume where you left off.
            </p>
            <p className="mt-1 text-xs text-text-muted">Mode: {mode === 'update' ? 'Edit existing profile' : 'First-time setup'}</p>
          </div>

          <div className="grid gap-sm md:grid-cols-3">
            {STEP_ITEMS.map((item) => {
              const isActive = step === item.id
              const isDone = item.id < step
              const canOpen = item.id <= furthestStep

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!canOpen}
                  onClick={() => setStep(item.id)}
                  className={[
                    'rounded-lg border px-md py-sm text-left transition',
                    isActive ? 'border-primary bg-primary-soft/50' : 'border-border bg-surface-elevated',
                    isDone ? 'border-success/40 bg-success-soft/50' : '',
                    !canOpen ? 'cursor-not-allowed opacity-60' : 'hover:border-border-strong',
                  ].join(' ')}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Step {item.id}</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-secondary">{item.subtitle}</p>
                </button>
              )
            })}
          </div>

          {profileError ? <Alert>{profileError}</Alert> : null}
          {submitError ? <Alert>{submitError}</Alert> : null}

          <Card className="space-y-md">
            <form className="space-y-md" onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="space-y-md animate-fade-up">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">Step 1: Store & Contact Details</h2>
                    <p className="text-sm text-text-secondary">Provide your business identity and support contact details.</p>
                  </div>

                  <div className="grid gap-md md:grid-cols-2">
                    <FormField
                      label="Company / Store Name"
                      required
                      value={form.companyName}
                      error={touched.companyName ? errors.companyName : ''}
                      onBlur={() => handleFieldBlur('companyName')}
                      onChange={(event) => updateFormField('companyName', event.target.value)}
                      placeholder="TechWear Fashion Store"
                    />

                    <FormField
                      label="Owner Full Name"
                      required
                      value={form.ownerName}
                      error={touched.ownerName ? errors.ownerName : ''}
                      onBlur={() => handleFieldBlur('ownerName')}
                      onChange={(event) => updateFormField('ownerName', event.target.value)}
                      placeholder="John Doe"
                    />

                    <div>
                      <FormField
                        label="Business Email"
                        required
                        type="email"
                        value={form.companyEmail}
                        error={touched.companyEmail ? errors.companyEmail : ''}
                        onBlur={() => handleFieldBlur('companyEmail')}
                        onChange={(event) => updateFormField('companyEmail', event.target.value)}
                        placeholder="contact@techwear.com"
                      />
                      <p className="mt-1 text-xs text-text-muted">Used for customer support and approval notifications.</p>
                    </div>

                    <div>
                      <FormField
                        label="Business Phone"
                        required
                        value={form.companyPhone}
                        error={touched.companyPhone ? errors.companyPhone : ''}
                        onBlur={() => handleFieldBlur('companyPhone')}
                        onChange={(event) => updateFormField('companyPhone', event.target.value)}
                        placeholder="+919876543210"
                      />
                      <p className="mt-1 text-xs text-text-muted">Use international format with country code.</p>
                    </div>
                  </div>

                  <FormField
                    label="Store Website (Optional)"
                    value={form.website}
                    error={touched.website ? errors.website : ''}
                    onBlur={() => handleFieldBlur('website')}
                    onChange={(event) => updateFormField('website', event.target.value)}
                    placeholder="https://techwear.com"
                  />

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleNext}>Next Step</Button>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-md animate-fade-up">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">Step 2: Business Identity & Verification</h2>
                    <p className="text-sm text-text-secondary">Add location, categories, GST (optional), and company proof documents.</p>
                  </div>

                  <div className="grid gap-md md:grid-cols-2">
                    <FormField
                      label="Country"
                      required
                      value={form.locationCountry}
                      error={touched.locationCountry ? errors.locationCountry : ''}
                      onBlur={() => handleFieldBlur('locationCountry')}
                      onChange={(event) => updateFormField('locationCountry', event.target.value)}
                      placeholder="India"
                    />

                    <FormField
                      label="State"
                      required
                      value={form.locationState}
                      error={touched.locationState ? errors.locationState : ''}
                      onBlur={() => handleFieldBlur('locationState')}
                      onChange={(event) => updateFormField('locationState', event.target.value)}
                      placeholder="Maharashtra"
                    />

                    <FormField
                      label="District"
                      required
                      value={form.locationDistrict}
                      error={touched.locationDistrict ? errors.locationDistrict : ''}
                      onBlur={() => handleFieldBlur('locationDistrict')}
                      onChange={(event) => updateFormField('locationDistrict', event.target.value)}
                      placeholder="Mumbai"
                    />

                    <FormField
                      label="GST Number (Optional)"
                      value={form.gstNumber}
                      error={touched.gstNumber ? errors.gstNumber : ''}
                      onBlur={() => handleFieldBlur('gstNumber')}
                      onChange={(event) => updateFormField('gstNumber', event.target.value.toUpperCase())}
                      placeholder="27AAAAA0000A1Z5"
                    />
                  </div>

                  <div className="flex flex-col gap-xs">
                    <Label htmlFor="locationAddressLine" required>Business Address</Label>
                    <textarea
                      id="locationAddressLine"
                      value={form.locationAddressLine}
                      onBlur={() => handleFieldBlur('locationAddressLine')}
                      onChange={(event) => updateFormField('locationAddressLine', event.target.value)}
                      placeholder="123 Fashion Street, Tech Park, Mumbai, 400001"
                      className={[
                        'min-h-24 w-full rounded-md border bg-surface-elevated px-md py-2 text-sm text-text-primary shadow-soft',
                        errors.locationAddressLine && touched.locationAddressLine ? 'border-danger' : 'border-border hover:border-border-strong',
                        'focus-visible:outline-none focus-visible:shadow-focus',
                      ].join(' ')}
                    />
                    {touched.locationAddressLine && errors.locationAddressLine ? (
                      <p className="text-xs text-danger">{errors.locationAddressLine}</p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-border bg-surface-3/40 p-md">
                    <div className="flex items-start justify-between gap-sm">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Major Categories (Optional)</p>
                        <p className="text-xs text-text-secondary">Choose categories relevant to your store.</p>
                      </div>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setCategoryPickerOpen((prev) => !prev)}>
                        {categoryPickerOpen ? 'Hide' : 'Select Categories'}
                      </Button>
                    </div>

                    <div className="mt-sm flex flex-wrap gap-2">
                      {form.majorCategories.length ? form.majorCategories.map((categoryId) => (
                        <span key={categoryId} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-elevated px-sm py-1 text-xs text-text-primary">
                          <span>{categoryLabelMap[categoryId] || categoryId}</span>
                          <button
                            type="button"
                            onClick={() => {
                              updateFormField('majorCategories', form.majorCategories.filter((id) => id !== categoryId))
                            }}
                            className="rounded px-1 text-text-muted hover:text-text-primary"
                            aria-label="Remove category"
                          >
                            x
                          </button>
                        </span>
                      )) : (
                        <p className="text-xs text-text-muted">No categories selected</p>
                      )}
                    </div>

                    {categoryPickerOpen ? (
                      <div className="mt-sm rounded-md border border-border bg-surface-elevated p-sm">
                        <FormField
                          label="Search category"
                          value={categorySearch}
                          onChange={(event) => setCategorySearch(event.target.value)}
                          placeholder="Type category name"
                        />
                        <div className="mt-sm max-h-52 space-y-2 overflow-y-auto pr-1">
                          {loadingCategories ? (
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <Spinner size="sm" />
                              <span>Loading categories...</span>
                            </div>
                          ) : null}

                          {!loadingCategories && filteredCategories.length === 0 ? (
                            <p className="text-xs text-text-muted">No categories found.</p>
                          ) : null}

                          {!loadingCategories ? filteredCategories.map((category) => (
                            <Checkbox
                              key={category.id}
                              id={`category-${category.id}`}
                              label={category.label}
                              checked={form.majorCategories.includes(category.id)}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  updateFormField('majorCategories', [...form.majorCategories, category.id])
                                } else {
                                  updateFormField('majorCategories', form.majorCategories.filter((id) => id !== category.id))
                                }
                              }}
                              className="w-full rounded-md border border-border bg-surface px-sm py-2"
                            />
                          )) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-xs">
                    <Label required>Company Proof Documents</Label>
                    <p className="text-xs text-text-secondary">Upload 1 to 5 images. Accepted: JPEG, PNG, WEBP, GIF (max 5MB each).</p>

                    <div
                      className={[
                        'rounded-lg border-2 border-dashed p-lg text-center transition',
                        isDragActive ? 'border-primary bg-primary-soft/40' : 'border-border bg-surface-3/30',
                        errors.companyProof ? 'border-danger' : '',
                      ].join(' ')}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setIsDragActive(true)
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault()
                        setIsDragActive(false)
                      }}
                      onDrop={handleProofDrop}
                    >
                      <p className="text-sm text-text-primary">Drag and drop proof files here</p>
                      <p className="mt-1 text-xs text-text-muted">or choose files manually</p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(event) => {
                          addProofFiles(event.target.files)
                          event.target.value = ''
                        }}
                      />

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="mt-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={totalProofCount >= MAX_PROOF_FILES}
                      >
                        Browse Files
                      </Button>
                    </div>

                    {touched.companyProof && errors.companyProof ? <p className="text-xs text-danger">{errors.companyProof}</p> : null}

                    <div className="space-y-2">
                      {form.existingProofUrls.map((proofUrl, index) => (
                        <div key={`existing-proof-${proofUrl}-${index}`} className="flex items-center justify-between rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm">
                          <span className="truncate text-text-secondary">Existing proof {index + 1}</span>
                          <button
                            type="button"
                            className="rounded px-2 py-1 text-xs text-danger hover:bg-danger-soft"
                            onClick={() => {
                              updateFormField(
                                'existingProofUrls',
                                form.existingProofUrls.filter((_, targetIndex) => targetIndex !== index)
                              )
                              setTouched((prev) => ({ ...prev, companyProof: true }))
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {proofFiles.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm">
                          <span className="truncate text-text-secondary">{item.file.name} ({formatBytes(item.file.size)})</span>
                          <button
                            type="button"
                            className="rounded px-2 py-1 text-xs text-danger hover:bg-danger-soft"
                            onClick={() => {
                              setProofFiles((prev) => prev.filter((entry) => entry.id !== item.id))
                              setTouched((prev) => ({ ...prev, companyProof: true }))
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {fileErrors.map((message) => (
                        <p key={message} className="text-xs text-danger">{message}</p>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="secondary" onClick={handleBack}>Back</Button>
                    <Button type="button" onClick={handleNext}>Next Step</Button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-md animate-fade-up">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">Step 3: Bank Details for Payouts</h2>
                    <p className="text-sm text-text-secondary">You can submit without bank details, or provide all fields together.</p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-surface-3/40 px-md py-sm">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Add bank details now?</p>
                      <p className="text-xs text-text-secondary">If enabled, all bank fields become mandatory.</p>
                    </div>
                    <Toggle checked={form.bankToggle} onChange={(event) => handleBankToggle(event.target.checked)} />
                  </div>

                  {form.bankToggle ? (
                    <div className="grid gap-md md:grid-cols-2">
                      <FormField
                        label="Account Holder Name"
                        required
                        value={form.accountHolderName}
                        error={touched.accountHolderName ? errors.accountHolderName : ''}
                        onBlur={() => handleFieldBlur('accountHolderName')}
                        onChange={(event) => updateFormField('accountHolderName', event.target.value)}
                        placeholder="TechWear Fashion Pvt Ltd"
                        className="md:col-span-2"
                      />

                      <FormField
                        label="Account Number"
                        required
                        value={form.accountNumber}
                        error={touched.accountNumber ? errors.accountNumber : ''}
                        onBlur={() => handleFieldBlur('accountNumber')}
                        onChange={(event) => updateFormField('accountNumber', event.target.value)}
                        placeholder="123456789012345"
                      />

                      <FormField
                        label="IFSC Code"
                        required
                        value={form.ifscCode}
                        error={touched.ifscCode ? errors.ifscCode : ''}
                        onBlur={() => handleFieldBlur('ifscCode')}
                        onChange={(event) => updateFormField('ifscCode', event.target.value.toUpperCase())}
                        placeholder="HDFC0001234"
                      />
                    </div>
                  ) : (
                    <Alert variant="info">Bank details were skipped. You can add them later from seller settings.</Alert>
                  )}

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="secondary" onClick={handleBack}>Back</Button>
                    <Button type="submit" loading={submitting}>
                      {mode === 'update' ? 'Update Profile' : 'Submit Profile'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </form>
          </Card>
        </section>
      </main>
    </div>
  )
}
