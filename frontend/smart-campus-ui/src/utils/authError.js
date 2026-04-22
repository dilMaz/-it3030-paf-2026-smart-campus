export function getAuthErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message.trim()
  }

  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    return responseData.error.trim()
  }

  if (Array.isArray(responseData?.details) && responseData.details.length > 0) {
    const firstDetail = responseData.details.find((detail) => typeof detail === 'string' && detail.trim())
    if (firstDetail) {
      return firstDetail.trim()
    }
  }

  return fallbackMessage
}
