<script setup lang="ts">
import { ref } from 'vue'
import { authErrorMessage } from '../../lib/auth-errors'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const registered = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

function validate(): string | null {
  if (!name.value.trim()) {
    return 'Укажите имя.'
  }

  if (!email.value.trim()) {
    return 'Укажите email.'
  }

  if (password.value.length < 12) {
    return 'Пароль должен быть не короче 12 символов.'
  }

  if (password.value !== confirmPassword.value) {
    return 'Пароли не совпадают.'
  }

  return null
}

async function submit(): Promise<void> {
  errorMessage.value = ''
  const validationError = validate()

  if (validationError) {
    errorMessage.value = validationError
    return
  }

  submitting.value = true

  try {
    const result = await auth.register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })

    successMessage.value = result.message
    registered.value = true
  } catch (error) {
    errorMessage.value = authErrorMessage(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="isolated-view">
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
        <template v-if="registered">
          <div class="auth-status">
            <div class="auth-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                <path d="m3 7 9 6 9-6"></path>
              </svg>
            </div>

            <h2>Проверьте почту</h2>
            <p>{{ successMessage }}</p>
            <p>
              Перейдите по ссылке из письма, чтобы подтвердить email.
              В development-режиме ссылка выводится в лог backend.
            </p>

            <RouterLink to="/login">
              <button type="button" class="btn btn-primary full-button">
                Перейти ко входу
              </button>
            </RouterLink>
          </div>
        </template>

        <template v-else>
          <div class="auth-intro">
            <h1>Create your account</h1>
            <p>Start turning customer feedback into better products.</p>
          </div>

          <button
            type="button"
            class="btn btn-secondary full-button google-button"
            disabled
            title="Google OAuth будет добавлен позже"
          >
            <strong>G</strong>Continue with Google
          </button>

          <div class="or">
            <span>or continue with email</span>
          </div>

          <form @submit.prevent="submit">
            <div class="form-group">
              <label for="full-name">Full name</label>
              <label class="input-wrap">
                <input
                  id="full-name"
                  v-model="name"
                  placeholder="Alex Morgan"
                  type="text"
                  autocomplete="name"
                  required
                >
              </label>
            </div>

            <div class="form-group">
              <label for="email">Email address</label>
              <label class="input-wrap">
                <svg aria-hidden="true" class="icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <path d="m3 7 9 6 9-6"></path>
                </svg>
                <input
                  id="email"
                  v-model="email"
                  placeholder="you@company.com"
                  type="email"
                  autocomplete="username"
                  required
                >
              </label>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <label class="input-wrap">
                <svg aria-hidden="true" class="icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="10" width="16" height="11" rx="2"></rect>
                  <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
                </svg>
                <input
                  id="password"
                  v-model="password"
                  placeholder="At least 12 characters"
                  type="password"
                  autocomplete="new-password"
                  minlength="12"
                  required
                >
              </label>
            </div>

            <div class="form-group">
              <label for="confirm-password">Confirm password</label>
              <label class="input-wrap">
                <svg aria-hidden="true" class="icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="10" width="16" height="11" rx="2"></rect>
                  <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
                </svg>
                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  placeholder="Enter your password again"
                  type="password"
                  autocomplete="new-password"
                  minlength="12"
                  required
                >
              </label>
            </div>

            <p v-if="errorMessage" class="form-error" role="alert">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              class="btn btn-primary full-button"
              :disabled="submitting"
            >
              {{ submitting ? 'Creating account…' : 'Create account' }}
            </button>
          </form>

          <p class="auth-switch">
            Already have an account?
            <RouterLink to="/login">
              <button type="button">Sign in</button>
            </RouterLink>
          </p>
        </template>
      </main>

      <p class="auth-footer">By continuing, you agree to our Terms and Privacy Policy.</p>
    </div>
  </div>
</template>
