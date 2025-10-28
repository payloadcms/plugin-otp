import type { AdminViewServerProps } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import { LoginView } from '@payloadcms/next/views'
import React from 'react'

export function DefaultLogin(props: AdminViewServerProps) {
  const builtInView = LoginView(props)

  return <MinimalTemplate>{builtInView}</MinimalTemplate>
}
