import { addDataAndFileToRequest, type PayloadHandler } from 'payload'

import { setOTP } from '../operations/requestOTP.js'

type Args = {
  collection: string
}

export const getRequestOTPHandler =
  ({ collection }: Args): PayloadHandler =>
  async (req) => {
    await addDataAndFileToRequest(req)

    await setOTP({
      type: req.data?.type,
      collection,
      payload: req.payload,
      value: req.data?.value,
    })

    return Response.json({
      type: req.data?.type,
      message: 'Successfully sent one-time password.',
      value: req.data?.value,
    })
  }
