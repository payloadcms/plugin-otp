import type { Payload } from 'payload'

import { createHmac } from 'crypto'

type Args = {
  payload: Payload
  value: string
}

export const encrypt = ({ payload, value }: Args) =>
  createHmac('sha1', payload.secret).update(value).digest('hex')
