<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authErrorMessage } from '../../lib/auth-errors'
import { useAuthStore } from '../../stores/auth'

type VerificationStatus = 'pending' | 'success' | 'error'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const status = ref<VerificationStatus>('pending')
const message = ref('')

onMounted(async () => {
  const token =
    typeof route.query.token === 'string' ? route.query.token : ''

  if (!token) {
    status.value = 'error'
    message.value = 'В ссылке нет токена подтверждения.'
    return
  }

  try {
    await auth.verifyEmail(token)
    status.value = 'success'
    message.value = 'Email подтверждён. Теперь можно войти в аккаунт.'

    // Убираем одноразовый токен из адресной строки и истории.
    await router.replace({ name: 'verifyEmail' })
  } catch (error) {
    status.value = 'error'
    message.value = authErrorMessage(error)
  }
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-brand">
      <div class="logo">
        <span class="logo-mark">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <strong>Pulse</strong>
      </div>
    </div>

    <main class="auth-card">
      <div class="auth-status">
        <div
          class="auth-icon"
          :class="{ 'auth-icon-error': status === 'error' }"
          aria-hidden="true"
        >
          <svg v-if="status === 'success'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
          <svg v-else-if="status === 'error'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
          </svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v3"></path>
            <path d="M12 18v3"></path>
            <path d="m5.6 5.6 2.1 2.1"></path>
            <path d="m16.3 16.3 2.1 2.1"></path>
            <path d="M3 12h3"></path>
            <path d="M18 12h3"></path>
            <path d="m5.6 18.4 2.1-2.1"></path>
            <path d="m16.3 7.7 2.1-2.1"></path>
          </svg>
        </div>

        <h2 v-if="status === 'pending'">Подтверждаем email…</h2>
        <h2 v-else-if="status === 'success'">Готово</h2>
        <h2 v-else>Не получилось</h2>

        <p v-if="status === 'pending'">
          Проверяем ссылку подтверждения. Это займёт пару секунд.
        </p>
        <p v-else>{{ message }}</p>

        <RouterLink v-if="status === 'success'" to="/login?verified=1">
          <button type="button" class="btn btn-primary full-button">
            Войти
          </button>
        </RouterLink>
        <RouterLink v-else-if="status === 'error'" to="/register">
          <button type="button" class="btn btn-secondary full-button">
            Вернуться к регистрации
          </button>
        </RouterLink>
      </div>
    </main>

    <p class="auth-footer">Pulse · подтверждение email</p>
  </div>
</template>
