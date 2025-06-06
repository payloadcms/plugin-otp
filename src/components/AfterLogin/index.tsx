'use client'

import { Link, useConfig } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'after-login-otp'

export const AfterLoginOTP: React.FC = () => {
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()

  return (
    <div className={baseClass}>
      <Link href={`${admin}/otp/request`}>Request a one-time password</Link>
    </div>
  )
}
