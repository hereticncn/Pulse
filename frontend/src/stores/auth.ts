import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiRequestError, apiRequest } from '../lib/api'

export interface Membership {
  organizationId: string
  organizationName: string
  slug: string
  role: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  memberships: Membership[]
}

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  name: string
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const initialized = ref(false)
  const loading = ref(false)

  async function fetchMe(): Promise<void> {
    loading.value = true

    try {
      const data = await apiRequest<{ user: AuthUser }>('/auth/me')
      user.value = data.user
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        user.value = null
      } else {
        throw error
      }
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function login(payload: LoginPayload): Promise<AuthUser> {
    const data = await apiRequest<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: payload,
    })

    user.value = {
      ...data.user,
      memberships: data.user.memberships ?? [],
    }
    initialized.value = true

    return user.value
  }

  async function register(
    payload: RegisterPayload,
  ): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/auth/register', {
      method: 'POST',
      body: payload,
    })
  }

  async function verifyEmail(token: string): Promise<void> {
    await apiRequest<void>('/auth/verify-email', {
      method: 'POST',
      body: { token },
    })
  }

  async function logout(): Promise<void> {
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
    }
  }

  return {
    user,
    initialized,
    loading,
    fetchMe,
    login,
    register,
    verifyEmail,
    logout,
  }
})
