import { registerRootComponent } from 'expo'
import { createElement } from 'react'

import App from './App'
import { AuthProvider } from './src/providers/AuthProvider'
import { MLProvider } from './src/ml/MLProvider'

const Root = () =>
  createElement(AuthProvider, null, createElement(MLProvider, null, createElement(App)))

registerRootComponent(Root)
