import fs from 'fs'

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs', { recursive: true })
}

export const logWriter = fs.createWriteStream(`logs/log-${new Date().toISOString().slice(0, 19)}.txt`)
