import type { Plugin } from 'payload'

import { InvalidConfiguration } from 'payload'

import type { OTPPluginOptions } from './types.js'

import { defaultUserCollection } from './defaults.js'
import { getLoginHandler } from './endpoints/login.js'
import { getRequestOTPHandler } from './endpoints/request.js'

export const pluginOTP =
  (options: OTPPluginOptions): Plugin =>
  (config) => {
    config.custom = {
      ...(config.custom || {}),
      otp: options,
    }

    if (options.admin !== false) {
      if (!config.admin) {
        config.admin = {}
      }
      if (!config.admin.components) {
        config.admin.components = {}
      }
      if (!config.admin.components.afterLogin) {
        config.admin.components.afterLogin = []
      }

      if (!config.admin.components.views) {
        config.admin.components.views = {}
      }

      config.admin.components.afterLogin.push('@payloadcms/plugin-otp/client#AfterLoginOTP')

      config.admin.components.views.requestOTP = {
        Component: '@payloadcms/plugin-otp/client#RequestOTP',
        exact: true,
        meta: {
          titleSuffix: ' - Request one-time password',
        },
        path: '/otp/request',
      }

      config.admin.components.views.loginOTP = {
        Component: '@payloadcms/plugin-otp/client#LoginOTP',
        exact: true,
        meta: {
          titleSuffix: ' - Login with one-time password',
        },
        path: '/otp/login',
      }
    }

    Object.keys(options.collections).forEach((collectionSlug) => {
      let matchedCollection = config.collections?.find(({ slug }) => slug === collectionSlug)

      if (!matchedCollection && collectionSlug === 'users') {
        config.collections?.push(defaultUserCollection)
        matchedCollection = defaultUserCollection
      }

      if (!matchedCollection) {
        throw new InvalidConfiguration(
          `You have enabled one-time password for the collection "${collectionSlug}" which does not exist.`,
        )
      }

      matchedCollection.fields.push({
        name: '_otp',
        type: 'text',
        hidden: true,
        index: true,
      })

      matchedCollection.fields.push({
        name: '_otpExpiration',
        type: 'date',
        hidden: true,
        index: true,
      })

      if (!matchedCollection.endpoints) {
        matchedCollection.endpoints = []
      }

      matchedCollection.endpoints.push({
        handler: getRequestOTPHandler({ collection: collectionSlug }),
        method: 'post',
        path: '/otp/request',
      })

      matchedCollection.endpoints.push({
        handler: getLoginHandler({ collection: collectionSlug }),
        method: 'post',
        path: '/otp/login',
      })
    })

    return config
  }
