import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  login: ({ user, accessToken }) =>
    set({ user, token: accessToken, isLoggedIn: true }),

  logout: () =>
    set({ user: null, token: null, isLoggedIn: false }),

  setToken: (accessToken) =>
    set({ token: accessToken }),

  setUser: (user) =>
    set((state) => ({ user: { ...state.user, ...user } })),

  hydrateSession: ({ user, accessToken }) =>
    set({ user, token: accessToken, isLoggedIn: !!(user && accessToken) }),
}))

export default useAuthStore