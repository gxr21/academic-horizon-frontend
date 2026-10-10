import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const indexFile = join('dist', 'index.html')
const routes = [
  'login',
  'signup',
  'forgot-password',
  'reset-password',
  'verify-email',
  'home',
  'chat',
  'dashboard',
  'profile',
  'settings',
  'wallet',
  'about',
  'services',
  'help',
  'privacy',
  'terms',
  'admin',
  'price',
]

for (const route of routes) {
  const target = join('dist', route, 'index.html')
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(indexFile, target)
}
