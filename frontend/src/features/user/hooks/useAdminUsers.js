import { useCallback } from 'react'
import useAsync from '@/shared/hooks/useAsync'
import { listAdminUsers, listPendingSellers, blockUser, unblockUser, approveSeller, rejectSeller } from '@/features/user/api'

const EMPTY_USER_RESULT = {
  users: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
}

const useAdminUsers = () => {
  const usersState = useAsync(EMPTY_USER_RESULT, { cacheKey: 'admin:users:list' })
  const sellersState = useAsync([], { cacheKey: 'admin:users:pending-sellers' })

  const usersRun = usersState.run
  const usersSetData = usersState.setData
  const sellersRun = sellersState.run
  const sellersSetData = sellersState.setData

  const refreshUsers = useCallback(
    (params = {}) =>
      usersRun(() => listAdminUsers(params)).then((users) => {
        usersSetData(users || EMPTY_USER_RESULT)
        return users
      }),
    [usersRun, usersSetData]
  )

  const refreshPendingSellers = useCallback(
    () =>
      sellersRun(() => listPendingSellers()).then((sellers) => {
        sellersSetData(sellers || [])
        return sellers
      }),
    [sellersRun, sellersSetData]
  )

  return {
    users: usersState.data?.users || [],
    pagination: usersState.data?.pagination || EMPTY_USER_RESULT.pagination,
    pendingSellers: sellersState.data || [],
    loading: usersState.loading || sellersState.loading,
    error: usersState.error || sellersState.error,
    refreshUsers,
    refreshPendingSellers,
    blockUser,
    unblockUser,
    approveSeller,
    rejectSeller,
  }
}

export default useAdminUsers
