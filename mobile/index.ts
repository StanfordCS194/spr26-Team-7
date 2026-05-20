import { registerRootComponent } from 'expo'
import { createElement } from 'react'

import App from './App'
import { AuthProvider } from './src/providers/AuthProvider'

const Root = () => createElement(AuthProvider, null, createElement(App))

registerRootComponent(Root)
