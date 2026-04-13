import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = (user: { _id: string; role: string } | null) => {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!user) {
      setConnected(false)
      return
    }

    // Connect through Vite proxy (which now proxies /socket.io → :5000)
    const socket = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      console.log('🔌 Socket connected:', socket.id)

      // Join role-based room
      if (user.role === 'volunteer' || user.role === 'admin') {
        socket.emit('join_room', { room: 'staff' })
      }
      // Join personal notification room
      socket.emit('join_user_room', { userId: user._id })
    })

    socket.on('disconnect', () => {
      setConnected(false)
      console.log('🔌 Socket disconnected')
    })

    socket.on('connect_error', (err) => {
      setConnected(false)
      console.warn('Socket error:', err.message)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [user?._id])

  return { socket: socketRef.current, connected }
}
