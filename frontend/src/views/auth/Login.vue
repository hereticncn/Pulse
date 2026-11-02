<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authErrorMessage } from '../../lib/auth-errors'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')

const noticeMessage = computed(() =>
  route.query.verified === '1'
    ? 'Email подтверждён. Теперь можно войти.'
    : '',
)

async function submit(): Promise<void> {
  errorMessage.value = ''

  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Заполните email и пароль.'
    return
  }

  submitting.value = true

  try {
    await auth.login({
      email: email.value.trim(),
      password: password.value,
    })

    const redirect =
      typeof route.query.redirect === 'string' &&
      route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/'

    await router.push(redirect)
  } catch (error) {
    errorMessage.value = authErrorMessage(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page" data-fge-id="fge-5">
    <div class="auth-brand" data-fge-id="fge-6">
      <div class="logo" data-fge-id="fge-7">
      <span class="logo-mark" data-fge-id="fge-8">
        <span data-fge-id="fge-9"></span>
        <span data-fge-id="fge-10"></span>
        <span data-fge-id="fge-11"></span>
      </span>
        <strong data-fge-id="fge-12">Pulse</strong>
      </div>
    </div>

    <main class="auth-card" data-fge-id="fge-13">
      <div class="auth-intro" data-fge-id="fge-14">
        <h1 data-fge-id="fge-15">Welcome back</h1>
        <p data-fge-id="fge-16">Sign in to continue to your Pulse workspace.</p>
      </div>

      <button
        type="button"
        class="btn btn-secondary full-button google-button"
        data-fge-id="fge-17"
        disabled
        title="Google OAuth будет добавлен позже"
      >
        <strong data-fge-id="fge-18">G</strong>Continue with Google
      </button>

      <div class="or" data-fge-id="fge-19">
        <span data-fge-id="fge-20">or continue with email</span>
      </div>

      <form data-fge-id="fge-21" @submit.prevent="submit">
        <label data-fge-id="fge-22">
          Email address
          <div class="input-wrap" data-fge-id="fge-23">
            <svg aria-hidden="true" class="icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-fge-id="fge-24">
              <rect x="3" y="5" width="18" height="14" rx="2" data-fge-id="fge-25"></rect>
              <path d="m3 7 9 6 9-6" data-fge-id="fge-26"></path>
            </svg>
            <input
              v-model="email"
              placeholder="you@company.com"
              type="email"
              autocomplete="username"
              required
              data-fge-id="fge-27"
            />
          </div>
        </label>

        <label data-fge-id="fge-28">
          Password
          <div class="input-wrap" data-fge-id="fge-29">
            <svg aria-hidden="true" class="icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-fge-id="fge-30">
              <rect x="4" y="10" width="16" height="11" rx="2" data-fge-id="fge-31"></rect>
              <path d="M8 10V7a4 4 0 0 1 8 0v3" data-fge-id="fge-32"></path>
            </svg>
            <input
              v-model="password"
              placeholder="Enter your password"
              type="password"
              autocomplete="current-password"
              required
              data-fge-id="fge-33"
            />
          </div>
        </label>

        <p v-if="noticeMessage" class="form-notice" role="status">
          {{ noticeMessage }}
        </p>
        <p v-if="errorMessage" class="form-error" role="alert">
          {{ errorMessage }}
        </p>

        <button
          type="button"
          class="forgot"
          data-fge-id="fge-34"
          disabled
          title="Восстановление пароля будет добавлено позже"
        >
          Forgot password?
        </button>
        <button
          type="submit"
          class="btn btn-primary full-button"
          data-fge-id="fge-35"
          :disabled="submitting"
        >
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="auth-switch" data-fge-id="fge-36">
        New to Pulse?
        <RouterLink to="/register">
          <button type="button" data-fge-id="fge-37">Create an account</button>
        </RouterLink>
      </p>
    </main>

    <p class="auth-footer" data-fge-id="fge-38">By continuing, you agree to our Terms and Privacy Policy.</p>
  </div>
</template>
