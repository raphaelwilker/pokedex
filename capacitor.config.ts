import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.raphaelwilker.pokedex',
  appName: 'Pokédex',
  webDir: 'dist',
  backgroundColor: '#dc0a2d',
  plugins: {
    SplashScreen: {
      backgroundColor: '#dc0a2d',
      launchAutoHide: true, // fallback: the app also hides it as soon as it is ready
      launchShowDuration: 2500,
      launchFadeOutDuration: 200
    },
    StatusBar: {
      backgroundColor: '#dc0a2d',
      style: 'DARK' // light icons on the red bar
    }
  }
}

export default config
