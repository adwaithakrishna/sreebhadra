/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#173C32', 800: '#1F4A3E', 700: '#2A5A4C', 900: '#0F2A23' },
        sage: { DEFAULT: '#A8B7A0', 200: '#D3DBCE', 100: '#E6EBE2' },
        ivory: { DEFAULT: '#F7F4EC', 200: '#EEE9DB' },
        sun: { DEFAULT: '#E9A83A', 600: '#D4922A', 100: '#FBEBCB' },
        charcoal: { DEFAULT: '#252A27', 600: '#4A524D' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rise: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'none' } },
        drift: { '0%,100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(14px)' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
      },
      animation: {
        rise: 'rise .8s cubic-bezier(.2,.7,.2,1) both',
        drift: 'drift 9s ease-in-out infinite',
        fade: 'fade .25s ease both',
        slideIn: 'slideIn .3s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
};
