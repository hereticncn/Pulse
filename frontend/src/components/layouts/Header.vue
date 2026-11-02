<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

async function signOut(): Promise<void> {
  try {
    await auth.logout()
  } catch {
    // Сессию всё равно считаем завершённой на клиенте.
  }
}
</script>

<template>
  <header class="landing-nav">
    <a href="/" class="landing-logo">
      <div class="logo">
        <span class="logo-mark">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <strong>Pulse</strong>
      </div>
    </a>
    <nav>
      <a href="#how-it-works">How it works</a>
      <a href="#features">Features</a>
    </nav>
    <div v-if="auth.user" class="landing-user">
      <span class="landing-user-name" :title="auth.user.email">
        {{ auth.user.name }}
      </span>
      <button type="button" class="btn btn-ghost" @click="signOut">
        Sign out
      </button>
    </div>
    <div v-else>
      <RouterLink to="/login">
        <button type="button" class="btn btn-ghost">Sign in</button>
      </RouterLink>
      <RouterLink to="/register">
        <button type="button" class="btn btn-primary">Get started</button>
      </RouterLink>
    </div>
  </header>
</template>
