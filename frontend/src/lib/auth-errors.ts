import { ApiRequestError } from './api'

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case 'EMAIL_NOT_VERIFIED':
        return 'Email ещё не подтверждён. Проверьте почту и перейдите по ссылке из письма.'
      case 'INVALID_CREDENTIALS':
        return 'Неверный email или пароль.'
      case 'INVALID_TOKEN':
        return 'Ссылка подтверждения недействительна или истекла.'
      case 'CSRF_INVALID':
        return 'Форма устарела. Обновите страницу и попробуйте снова.'
      case 'RATE_LIMITED':
        return 'Слишком много попыток. Попробуйте позже.'
      default:
        return error.message
    }
  }

  return 'Что-то пошло не так. Попробуйте ещё раз.'
}
