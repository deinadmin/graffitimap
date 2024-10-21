import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import naive from 'naive-ui'

import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'


const app = createApp(App)

app.use(router)
app.use(naive)
app.mount('#app')
