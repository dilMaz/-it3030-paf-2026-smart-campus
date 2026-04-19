import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            color: '#0f172a',
          },
        }}
      />
      <App />
    </AuthProvider>
  </StrictMode>,
)
