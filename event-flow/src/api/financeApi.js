import apiClient from './client'
import { unwrapData, unwrapResponse } from './response'

function getFilenameFromContentDisposition(contentDisposition, fallback) {
  if (!contentDisposition) return fallback

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1].replace(/["']/g, ''))
    } catch {
      return encodedMatch[1].replace(/["']/g, '')
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return filenameMatch?.[1] || fallback
}

function getExportFallbackFilename(eventId, format) {
  const normalizedFormat = String(format || 'excel').toLowerCase()
  const extension = normalizedFormat === 'pdf' ? 'pdf' : 'xlsx'
  return `finance-event-${eventId}.${extension}`
}

function triggerBrowserDownload(blob, filename) {
  if (!globalThis.document || !globalThis.URL) return null

  const url = globalThis.URL.createObjectURL(blob)
  const link = globalThis.document.createElement('a')
  link.href = url
  link.download = filename
  globalThis.document.body.appendChild(link)
  link.click()
  link.remove()
  globalThis.URL.revokeObjectURL(url)
  return filename
}

function getLongIdFromUuid(value) {
  if (typeof value !== 'string' || !value.includes('-')) return value

  const parts = value.split('-')
  if (parts.length !== 5) return value

  try {
    const lowBits = BigInt(`0x${parts[3]}${parts[4]}`)
    return lowBits.toString()
  } catch {
    return value
  }
}

function normalizeFinanceParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      key.toLowerCase().endsWith('id') ? getLongIdFromUuid(value) : value,
    ])
  )
}

function normalizeFinancePage(data, pageSize = 20) {
  const unwrapped = unwrapData(data)
  if (!unwrapped || typeof unwrapped !== 'object') {
    return { items: [], total: 0, pages: 0, currentPage: 0, size: pageSize }
  }

  const page = typeof unwrapped.page === 'object' ? unwrapped.page : {}
  return {
    items: unwrapped.content || unwrapped.items || (Array.isArray(unwrapped) ? unwrapped : []),
    total: unwrapped.totalElements ?? page.totalElements ?? unwrapped.total ?? 0,
    pages: unwrapped.totalPages ?? page.totalPages ?? 0,
    currentPage: unwrapped.currentPage ?? unwrapped.number ?? (typeof unwrapped.page === 'number' ? unwrapped.page : page.number) ?? 0,
    size: unwrapped.size ?? page.size ?? pageSize,
  }
}

export const financeApi = {
  budget: {
    submitForApproval: async (eventId, payload) => {
      const response = await apiClient.post(`/finance/events/${eventId}/budget/submit-for-approval`, payload)
      return unwrapResponse(response)
    },

    approve: async (eventId, payload) => {
      const response = await apiClient.patch(`/finance/events/${eventId}/budget/approve`, payload)
      return unwrapResponse(response)
    },

    reject: async (eventId, payload) => {
      const response = await apiClient.patch(`/finance/events/${eventId}/budget/reject`, payload)
      return unwrapResponse(response)
    },
  },

  majorTasks: {
    create: async (eventId, payload) => {
      const response = await apiClient.post(`/finance/events/${eventId}/major-tasks`, payload)
      return unwrapResponse(response)
    },
    allocateExisting: async (eventId, taskId, payload) => {
      const response = await apiClient.post(`/finance/events/${eventId}/major-tasks/${taskId}/allocate`, payload)
      return unwrapResponse(response)
    },
  },

  expenseRequests: {
    create: async (payload) => {
      const response = await apiClient.post('/finance/expense-requests', payload)
      return unwrapResponse(response)
    },

    list: async (params = {}) => {
      const normalizedParams = normalizeFinanceParams(params)
      const response = await apiClient.get('/finance/expense-requests', { params: normalizedParams })
      return normalizeFinancePage(unwrapResponse(response), normalizedParams.size || 20)
    },

    get: async (expenseRequestId) => {
      const response = await apiClient.get(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}`)
      return unwrapResponse(response)
    },

    approve: async (expenseRequestId, payload) => {
      const response = await apiClient.patch(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}/approve`, payload)
      return unwrapResponse(response)
    },

    reject: async (expenseRequestId, payload) => {
      const response = await apiClient.patch(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}/reject`, payload)
      return unwrapResponse(response)
    },

    needMoreInfo: async (expenseRequestId, payload) => {
      const response = await apiClient.patch(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}/need-more-info`, payload)
      return unwrapResponse(response)
    },

    resubmit: async (expenseRequestId, payload) => {
      const response = await apiClient.patch(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}/resubmit`, payload)
      return unwrapResponse(response)
    },

    uploadAttachment: async (expenseRequestId, fileOrPayload, label) => {
      const file = fileOrPayload?.file || fileOrPayload
      const attachmentLabel = fileOrPayload?.label ?? label
      const formData = new FormData()
      formData.append('file', file)
      if (attachmentLabel) formData.append('label', attachmentLabel)

      const response = await apiClient.post(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return unwrapResponse(response)
    },

    submit: async (expenseRequestId) => {
      const response = await apiClient.patch(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}/submit`)
      return unwrapResponse(response)
    },

    commit: async (expenseRequestId) => {
      const response = await apiClient.patch(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}/commit`)
      return unwrapResponse(response)
    },

    escalate: async (expenseRequestId, payload) => {
      const response = await apiClient.patch(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}/escalate`, payload)
      return unwrapResponse(response)
    },

    cancel: async (expenseRequestId, payload) => {
      const response = await apiClient.patch(`/finance/expense-requests/${getLongIdFromUuid(expenseRequestId)}/cancel`, payload)
      return unwrapResponse(response)
    },
  },

  payments: {
    listByEvent: async (eventId) => {
      const response = await apiClient.get(`/finance/payments/events/${eventId}`)
      return unwrapResponse(response)
    },

    get: async (paymentId) => {
      const response = await apiClient.get(`/finance/payments/${getLongIdFromUuid(paymentId)}`)
      return unwrapResponse(response)
    },

    approve: async (paymentId, payload = {}) => {
      const response = await apiClient.patch(`/finance/payments/${getLongIdFromUuid(paymentId)}/approve`, payload)
      return unwrapResponse(response)
    },

    pay: async (paymentId, payload) => {
      const response = await apiClient.patch(`/finance/payments/${getLongIdFromUuid(paymentId)}/pay`, normalizeFinanceParams(payload))
      return unwrapResponse(response)
    },

    reverse: async (paymentId, payload) => {
      const response = await apiClient.post(`/finance/payments/${getLongIdFromUuid(paymentId)}/reverse`, payload)
      return unwrapResponse(response)
    },
  },

  reallocation: {
    getInternalBalances: async (majorTaskId) => {
      const response = await apiClient.get('/finance/reallocate/internal/balances', {
        params: { majorTaskId: getLongIdFromUuid(majorTaskId) },
      })
      return unwrapResponse(response)
    },

    allocateSubtask: async (payload) => {
      const response = await apiClient.post('/finance/reallocate/internal/allocate', normalizeFinanceParams(payload))
      return unwrapResponse(response)
    },

    internal: async (payload) => {
      const response = await apiClient.post('/finance/reallocate/internal', normalizeFinanceParams(payload))
      return unwrapResponse(response)
    },

    escalate: async (payload) => {
      const response = await apiClient.post('/finance/reallocate/escalate', normalizeFinanceParams(payload))
      return unwrapResponse(response)
    },
  },

  dashboard: {
    getByEvent: async (eventId) => {
      const response = await apiClient.get(`/finance/events/${eventId}/dashboard`)
      return unwrapResponse(response)
    },
  },

  exports: {
    getEventExport: async (eventId, format = 'excel') => {
      const response = await apiClient.get(`/finance/events/${eventId}/export`, {
        params: { format },
        responseType: 'blob',
      })
      const filename = getFilenameFromContentDisposition(
        response.headers?.['content-disposition'],
        getExportFallbackFilename(eventId, format)
      )
      return {
        blob: response.data,
        filename,
        contentType: response.headers?.['content-type'] || '',
      }
    },

    downloadEventExport: async (eventId, format = 'excel') => {
      const exportedFile = await financeApi.exports.getEventExport(eventId, format)
      triggerBrowserDownload(exportedFile.blob, exportedFile.filename)
      return exportedFile
    },
  },
}
