import type { PayloadHandler } from 'payload'

import { generatePayloadCookie } from 'payload'

import { loginWithOTP } from '../operations/login.js'

type Args = {
  collection: string
}

export const getLoginHandler =
  ({ collection }: Args): PayloadHandler =>
  async (req) => {
    const collectionConfig = req.payload.collections[collection].config

    if (typeof req.json !== 'function') {
      return Response.json(
        { message: 'Request must be of Content-Type: application/json' },
        { status: 400 },
      )
    }

    const body = await req.json()

    const { exp, token, user } = await loginWithOTP({ ...body, collection, req })

    const cookie = generatePayloadCookie({
      collectionAuthConfig: collectionConfig.auth,
      cookiePrefix: req.payload.config.cookiePrefix,
      token,
    })

    const result: Record<string, unknown> = {
      exp,
      user,
    }

    if (!collectionConfig.auth.removeTokenFromResponses) {
      result.token = token
    }

    return Response.json(result, {
      headers: new Headers({
        'Set-Cookie': cookie,
      }),
    })
  }
