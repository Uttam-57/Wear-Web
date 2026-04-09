import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '@/styles/index.css'
import { logger } from '@/shared/utils/logger'

const attachGlobalErrorHandlers = () => {
    if (window.__WEAR_WEB_GLOBAL_LOGGER_READY__) return

    window.__WEAR_WEB_GLOBAL_LOGGER_READY__ = true

    window.addEventListener('error', (event) => {
        logger.error('Unhandled browser error', {
            message: event.message,
            source: event.filename,
            line: event.lineno,
            column: event.colno,
            error: event.error,
        })
    })

    window.addEventListener('unhandledrejection', (event) => {
        logger.error('Unhandled promise rejection', {
            reason: event.reason,
        })
    })
}

attachGlobalErrorHandlers()

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
)