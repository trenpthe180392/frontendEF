import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

if (window.location.hash === '#_=_') {
  history.replaceState(
    '',
    document.title,
    window.location.pathname + window.location.search
  )
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
