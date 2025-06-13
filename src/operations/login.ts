import type { PayloadRequest, TypedUser } from 'payload'

import {
  APIError,
  checkLoginPermission,
  getFieldsToSign,
  incrementLoginAttempts,
  jwtSign,
  ValidationError,
} from 'payload'

import type { AuthCollectionSlug, FindUserType } from '../types.js'

import { encrypt } from '../utilities/encrypt.js'
import { findUser } from '../utilities/findUser.js'
import { getLoginOptions } from '../utilities/getLoginOptions.js'

type BaseArgs = {
  collection: AuthCollectionSlug
  otp: string
  req: PayloadRequest
}

type Args = BaseArgs & FindUserType

export const loginWithOTP = async ({ type, collection, otp, req, value }: Args) => {
  const { context, payload } = req
  const collectionConfig = payload.collections[collection].config

  const matchedUser = await findUser({
    type,
    collection,
    otp: encrypt({ payload, value: otp }),
    payload,
    value,
  })

  const maxLoginAttemptsEnabled = collectionConfig.auth.maxLoginAttempts > 0

  if (!matchedUser) {
    if (maxLoginAttemptsEnabled) {
      await incrementLoginAttempts({
        collection: collectionConfig,
        doc: matchedUser,
        payload: req.payload,
        req,
      })
    }

    throw new ValidationError({
      collection: collectionConfig.slug,
      errors: [
        {
          message: 'Failed logging in with one-time password.',
          path: 'otp',
        },
      ],
    })
  }

  let user: TypedUser = {
    ...matchedUser,
    collection,
  }

  const { canLoginWithUsername } = getLoginOptions(collectionConfig.auth?.loginWithUsername)

  checkLoginPermission({
    collection: collectionConfig,
    loggingInWithUsername: Boolean(canLoginWithUsername && type === 'username'),
    req,
    user,
  })

  if (collectionConfig.hooks?.beforeLogin?.length) {
    for (const hook of collectionConfig.hooks.beforeLogin) {
      user =
        (await hook({
          collection: collectionConfig,
          context,
          req,
          user,
        })) || user
    }
  }

  req.user = user

  const { exp, token } = await jwtSign({
    fieldsToSign: getFieldsToSign({ collectionConfig, email: user.emai || '', user }),
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  if (collectionConfig.hooks?.afterLogin?.length) {
    for (const hook of collectionConfig.hooks.afterLogin) {
      user =
        (await hook({
          collection: collectionConfig,
          context,
          req,
          token,
          user,
        })) || user
    }
  }

  const dataToUpdate: Record<string, unknown> = {
    _otp: null,
    _otpExpiration: null,
  }

  if (maxLoginAttemptsEnabled) {
    dataToUpdate.lockUntil = null
    dataToUpdate.loginAttempts = 0
  }

  const userData = await payload.db.findOne({
    collection,
    joins: false,
    where: { id: { equals: user.id } },
  })

  if (!userData) {
    throw new APIError(`User with ID=${user.id} was not found.`)
  }

  await payload.db.updateOne({
    id: user.id,
    collection,
    data: {
      ...userData,
      dataToUpdate,
    },
  })

  return { exp, token, user }
}
