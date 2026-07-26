/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ipl: {
          dark: '#0a0e1a',
          darker: '#060810',
          card: '#111827',
          cardLight: '#1a2236',
          gold: '#D4AF37',
          goldLight: '#F5C453',
          goldPale: '#FFE082',
          gray: '#8F9CAE',
          grayDark: '#4B5563',
          glow: 'rgba(212, 175, 55, 0.15)',
          red: '#EF4444',
          green: '#10B981',
          blue: '#2563EB',
          purple: '#7C3AED',
          cyan: '#06B6D4',
        },
        // IPL franchise colors
        team: {
          csk: '#FFCB05',
          mi: '#004BA0',
          rcb: '#EC1C24',
          dc: '#004C93',
          kkr: '#3A225D',
          srh: '#FF822A',
          rr: '#E73895',
          pbks: '#ED1B24',
          gt: '#1C1C2B',
          lsg: '#A72056',
        }
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(245, 196, 83, 0.25), 0 0 4px rgba(245, 196, 83, 0.1)',
        'gold-glow-large': '0 0 50px rgba(245, 196, 83, 0.35), 0 4px 20px rgba(0,0,0,0.5)',
        'gold-glow-intense': '0 0 80px rgba(245, 196, 83, 0.5), 0 0 30px rgba(245, 196, 83, 0.3)',
        'red-glow': '0 0 20px rgba(239, 68, 68, 0.3)',
        'green-glow': '0 0 20px rgba(16, 185, 129, 0.3)',
        'blue-glow': '0 0 20px rgba(37, 99, 235, 0.3)',
        'purple-glow': '0 0 20px rgba(124, 58, 237, 0.3)',
        'inner-gold': 'inset 0 0 20px rgba(245, 196, 83, 0.08)',
        'card-elevated': '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'gavel': 'gavel 0.6s ease-out',
        'confetti-fall': 'confettiFall 3s ease-in forwards',
        'live-dot': 'liveDot 1.5s ease-in-out infinite',
        'countdown-pulse': 'countdownPulse 1s ease-in-out infinite',
        'bid-flash': 'bidFlash 0.5s ease-out',
        'sold-stamp': 'soldStamp 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gavel: {
          '0%': { transform: 'rotate(-20deg) scale(1.3)' },
          '50%': { transform: 'rotate(5deg) scale(1)' },
          '100%': { transform: 'rotate(0deg) scale(1)' },
        },
        confettiFall: {
          '0%': { opacity: '1', transform: 'translateY(-100%) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translateY(100vh) rotate(720deg)' },
        },
        liveDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.8)' },
        },
        countdownPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        bidFlash: {
          '0%': { backgroundColor: 'rgba(245, 196, 83, 0.3)', transform: 'scale(1.02)' },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' },
        },
        soldStamp: {
          '0%': { opacity: '0', transform: 'scale(3) rotate(-15deg)' },
          '60%': { opacity: '1', transform: 'scale(0.9) rotate(-5deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      fontFamily: {
        'display': ['Syncopate', 'sans-serif'],
        'body': ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
