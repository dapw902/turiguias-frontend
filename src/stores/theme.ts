import { defineStore } from 'pinia'
import { ref } from 'vue'

// store para gestionar el tema de la aplicación (claro/oscuro)
export const useThemeStore = defineStore('theme', () => {
  // leemos el tema guardado o usamos cupcake por defecto
  const theme = ref(localStorage.getItem('theme') ?? 'cupcake')

  // aplicamos el tema al documento
  function applyTheme(newTheme: string) {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // alternamos entre cupcake y forest
  function toggleTheme() {
    applyTheme(theme.value === 'cupcake' ? 'forest' : 'cupcake')
  }

  // aplicamos el tema guardado al arrancar
  applyTheme(theme.value)

  return { theme, toggleTheme, applyTheme }
})
