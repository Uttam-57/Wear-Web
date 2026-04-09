import { create } from 'zustand'

const useNotificationStore = create((set, get) => ({
  items: [],
  unreadCount: 0,

  setNotifications: (items) =>
    set({ items, unreadCount: items.filter((n) => !n.isRead).length }),

  markRead: (id) => {
    const updatedItems = get().items.map((n) =>
      n._id === id ? { ...n, isRead: true } : n
    )
    set({ items: updatedItems, unreadCount: updatedItems.filter((n) => !n.isRead).length })
  },

  clearAll: () => set({ items: [], unreadCount: 0 }),
}))

export default useNotificationStore