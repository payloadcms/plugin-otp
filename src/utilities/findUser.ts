import type { Payload, TypedUser, Where } from 'payload'

import { APIError, ValidationError } from 'payload'

import type { AuthCollectionSlug } from '../types.js'

type Args = {
  collection: AuthCollectionSlug
  otp?: string
  payload: Payload
  type: 'email' | 'id' | 'username'
  value: number | string
}

export const findUser = async ({ type, collection, otp, payload, value }: Args) => {
  const ambiguousError = `The ${type} or one-time password is incorrect.`

  const where: Where = {
    [type]: {
      equals: value,
    },
  }

  const userQuery = await payload.find({
    collection,
    limit: 1,
    where,
  })

  if (userQuery.totalDocs > 1) {
    throw new APIError(
      `Error looking up user by ${type} of ${value} - exactly one user was not returned`,
    )
  }

  let user = userQuery.docs[0]

  if (otp) {
    where._otp = { equals: otp }
    where._otpExpiration = { greater_than: new Date().toISOString() }

    const matchedOTPQuery = await payload.find({
      collection,
      limit: 1,
      pagination: false,
      where,
    })

    const userWithMatchingOTP = matchedOTPQuery.docs[0]

    if (!userWithMatchingOTP || userWithMatchingOTP.id !== user.id) {
      throw new ValidationError({
        collection,
        errors: [
          {
            label: 'One-time password',
            message: 'Failed logging in with one-time password.',
            path: 'otp',
          },
        ],
      })
    }

    user = userWithMatchingOTP
  }

  if (!user) {
    throw new APIError(ambiguousError, 400)
  }

  return user as TypedUser
}
