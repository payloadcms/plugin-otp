'use client'

import type { AdminViewClientProps, ValidateOptions } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import {
  EmailField,
  Form,
  FormSubmit,
  HiddenField,
  Link,
  TextField,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { email, username } from 'payload/shared'
import React from 'react'

import { getLoginOptions } from '../../utilities/getLoginOptions.js'
import { localStorageKey } from '../shared.js'

const baseClass = 'request-otp'

type RequestOTPProps = {
  defaultToOTP?: boolean
} & AdminViewClientProps

export const RequestOTP: React.FC<RequestOTPProps> = (props) => {
  const { config, getEntityConfig } = useConfig()
  const { t } = useTranslation()
  const router = useRouter()

  const {
    admin: { user: userSlug },
    routes: { admin, api },
  } = config

  const defaultToOTP = props?.defaultToOTP === true

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

  const onSuccess = React.useCallback(
    (args: unknown) => {
      const { value } = args as { value: string }
      router.push(`${admin}/otp/login`)
      window.localStorage.setItem(localStorageKey, value)
    },
    [router, admin],
  )

  return (
    <MinimalTemplate className={baseClass}>
      <h3>Request a one-time password</h3>
      <br />
      <Form
        action={`${api}/${userSlug}/otp/request`}
        method="POST"
        onSuccess={onSuccess}
        waitForAutocomplete
      >
        <HiddenField path="type" value={loginType} />
        {loginType === 'email' && (
          <EmailField
            field={{
              name: 'value',
              admin: {
                autoComplete: 'email',
                placeholder: '',
              },
              label: t('general:email'),
              required: true,
            }}
            path="value"
            validate={email}
          />
        )}
        {loginType === 'username' && (
          <TextField
            field={{
              name: 'value',
              label: t('authentication:username'),
              required: true,
            }}
            path="value"
            validate={username}
          />
        )}
        {loginType === 'emailOrUsername' && (
          <TextField
            field={{
              name: 'value',
              label: t('authentication:emailOrUsername'),
              required: true,
            }}
            path="value"
            validate={(value, options) => {
              const passesUsername = username(value, options)
              const passesEmail = email(
                value,
                options as ValidateOptions<any, { username?: string }, any, any>,
              )

              if (!passesEmail && !passesUsername) {
                return `${t('general:email')}: ${passesEmail} ${t('general:username')}: ${passesUsername}`
              }

              return true
            }}
          />
        )}
        <FormSubmit size="large">Request one-time password</FormSubmit>
      </Form>
      <Link href={`${admin}/login${defaultToOTP ? '/default' : ''}`}>Back to login</Link>
    </MinimalTemplate>
  )
}
