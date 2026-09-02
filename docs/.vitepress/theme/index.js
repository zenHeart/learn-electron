import DefaultTheme from 'vitepress/theme'
import './custom.css'
import OrbitHero from './components/OrbitHero.vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('OrbitHero', OrbitHero)
  }
}
