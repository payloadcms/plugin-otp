import type { PayloadHandler } from 'payload'

import { setOTP } from '../operations/setOTP.js'

type Args = {
  collection: string
}

export const getOTPHandler =
  ({ collection }: Args): PayloadHandler =>
  async (req) => {
    if (typeof req.json !== 'function') {
      return Response.json(
        { message: 'Request must be of Content-Type: application/json' },
        { status: 400 },
      )
    }

    const body = await req.json()

    await setOTP({
      ...body,
      collection,
      payload: req.payload,
    })

    return Response.json({ message: 'Successfully sent one-time password.' })
  }
