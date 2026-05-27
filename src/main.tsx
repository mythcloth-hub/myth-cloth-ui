import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { GoogleAuthProvider } from './auth/GoogleAuthContext.tsx'
import { ThemeContextProvider } from './theme/ThemeContext.tsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleAuthProvider>
        <ThemeContextProvider>
          <App />
        </ThemeContextProvider>
      </GoogleAuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)