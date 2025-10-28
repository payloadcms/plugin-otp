'use client'

import { Link, useConfig } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'after-login-otp'

type AfterLoginOTPProps = {
  defaultToOTP?: boolean
}

export const AfterLoginOTP: React.FC<AfterLoginOTPProps> = ({ defaultToOTP = false }) => {
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()

  return (
    <div className={baseClass}>
      <Link href={`${admin}${defaultToOTP ? '/login' : '/otp/request'}`}>
        Request a one-time password
      </Link>
    </div>
  )
}
