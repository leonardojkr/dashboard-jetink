import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VChart from 'vue-echarts'
import { router } from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('VChart', VChart)

app.mount('#app')
