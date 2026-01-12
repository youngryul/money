/**
 * 비동기 함수 실행 헬퍼
 * 에러를 사용자 친화적인 메시지로 변환
 */
export function handleAsyncError(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}
