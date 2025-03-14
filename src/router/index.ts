import { createRouter, createWebHashHistory } from 'vue-router';
const history = createWebHashHistory(); // 如需hash替换成createWebHashHistory
const routes: any[] = [
    {
        path: '/',
        redirect: '/index'
    },
    {
        path: '/index',
        name: 'index',
        component: () => import('@/views/home/index.vue'),
    },
];

const router = createRouter({
    history,
    scrollBehavior: () => ({ top: 0 }),
    routes
});

export default router;
