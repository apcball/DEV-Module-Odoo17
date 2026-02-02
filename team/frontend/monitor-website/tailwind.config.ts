import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        card: '#1E293B',
        online: '#10B981',
        warning: '#F59E0B',
        offline: '#EF4444',
        border: '#334155',
        muted: '#64748B',
      },
    },
  },
  plugins: [],
}
export default config
