import type { RouteRecordRaw } from 'vue-router'

export interface MicroFrontendConfig {
    name: string
    routes: RouteRecordRaw[]
    layout?: string
    menu?: string
    type?: string
    navItem?: {
        label: string
        order?: number
    }
}
const UI_FRAMEWORK = import.meta.env.VITE_UI_FRAMEWORK || 'bootstrap'

export const config: MicroFrontendConfig = {
    name: 'Home',
    layout: 'WebsiteLayout',
    type: 'website',
    navItem: {
        label: 'Home',
        order: 0 // First item in nav
    },
    routes: [
        {
            path: '/',
            name: 'home',
            component: UI_FRAMEWORK === 'bootstrap'
                ? /* @vite-ignore */ () => import('./views/HomeBootstrap.vue')
                : /* @vite-ignore */ () => import('./views/HomeFomantic.vue'),
            
            meta: {
                title: 'Home'
            }
        }
    ]
}
