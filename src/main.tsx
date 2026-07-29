import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeContextProvider } from './theme/ThemeContext.tsx';
import { AuthProvider } from './auth/AuthContext.tsx';
import { CurrencyProvider } from './currency/CurrencyContext.tsx';

// eslint-disable-next-line @typescript-eslint/no-unused-vars

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CurrencyProvider>
        <ThemeContextProvider>
          <App />
        </ThemeContextProvider>
      </CurrencyProvider>
    </AuthProvider>
  </StrictMode>
)