import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword as resetPasswordApi } from '@/features/auth/api'
import { getApiError } from '@/shared/services/apiClient'
import { isValidPassword } from '@/shared/utils/validators'
import { ROUTES } from '@/shared/constants/routes'

const TOKEN_RE = /^[a-f0-9]{64}$/

const useResetPassword = () => {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const submit = async ({ newPassword, confirmPassword }) => {
    const nextErrors = {}

    if (!TOKEN_RE.test(token)) {
      setApiError('Invalid or missing password reset token')
      return
    }
    if (!isValidPassword(newPassword || '')) {
      nextErrors.newPassword = 'Use 8+ chars with uppercase, number and special character'
    }
    if (!confirmPassword || confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setErrors({})
    setApiError('')

    try {
      await resetPasswordApi({ token, newPassword })
      setSuccess(true)
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { replace: true })
      }, 1500)
    } catch (error) {
      setApiError(getApiError(error, 'Unable to reset password right now'))
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, errors, apiError, success, token }
}

export default useResetPassword
