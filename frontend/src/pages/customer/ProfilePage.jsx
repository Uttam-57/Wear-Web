import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Avatar, Badge, Button, Card, FormField, PasswordField, Spinner } from '@/shared/ui'
import { ROUTES } from '@/shared/constants/routes'
import { formatDate, formatDateTime } from '@/shared/utils/formatters'
import useAuthStore from '@/features/auth/authSlice'
import useProfile from '@/features/user/hooks/useProfile'

const FALLBACK_AVATAR_URL = 'https://res.cloudinary.com/wearweb/image/upload/v1/wearweb/defaults/avatar.png'

const buildFormFromProfile = (profile) => ({
  firstName: profile?.firstName || '',
  lastName: profile?.lastName || '',
  middleName: profile?.middleName || '',
  email: profile?.email || '',
  phone: profile?.phone || '',
})

const formatRoleLabel = (role) => {
  const value = String(role || '').toLowerCase()
  if (!value) return 'User'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const formatStatusLabel = (status) => {
  const value = String(status || '').toLowerCase()
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

const getProfileName = (profile, form) => {
  const first = String(form?.firstName || profile?.firstName || '').trim()
  const middle = String(form?.middleName || profile?.middleName || '').trim()
  const last = String(form?.lastName || profile?.lastName || '').trim()
  const full = [first, middle, last].filter(Boolean).join(' ').trim()
  if (full) return full
  return 'Wear Web User'
}

const ProfileDatum = ({ label, value }) => {
  return (
    <div className="rounded-lg border border-border/80 bg-surface-tertiary/50 px-md py-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary break-words">{value || '-'}</p>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { profile, loading, error, refresh, saveProfile, savePhoto, updatePassword, deleteMyAccount } = useProfile()

  const [form, setForm] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoSubmitting, setPhotoSubmitting] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [deleteForm, setDeleteForm] = useState({ currentPassword: '', confirmText: '', acknowledge: false })
  const [deleteValidationError, setDeleteValidationError] = useState('')
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const photoInputRef = useRef(null)

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const resolvedForm = form || buildFormFromProfile(profile)
  const profileName = useMemo(() => getProfileName(profile, resolvedForm), [profile, resolvedForm])
  const memberSince = useMemo(() => formatDate(profile?.createdAt), [profile?.createdAt])
  const lastUpdated = useMemo(() => formatDateTime(profile?.updatedAt), [profile?.updatedAt])
  const profilePhotoUrl = profile?.profilePhoto?.url || FALLBACK_AVATAR_URL
  const isSeller = profile?.role === 'seller'
  const isAdmin = profile?.role === 'admin'

  const updateFormField = (field, value) => {
    setForm((prev) => ({
      ...(prev || buildFormFromProfile(profile)),
      [field]: value,
    }))
  }

  const onProfileSubmit = async (e) => {
    e.preventDefault()
    const updated = await saveProfile(resolvedForm)
    setForm(buildFormFromProfile(updated))
    setEditMode(false)
  }

  const onCancelEdit = () => {
    setForm(buildFormFromProfile(profile))
    setEditMode(false)
  }

  const onPhotoSubmit = async (e) => {
    e.preventDefault()
    if (!photoFile) return

    setPhotoSubmitting(true)
    try {
      await savePhoto(photoFile)
      setPhotoFile(null)
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
    } finally {
      setPhotoSubmitting(false)
    }
  }

  const onPasswordSubmit = async (e) => {
    e.preventDefault()
    await updatePassword(passwordForm)
    setPasswordForm({ currentPassword: '', newPassword: '' })
  }

  const onDeleteSubmit = async (e) => {
    e.preventDefault()
    setDeleteValidationError('')

    if (!deleteForm.currentPassword) {
      setDeleteValidationError('Current password is required to verify your account')
      return
    }

    if (deleteForm.confirmText !== 'DELETE') {
      setDeleteValidationError('Type DELETE exactly to continue')
      return
    }

    if (!deleteForm.acknowledge) {
      setDeleteValidationError('Please acknowledge that this action is irreversible')
      return
    }

    setDeleteSubmitting(true)
    try {
      await deleteMyAccount({
        currentPassword: deleteForm.currentPassword,
        confirmText: deleteForm.confirmText,
      })
      logout()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch {
      // API errors are surfaced through the shared profile error state.
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="page-shell space-y-lg pb-xl">
      <div className="animate-fade-up">
        <h1 className="section-title">My Profile</h1>
        <p className="section-subtitle">View every account detail clearly and update your profile anytime.</p>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {loading && !profile ? (
        <div className="flex justify-center py-2xl"><Spinner size="lg" /></div>
      ) : (
        <div className="grid gap-lg xl:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <section className="space-y-lg">
            <Card className="animate-fade-up overflow-hidden p-0 shadow-card">
              <div className="relative overflow-hidden bg-gradient-to-r from-primary/95 via-primary to-accent/85 px-lg py-lg text-white">
                <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" aria-hidden="true" />
                <div className="absolute -bottom-10 left-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />

                <div className="relative z-10 flex flex-wrap items-start justify-between gap-md">
                  <div className="flex items-start gap-md">
                    <Avatar
                      src={profilePhotoUrl}
                      name={profileName}
                      size="lg"
                      className="h-20 w-20 border-4 border-white/80 shadow-soft"
                    />

                    <div className="space-y-1">
                      <p className="text-2xl font-display font-semibold leading-tight text-white">{profileName}</p>
                      <p className="text-sm text-white/90">{profile?.email || 'No email available'}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="default" className="border-white/25 bg-white/20 text-white">
                          {formatRoleLabel(profile?.role)}
                        </Badge>
                        <Badge variant="default" className="border-white/25 bg-white/20 text-white">
                          {formatStatusLabel(profile?.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <form className="flex min-w-[240px] flex-col gap-2" onSubmit={onPhotoSubmit}>
                    <label className="text-xs font-semibold uppercase tracking-wide text-white/80">Profile photo</label>
                    <input
                      ref={photoInputRef}
                      name="photo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      className="w-full rounded-md border border-white/35 bg-white/20 px-sm py-2 text-xs text-white file:mr-2 file:rounded-sm file:border-0 file:bg-white/80 file:px-sm file:py-1 file:text-xs file:font-semibold file:text-primary"
                    />
                    <Button type="submit" size="sm" className="border-white/30 bg-white/20 text-white hover:bg-white/30" loading={photoSubmitting}>
                      {photoFile ? 'Upload New Photo' : 'Upload Photo'}
                    </Button>
                  </form>
                </div>
              </div>

              <div className="grid gap-sm border-t border-border/80 bg-surface-elevated p-md sm:grid-cols-2 lg:grid-cols-3">
                <ProfileDatum label="Member Since" value={memberSince} />
                <ProfileDatum label="Last Updated" value={lastUpdated} />
                <ProfileDatum label="Phone" value={profile?.phone || 'Not added'} />
              </div>
            </Card>

            <Card className="animate-fade-up space-y-md">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Personal Information</h2>
                  <p className="text-sm text-text-secondary">All core profile fields are visible here and can be edited.</p>
                </div>

                {!editMode ? (
                  <Button variant="secondary" onClick={() => setEditMode(true)}>Edit Profile</Button>
                ) : null}
              </div>

              {editMode ? (
                <form className="space-y-md" onSubmit={onProfileSubmit}>
                  <div className="grid gap-sm md:grid-cols-2">
                    <FormField
                      label="First Name"
                      value={resolvedForm.firstName}
                      onChange={(e) => updateFormField('firstName', e.target.value)}
                      required
                    />
                    <FormField
                      label="Last Name"
                      value={resolvedForm.lastName}
                      onChange={(e) => updateFormField('lastName', e.target.value)}
                      required
                    />
                    <FormField
                      label="Middle Name"
                      value={resolvedForm.middleName}
                      onChange={(e) => updateFormField('middleName', e.target.value)}
                    />
                    <FormField
                      label="Phone"
                      value={resolvedForm.phone}
                      onChange={(e) => updateFormField('phone', e.target.value)}
                      placeholder="+91XXXXXXXXXX"
                    />
                    <FormField
                      className="md:col-span-2"
                      label="Email"
                      type="email"
                      value={resolvedForm.email}
                      onChange={(e) => updateFormField('email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" loading={loading}>Save Changes</Button>
                    <Button type="button" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-md">
                  <div className="grid gap-sm md:grid-cols-2">
                    <ProfileDatum label="First Name" value={profile?.firstName} />
                    <ProfileDatum label="Last Name" value={profile?.lastName} />
                    <ProfileDatum label="Middle Name" value={profile?.middleName || 'Not added'} />
                    <ProfileDatum label="Phone Number" value={profile?.phone || 'Not added'} />
                    <ProfileDatum label="Email Address" value={profile?.email} />
                    <ProfileDatum label="Role" value={formatRoleLabel(profile?.role)} />
                    <ProfileDatum label="Account Status" value={formatStatusLabel(profile?.status)} />
                    <ProfileDatum label="Updated On" value={lastUpdated} />
                  </div>
                </div>
              )}
            </Card>
          </section>

          <section className="space-y-lg">
            <Card className="animate-fade-up space-y-md">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Security</h2>
                <p className="text-sm text-text-secondary">Keep your account protected with a strong password.</p>
              </div>

              <form className="space-y-sm" onSubmit={onPasswordSubmit}>
                <PasswordField
                  label="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((s) => ({ ...s, currentPassword: e.target.value }))}
                  required
                />
                <PasswordField
                  label="New Password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((s) => ({ ...s, newPassword: e.target.value }))}
                  showStrength
                  required
                />
                <Button type="submit" variant="secondary" fullWidth>Change Password</Button>
              </form>
            </Card>

            <Card className="animate-fade-up space-y-md border border-danger/30">
              <div>
                <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {isAdmin
                    ? 'Admin account deletion is not allowed from profile settings.'
                    : isSeller
                      ? 'Deleting your seller account permanently removes seller profile data and products after eligibility checks. Order and transaction history remains for reporting.'
                      : 'Deleting your customer account permanently removes personal profile data, addresses, and wishlist. Order history remains for reporting.'}
                </p>
              </div>

              {!isAdmin ? (
                <>
                  {deleteValidationError ? <Alert>{deleteValidationError}</Alert> : null}

                  <form className="space-y-sm" onSubmit={onDeleteSubmit}>
                    <PasswordField
                      label="Current Password (Verification)"
                      value={deleteForm.currentPassword}
                      onChange={(e) => setDeleteForm((s) => ({ ...s, currentPassword: e.target.value }))}
                      required
                    />
                    <FormField
                      label="Type DELETE to confirm"
                      value={deleteForm.confirmText}
                      onChange={(e) => setDeleteForm((s) => ({ ...s, confirmText: e.target.value }))}
                      placeholder="DELETE"
                      required
                    />

                    <label className="flex items-start gap-2 rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={deleteForm.acknowledge}
                        onChange={(e) => setDeleteForm((s) => ({ ...s, acknowledge: e.target.checked }))}
                        className="mt-0.5"
                      />
                      I understand this action is irreversible.
                    </label>

                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full border border-danger text-danger hover:bg-danger-soft"
                      loading={deleteSubmitting}
                    >
                      Delete My Account
                    </Button>
                  </form>
                </>
              ) : (
                <p className="rounded-md border border-border bg-surface-elevated px-sm py-2 text-sm text-text-secondary">
                  If you need changes to an admin account, contact system support.
                </p>
              )}
            </Card>
          </section>
        </div>
      )}
    </div>
  )
}
