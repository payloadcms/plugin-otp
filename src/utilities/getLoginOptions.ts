import type { Auth } from 'payload'

export const getLoginOptions = (
  loginWithUsername: Auth['loginWithUsername'],
): {
  canLoginWithEmail: boolean
  canLoginWithUsername: boolean
} => {
  return {
    canLoginWithEmail: Boolean(!loginWithUsername || loginWithUsername.allowEmailLogin),
    canLoginWithUsername: Boolean(loginWithUsername),
  }
}
