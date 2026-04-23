import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
// para usar temas
import { useThemeStore } from '@/stores/theme'
// para tener buscador en filtros y selectores
import VueSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.component('VueSelect', VueSelect)
app.mount('#app')

// inicializamos el tema
const themeStore = useThemeStore()
themeStore.applyTheme(themeStore.theme)
