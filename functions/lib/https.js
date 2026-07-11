const { HttpsError } = require('firebase-functions/v2/https')

function isHttpsError(error) {
  return error instanceof HttpsError || typeof error?.code === 'string'
    && typeof error?.message === 'string'
    && typeof error?.httpErrorCode?.status === 'number'
}

function wrapCallable(handler) {
  return async request => {
    try {
      return await handler(request)
    } catch (error) {
      if (isHttpsError(error)) throw error
      throw new HttpsError('internal', 'The operation could not be completed.')
    }
  }
}

module.exports = {
  wrapCallable,
}
