import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import * as ReactDOM from 'react-dom/client'
import App from './App'


const rootElement = document.getElementById('root') as HTMLElement
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)