const KEY = 'manual-lash:onboarded:v1'

export function hasSeenWelcome() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markWelcomeSeen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // segue sem salvar
  }
}
