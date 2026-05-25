/**
 * API Response Normalization Helpers
 * 
 * Handles mixed backend response shapes:
 * 1. Direct DTO/List/Page: The response body is the data itself.
 * 2. Wrapped ApiResponseDTO: { success: boolean, message: string, data: T }
 */

/**
 * Unwraps the axios response to get the actual data.
 * If the body is a wrapped ApiResponseDTO, it returns the 'data' property.
 * @param {import('axios').AxiosResponse} response 
 * @returns {any} The unwrapped data or the original body.
 */
export function unwrapResponse(response) {
  const body = response?.data;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data ?? body;
  }
  return body;
}

/**
 * Unwraps a response body. Useful when the body is already extracted from axios.
 * @param {any} body 
 * @returns {any}
 */
export function unwrapData(body) {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data ?? body;
  }
  return body;
}

/**
 * Extracts a user-friendly message from a response or error.
 * @param {any} responseOrError - AxiosResponse or AxiosError
 * @param {string} fallback - Default message if none found
 * @returns {string}
 */
export function getApiMessage(responseOrError, fallback = 'An unexpected error occurred') {
  if (!responseOrError) return fallback;

  // Case 1: Successful wrapped response
  if (responseOrError?.data && typeof responseOrError.data === 'object' && 'message' in responseOrError.data) {
    return responseOrError.data.message;
  }

  // Case 2: Axios Error
  if (responseOrError?.response?.data && typeof responseOrError.response.data === 'object') {
    return responseOrError.response.data.message || responseOrError.response.data.errorCode || fallback;
  }

  // Case 3: Generic error message
  if (typeof responseOrError === 'string') return responseOrError;
  if (responseOrError?.message) return responseOrError.message;

  return fallback;
}

/**
 * Normalizes a paginated response to a consistent format.
 * Supports Spring Page: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 }
 * @param {any} data - The paginated data
 * @param {number} pageSize - Default page size if not provided by backend
 * @returns {{ items: Array, total: number, pages: number, currentPage: number }}
 */
export function normalizePageResponse(data, pageSize = 10) {
  if (!data) return { items: [], total: 0, pages: 0, currentPage: 0 };

  // Handle wrapped ApiResponseDTO
  const unwrapped = unwrapData(data);

  if (unwrapped && typeof unwrapped === 'object') {
    const page = unwrapped.page || {};
    return {
      items: unwrapped.content || unwrapped.items || (Array.isArray(unwrapped) ? unwrapped : []),
      total: unwrapped.totalElements ?? page.totalElements ?? unwrapped.total ?? 0,
      pages: unwrapped.totalPages ?? page.totalPages ?? 0,
      currentPage: unwrapped.number ?? page.number ?? 0,
      size: unwrapped.size ?? page.size ?? pageSize,
    };
  }

  return { items: [], total: 0, pages: 0, currentPage: 0 };
}
