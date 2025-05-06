import type { CollectionConfig } from 'payload'

import type { GenerateOTPEmailHTML, GenerateOTPEmailSubject } from './types.js'

export const defaultExp = 300

export const getDefaultOTPEmailHTML: GenerateOTPEmailHTML = ({ otp }) =>
  `You are receiving this because you (or someone else) have requested a one-time password to log into your account. The code is <strong>${otp}</strong>.`

export const getDefaultOTPEmailSubject: GenerateOTPEmailSubject = ({ otp }) =>
  `One-time password login`

export const defaultUserCollection: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 7200,
  },
  fields: [],
  labels: {
    plural: ({ t }) => t('general:users'),
    singular: ({ t }) => t('general:user'),
  },
}
