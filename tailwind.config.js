/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Android Studio / IntelliJ IDEA (New UI) Dark Palette
        jb: {
          bg: '#1E1F22',          // Fundo Principal (Janela/Editor)
          panel: '#2B2D30',       // Superfície Secundária / Painéis Laterais
          elevated: '#393B40',    // Superfície Elevada / Modais
          popup: '#3C3F41',       // Menus Pop-up
          border: '#43454A',      // Bordas e Divisores Sutis
          borderStrong: '#4E5157',// Bordas de Destaque
          text: '#BCBEC4',        // Texto Principal (Alta Ênfase)
          textMuted: '#7A7E85',   // Texto Secundário / Labels
          accent: '#3574F0',      // Acento / Seleção Ativa / Foco
          accentHover: '#2E436E', // Seleção de Lista Ativa
          hover: '#2E3136',       // Hover Inativo
          success: '#5FAD65',     // Status Sucesso
          warning: '#F2C55C',     // Status Alerta
          error: '#E55765',       // Status Erro
        }
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '8px',
        '2xl': '8px',
        '3xl': '8px'
      }
    },
  },
  plugins: [],
}
