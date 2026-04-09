import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import useAuthStore from '@/features/auth/authSlice'
import { getProfile, updateProfile, uploadProfilePhoto, changePassword, deleteAccount } from '@/features/user/api'

const useProfile = () => {
  const { data, setData, loading, error, run } = useAsync(null, { cacheKey: 'user:profile' })
  const setUser = useAuthStore((s) => s.setUser)

  const refresh = useCallback(() => {
    return run(() => getProfile()).then((profile) => {
      setData(profile)
      setUser(profile)
      return profile
    })
  }, [run, setData, setUser])

  const saveProfile = useCallback(
    (payload) => run(() => updateProfile(payload)).then((profile) => {
      setData(profile)
      setUser(profile)
      return profile
    }),
    [run, setData, setUser]
  )

  const savePhoto = useCallback(
    (file) => run(() => uploadProfilePhoto(file)).then((profile) => {
      setData(profile)
      setUser(profile)
      return profile
    }),
    [run, setData, setUser]
  )

  const updatePassword = useCallback(
    (payload) => run(() => changePassword(payload)),
    [run]
  )

  const deleteMyAccount = useCallback(
    (payload) => run(() => deleteAccount(payload)),
    [run]
  )

  return {
    profile: data,
    loading,
    error,
    refresh,
    saveProfile,
    savePhoto,
    updatePassword,
    deleteMyAccount,
  }
}

export default useProfile
