import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout as logoutApi } from '@/features/auth/api'
import useAuthStore from '@/features/auth/authSlice'
import { getCategoryTree } from '@/features/category/api/category.api'
import { getSellerProfile, setupSellerProfile, updateSellerProfile } from '@/features/user/api'
import {
  EMAIL_REGEX,
  GST_REGEX,
  IFSC_REGEX,
  MAX_FILE_SIZE_BYTES,
  MAX_PROOF_FILES,
  PHONE_REGEX,
  STEP_FIELDS,
  initialFormState,
} from '@/features/seller/profileSetup/constants'
import {
  fileToDataUrl,
  flattenCategoryTree,
  getFieldStep,
  getStepForErrors,
  isAllowedImageFile,
  isValidOptionalUrl,
  mapBackendField,
  normalizeIfPresent,
} from '@/features/seller/profileSetup/utils'
import { ROLES, USER_STATUS } from '@/shared/constants/app'
import { ROUTES } from '@/shared/constants/routes'
import { getApiError } from '@/shared/services/apiClient'
import useUIStore from '@/shared/uiSlice'

export default function useSellerProfileSetupPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const pushToast = useUIStore((state) => state.pushToast)

  const [mode, setMode] = useState('create')
  const [step, setStep] = useState(1)
  const [furthestStep, setFurthestStep] = useState(1)

  const [checkingProfile, setCheckingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [loadingCategories, setLoadingCategories] = useState(true)

  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const [proofFiles, setProofFiles] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const [isDragActive, setIsDragActive] = useState(false)

  const [categories, setCategories] = useState([])
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')

  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef(null)

  const totalProofCount = form.existingProofUrls.length + proofFiles.length

  const categoryLabelMap = useMemo(() => {
    return categories.reduce((acc, item) => {
      acc[item.id] = item.label
      return acc
    }, {})
  }, [categories])

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => category.label.toLowerCase().includes(query))
  }, [categories, categorySearch])

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const validateStepOne = useCallback((state) => {
    const nextErrors = {}

    if (!state.companyName.trim()) nextErrors.companyName = 'Company or store name is required'
    if (!state.ownerName.trim()) nextErrors.ownerName = 'Owner full name is required'

    if (!state.companyEmail.trim()) {
      nextErrors.companyEmail = 'Business email is required'
    } else if (!EMAIL_REGEX.test(state.companyEmail.trim())) {
      nextErrors.companyEmail = 'Enter a valid email address'
    }

    if (!state.companyPhone.trim()) {
      nextErrors.companyPhone = 'Business phone is required'
    } else if (!PHONE_REGEX.test(state.companyPhone.trim())) {
      nextErrors.companyPhone = 'Use international format (for example +919876543210)'
    }

    if (!isValidOptionalUrl(state.website)) {
      nextErrors.website = 'Website must be a valid URL including http or https'
    }

    return nextErrors
  }, [])

  const validateStepTwo = useCallback((state, proofsCount) => {
    const nextErrors = {}

    if (!state.locationCountry.trim()) nextErrors.locationCountry = 'Country is required'
    if (!state.locationState.trim()) nextErrors.locationState = 'State is required'
    if (!state.locationDistrict.trim()) nextErrors.locationDistrict = 'District is required'
    if (!state.locationAddressLine.trim()) nextErrors.locationAddressLine = 'Business address is required'

    if (state.gstNumber.trim() && !GST_REGEX.test(state.gstNumber.trim().toUpperCase())) {
      nextErrors.gstNumber = 'Invalid GST format'
    }

    if (proofsCount < 1) {
      nextErrors.companyProof = 'Upload at least one proof document'
    }

    if (proofsCount > MAX_PROOF_FILES) {
      nextErrors.companyProof = `Maximum ${MAX_PROOF_FILES} files are allowed`
    }

    return nextErrors
  }, [])

  const validateStepThree = useCallback((state) => {
    const nextErrors = {}

    if (!state.bankToggle) return nextErrors

    if (!state.accountHolderName.trim()) nextErrors.accountHolderName = 'Account holder name is required'
    if (!state.accountNumber.trim()) nextErrors.accountNumber = 'Account number is required'

    if (!state.ifscCode.trim()) {
      nextErrors.ifscCode = 'IFSC code is required'
    } else if (!IFSC_REGEX.test(state.ifscCode.trim().toUpperCase())) {
      nextErrors.ifscCode = 'Invalid IFSC format'
    }

    return nextErrors
  }, [])

  const validateForStep = useCallback(
    (targetStep, state, proofsCount) => {
      if (targetStep === 1) return validateStepOne(state)
      if (targetStep === 2) return validateStepTwo(state, proofsCount)
      return validateStepThree(state)
    },
    [validateStepOne, validateStepTwo, validateStepThree]
  )

  useEffect(() => {
    if (!user) {
      navigate(ROUTES.LOGIN, { replace: true })
      return
    }

    if (user.role !== ROLES.SELLER) {
      navigate(ROUTES.UNAUTHORIZED, { replace: true })
      return
    }

    if (user.status !== USER_STATUS.PENDING) {
      navigate(ROUTES.SELLER_DASHBOARD, { replace: true })
      return
    }

    let active = true

    const bootstrapProfile = async () => {
      setCheckingProfile(true)
      setProfileError('')

      try {
        const profile = await getSellerProfile()
        if (!active) return

        setMode('update')
        setForm({
          companyName: profile?.companyName || '',
          ownerName: profile?.ownerName || '',
          companyEmail: profile?.companyEmail || '',
          companyPhone: profile?.companyPhone || '',
          website: profile?.website || '',
          locationCountry: profile?.location?.country || 'India',
          locationState: profile?.location?.state || '',
          locationDistrict: profile?.location?.district || '',
          locationAddressLine: profile?.location?.addressLine || '',
          majorCategories: (profile?.majorCategories || []).map((item) => String(item?._id || item)).filter(Boolean),
          gstNumber: profile?.gstNumber || '',
          bankToggle: Boolean(profile?.bankDetails?.accountHolderName || profile?.bankDetails?.accountNumber || profile?.bankDetails?.ifscCode),
          accountHolderName: profile?.bankDetails?.accountHolderName || '',
          accountNumber: profile?.bankDetails?.accountNumber || '',
          ifscCode: profile?.bankDetails?.ifscCode || '',
          existingProofUrls: Array.isArray(profile?.companyProof) ? profile.companyProof : [],
        })
      } catch (error) {
        if (!active) return

        if (error?.response?.status !== 404) {
          setProfileError(getApiError(error, 'Unable to load your seller profile right now'))
        }
      } finally {
        if (active) setCheckingProfile(false)
      }
    }

    bootstrapProfile()

    return () => {
      active = false
    }
  }, [navigate, user])

  useEffect(() => {
    let active = true

    const loadCategories = async () => {
      setLoadingCategories(true)
      try {
        const tree = await getCategoryTree()
        if (!active) return
        setCategories(flattenCategoryTree(tree))
      } catch (error) {
        if (!active) return
        pushToast({
          type: 'warning',
          title: 'Categories unavailable',
          message: getApiError(error, 'You can continue setup without categories.'),
        })
      } finally {
        if (active) setLoadingCategories(false)
      }
    }

    loadCategories()

    return () => {
      active = false
    }
  }, [pushToast])

  const markTouchedForStep = useCallback((targetStep) => {
    const fields = STEP_FIELDS[targetStep] || []
    setTouched((prev) => {
      const next = { ...prev }
      fields.forEach((field) => {
        next[field] = true
      })
      return next
    })
  }, [])

  const updateFormField = useCallback(
    (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      clearFieldError(field)
      setSubmitError('')
    },
    [clearFieldError]
  )

  const addProofFiles = useCallback(
    (incomingFiles) => {
      const files = Array.from(incomingFiles || [])
      if (!files.length) return

      const currentTotal = form.existingProofUrls.length + proofFiles.length
      let remainingSlots = Math.max(0, MAX_PROOF_FILES - currentTotal)

      const accepted = []
      const rejected = []

      files.forEach((file) => {
        if (remainingSlots <= 0) {
          rejected.push(`${file.name}: Maximum ${MAX_PROOF_FILES} files allowed`)
          return
        }

        if (!isAllowedImageFile(file)) {
          rejected.push(`${file.name}: Invalid file type (JPEG, PNG, WEBP, GIF only)`)
          return
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          rejected.push(`${file.name}: File too large (max 5MB)`)
          return
        }

        const duplicate = proofFiles.some((item) => item.file.name === file.name && item.file.size === file.size)
        if (duplicate) {
          rejected.push(`${file.name}: Duplicate file`)
          return
        }

        accepted.push({ id: crypto.randomUUID(), file })
        remainingSlots -= 1
      })

      if (accepted.length) {
        setProofFiles((prev) => [...prev, ...accepted])
        clearFieldError('companyProof')
      }

      if (rejected.length) {
        setFileErrors(rejected)
        pushToast({
          type: 'danger',
          title: 'Some files were rejected',
          message: rejected[0],
        })
      } else {
        setFileErrors([])
      }
    },
    [clearFieldError, form.existingProofUrls.length, proofFiles, pushToast]
  )

  const handleProofDrop = useCallback(
    (event) => {
      event.preventDefault()
      setIsDragActive(false)
      addProofFiles(event.dataTransfer.files)
    },
    [addProofFiles]
  )

  const handleNext = useCallback(() => {
    const stepErrors = validateForStep(step, form, totalProofCount)
    if (Object.keys(stepErrors).length) {
      setErrors((prev) => ({ ...prev, ...stepErrors }))
      markTouchedForStep(step)
      return
    }

    setErrors((prev) => {
      const next = { ...prev }
      ;(STEP_FIELDS[step] || []).forEach((field) => delete next[field])
      return next
    })

    setStep((prev) => Math.min(3, prev + 1))
    setFurthestStep((prev) => Math.max(prev, step + 1))
  }, [form, markTouchedForStep, step, totalProofCount, validateForStep])

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1))
  }, [])

  const handleBankToggle = useCallback(
    (checked) => {
      updateFormField('bankToggle', checked)

      if (!checked) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.accountHolderName
          delete next.accountNumber
          delete next.ifscCode
          return next
        })
      }
    },
    [updateFormField]
  )

  const handleFieldBlur = useCallback(
    (field) => {
      setTouched((prev) => ({ ...prev, [field]: true }))

      const fieldStep = getFieldStep(field)
      const nextErrors = validateForStep(fieldStep, form, totalProofCount)
      setErrors((prev) => ({ ...prev, ...nextErrors }))

      if (!nextErrors[field]) {
        clearFieldError(field)
      }
    },
    [clearFieldError, form, totalProofCount, validateForStep]
  )

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      const mergedErrors = {
        ...validateStepOne(form),
        ...validateStepTwo(form, totalProofCount),
        ...validateStepThree(form),
      }

      if (Object.keys(mergedErrors).length) {
        setErrors(mergedErrors)
        setTouched((prev) => {
          const next = { ...prev }
          Object.keys(mergedErrors).forEach((field) => {
            next[field] = true
          })
          return next
        })
        setStep(getStepForErrors(mergedErrors))
        setFurthestStep(3)
        return
      }

      setSubmitting(true)
      setSubmitError('')

      try {
        const generatedProofs = await Promise.all(proofFiles.map((item) => fileToDataUrl(item.file)))

        const payload = {
          companyName: form.companyName.trim(),
          ownerName: form.ownerName.trim(),
          companyEmail: form.companyEmail.trim().toLowerCase(),
          companyPhone: form.companyPhone.trim(),
          companyProof: [...form.existingProofUrls, ...generatedProofs],
          location: {
            country: form.locationCountry.trim(),
            state: form.locationState.trim(),
            district: form.locationDistrict.trim(),
            addressLine: form.locationAddressLine.trim(),
          },
        }

        const website = normalizeIfPresent(form.website)
        if (website) payload.website = website

        const gstNumber = normalizeIfPresent(form.gstNumber)
        if (gstNumber) payload.gstNumber = gstNumber.toUpperCase()

        if (Array.isArray(form.majorCategories) && form.majorCategories.length) {
          payload.majorCategories = form.majorCategories
        }

        if (form.bankToggle) {
          payload.bankDetails = {
            accountHolderName: form.accountHolderName.trim(),
            accountNumber: form.accountNumber.trim(),
            ifscCode: form.ifscCode.trim().toUpperCase(),
          }
        }

        if (mode === 'update') {
          await updateSellerProfile(payload)
        } else {
          await setupSellerProfile(payload)
        }

        pushToast({
          type: 'success',
          title: 'Profile submitted',
          message: 'Your seller profile is now under review.',
        })

        navigate(ROUTES.SELLER_PENDING, {
          replace: true,
          state: { submittedEmail: payload.companyEmail },
        })
      } catch (error) {
        const status = error?.response?.status
        const code = error?.response?.data?.errorCode
        const backendErrors = Array.isArray(error?.response?.data?.errors) ? error.response.data.errors : []

        if (status === 409) {
          navigate(ROUTES.SELLER_PENDING, { replace: true })
          return
        }

        if (status === 413 || code === 'FILE_TOO_LARGE' || code === 'INVALID_FILE') {
          setStep(2)
        }

        if (backendErrors.length) {
          const mappedErrors = {}
          backendErrors.forEach((issue) => {
            const field = mapBackendField(issue?.field)
            if (!field) return
            mappedErrors[field] = issue?.message || 'Invalid value'
          })

          if (Object.keys(mappedErrors).length) {
            setErrors((prev) => ({ ...prev, ...mappedErrors }))
            setStep(getStepForErrors(mappedErrors))
          }
        }

        setSubmitError(getApiError(error, 'Unable to submit seller profile right now'))
      } finally {
        setSubmitting(false)
      }
    },
    [
      form,
      mode,
      navigate,
      proofFiles,
      pushToast,
      totalProofCount,
      validateStepOne,
      validateStepThree,
      validateStepTwo,
    ]
  )

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi(false)
    } catch {
      // Keep local logout even if request fails.
    }

    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }, [logout, navigate])

  return {
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
  }
}
