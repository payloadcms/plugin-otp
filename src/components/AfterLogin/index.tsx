'use client'

import { Link, useConfig } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation.js'
import React from 'react'

import './index.scss'

const baseClass = 'after-login-otp'

export const AfterLoginOTP: React.FC = () => {
  const redirect = useSearchParams().get('redirect')
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()

  return (
    <div className={baseClass}>
      <Link href={`${admin}/otp/request${redirect ? '?redirect=' + redirect : ''}`}>
        Request a one-time password
      </Link>
    </div>
  )
}
