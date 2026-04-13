import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { authAPI } from '../api'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'volunteer' | 'user'
  isAvailable?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: RegisterData) => Promise<User>
  logout: () => void
}

interface RegisterData {
  name: string
  email: string
  password: string
  role: 'user' | 'volunteer'
  phone?: string
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common.Authorization
    }

    const fetchMe = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await authAPI.me()
        setUser(data.user)
      } catch {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [token])

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login(email, password)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user as User
  }

  const register = async (formData: RegisterData) => {
    const { data } = await authAPI.register(formData)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user as User
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
