import fs from 'fs'

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs', { recursive: true })
}

export const logWriter = fs.createWriteStream(`logs/log-${Date.now()}.txt`)
