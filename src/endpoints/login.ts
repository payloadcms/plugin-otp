import type { PayloadHandler } from 'payload'

import { addDataAndFileToRequest, generatePayloadCookie } from 'payload'

import { loginWithOTP } from '../operations/login.js'

type Args = {
  collection: string
}

export const getLoginHandler =
  ({ collection }: Args): PayloadHandler =>
  async (req) => {
    const collectionConfig = req.payload.collections[collection].config

    await addDataAndFileToRequest(req)

    const { exp, token, user } = await loginWithOTP({
      type: req.data?.type,
      collection,
      otp: req.data?.otp,
      req,
      value: req.data?.value,
    })

    const cookie = generatePayloadCookie({
      collectionAuthConfig: collectionConfig.auth,
      cookiePrefix: req.payload.config.cookiePrefix,
      token,
    })

    const result: Record<string, unknown> = {
      exp,
      message: 'Successfully logged in with one-time password.',
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
