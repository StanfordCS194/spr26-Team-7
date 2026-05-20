const fs = require('fs')
const path = require('path')
const { config: loadDotenv } = require('dotenv')

const rootDir = __dirname

const loadEnvFile = (filename, override = false) => {
  const filePath = path.join(rootDir, filename)
  if (!fs.existsSync(filePath)) {
    return
  }

  loadDotenv({ path: filePath, override })
}

loadEnvFile('.env.shared')
loadEnvFile('.env', true)

module.exports = require('./app.json')
