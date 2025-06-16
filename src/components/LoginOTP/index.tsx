'use client'

import type { AdminViewClientProps, FormState } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import {
  Form,
  FormSubmit,
  HiddenField,
  Link,
  TextField,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { useRouter, useSearchParams } from 'next/navigation.js'
import React from 'react'

import { getLoginOptions } from '../../utilities/getLoginOptions.js'
import { localStorageKey } from '../shared.js'

const baseClass = 'login-otp'

export const LoginOTP: React.FC<AdminViewClientProps> = () => {
  const redirect = useSearchParams().get('redirect')
  const { config, getEntityConfig } = useConfig()
  const { t } = useTranslation()
  const router = useRouter()

  const {
    admin: { user: userSlug },
    routes: { admin, api },
  } = config

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug })
  const { auth: authOptions } = collectionConfig
  const loginWithUsername = authOptions?.loginWithUsername
  const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername ?? false)

  const [loginType] = React.useState<'email' | 'emailOrUsername' | 'username'>(() => {
    if (canLoginWithEmail && canLoginWithUsername) {
      return 'emailOrUsername'
    }
    if (canLoginWithUsername) {
      return 'username'
    }
    return 'email'
  })

  const [initialState] = React.useState<FormState>(() => {
    const loginIdentifier =
      typeof window !== 'undefined' ? window.localStorage.getItem(localStorageKey) : ''

    return {
      value: {
        value: loginIdentifier,
      },
    }
  })

  const handleRedirect = React.useCallback(() => {
    router.push(redirect ?? admin)
    window.localStorage.removeItem(localStorageKey)
  }, [router, admin, redirect])

  return (
    <MinimalTemplate>
      <h3>Log in with one-time password</h3>
      <br />
      <Form
        action={`${api}/${userSlug}/otp/login`}
        className={baseClass}
        initialState={initialState}
        method="POST"
        onSuccess={handleRedirect}
        waitForAutocomplete
      >
        <HiddenField path="type" value={loginType} />
        <TextField
          field={{
            name: 'value',
            label: loginType === 'email' ? t('general:email') : t('general:username'),
            required: true,
          }}
          path={'value'}
        />
        <br />
        <TextField
          field={{
            name: 'otp',
            label: 'One-time password',
            required: true,
          }}
          path="otp"
          validate={(value) => {
            if (!value) {
              return 'You must enter a one-time password'
            }
            if (value.length !== 6) {
              return 'Your one-time password should be 6 characters.'
            }
            return true
          }}
        />
        <FormSubmit size="large">Log in</FormSubmit>
      </Form>
      <Link href={`${admin}/login`}>Back to login</Link>
    </MinimalTemplate>
  )
}
