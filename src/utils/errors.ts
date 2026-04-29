// helper para extraer mensaje de error del backend de forma consistente
export function extractError(e: unknown, fallback: string): string {
  const axiosError = e as { response?: { data?: { message?: string | string[] } } }
  const msg = axiosError?.response?.data?.message
  if (Array.isArray(msg)) {
    const first = msg[0]
    return typeof first === 'string' ? first : fallback
  }
  if (typeof msg === 'string') return msg
  return fallback
}
