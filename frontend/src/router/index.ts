import { createRouter, createWebHistory } from 'vue-router';

import Register from '../views/auth/Register.vue';
import Login from '../views/auth/Login.vue';
import VerifyEmail from '../views/auth/VerifyEmail.vue';
import Main from '../components/Main.vue';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
    history: createWebHistory(),

    routes: [
        {
            path: '/',
            name: 'mainPage',
            component: Main
        },
        {
            path: '/register',
            name: 'register',
            component: Register
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/verify-email',
            name: 'verifyEmail',
            component: VerifyEmail
        }
    ]
})

router.beforeEach(async (to) => {
    const auth = useAuthStore();

    if (!auth.initialized) {
        try {
            await auth.fetchMe();
        } catch {
            // Если backend недоступен, не блокируем навигацию:
            // формы сами покажут сетевую ошибку.
        }
    }

    if (auth.user && (to.name === 'login' || to.name === 'register')) {
        return { name: 'mainPage' };
    }

    if (to.meta.requiresAuth && !auth.user) {
        return {
            name: 'login',
            query: { redirect: to.fullPath }
        };
    }

    return true;
})

export default router;
