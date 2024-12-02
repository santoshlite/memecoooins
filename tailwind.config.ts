/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Degular', 'sans-serif'],
			},
			animation: {
				'pulse-slow': 'pulse 1s infinite',
				'bounce-slow': 'bounce 2s infinite',
				'blink': 'blink 1s  infinite',
				'blink-fast': 'blink 0.5s infinite'
			},
			keyframes: {
				blink: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				}
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography')
	]
};