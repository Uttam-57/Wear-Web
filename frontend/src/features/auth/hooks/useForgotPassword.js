import { useState } from 'react'
import { forgotPassword as forgotPasswordApi } from '@/features/auth/api'
import { getApiError } from '@/shared/services/apiClient'
import { isValidEmail } from '@/shared/utils/validators'

const useForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  const submit = async (email) => {
    if (!isValidEmail(email || '')) {
      setErrors({ email: 'Enter a valid email address' })
      return
    }

    setErrors({})
    setApiError('')
    setLoading(true)

    try {
      await forgotPasswordApi(email)
      setSent(true)
    } catch (error) {
      setApiError(getApiError(error, 'Could not send reset link right now'))
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, sent, errors, apiError }
}

export default useForgotPassword
