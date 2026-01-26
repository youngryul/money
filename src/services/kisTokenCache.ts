/**
 * 한국투자증권 API 토큰 캐싱 서비스
 * 토큰을 localStorage에 저장하고 만료 시간을 관리합니다.
 * 페이지 새로고침 후에도 토큰이 유지됩니다.
 */

interface CachedToken {
  access_token: string
  expires_at: number // Unix timestamp (밀리초)
  appKey: string
  appSecret: string
  isVirtual: boolean
}

const STORAGE_KEY_PREFIX = 'kis_token_cache_'

/**
 * 캐시 키 생성
 */
function getCacheKey(appKey: string, _appSecret: string, isVirtual: boolean): string {
  // appKey와 isVirtual만으로 키 생성 (appSecret은 보안상 키에 포함하지 않음)
  return `${STORAGE_KEY_PREFIX}${appKey}_${isVirtual}`
}

/**
 * 토큰이 유효한지 확인 (만료 5분 전까지 유효)
 */
function isTokenValid(token: CachedToken): boolean {
  const now = Date.now()
  const bufferTime = 5 * 60 * 1000 // 5분 버퍼
  return token.expires_at > now + bufferTime
}

/**
 * 토큰 캐시에서 가져오기 (localStorage 사용)
 */
export function getCachedToken(
  appKey: string,
  appSecret: string,
  isVirtual: boolean
): string | null {
  try {
    const cacheKey = getCacheKey(appKey, appSecret, isVirtual)
    const cachedJson = localStorage.getItem(cacheKey)

    if (!cachedJson) {
      return null
    }

    const cached: CachedToken = JSON.parse(cachedJson)

    // appSecret이 일치하는지 확인 (보안)
    if (cached.appSecret !== appSecret) {
      localStorage.removeItem(cacheKey)
      return null
    }

    // 토큰이 유효한지 확인
    if (isTokenValid(cached)) {
      return cached.access_token
    }

    // 만료되었으면 캐시에서 제거
    localStorage.removeItem(cacheKey)
    return null
  } catch (error) {
    console.error('토큰 캐시 읽기 오류:', error)
    return null
  }
}

/**
 * 토큰을 캐시에 저장 (localStorage 사용)
 */
export function setCachedToken(
  appKey: string,
  appSecret: string,
  isVirtual: boolean,
  access_token: string,
  expires_in: number // 초 단위
): void {
  try {
    const cacheKey = getCacheKey(appKey, appSecret, isVirtual)
    const expires_at = Date.now() + expires_in * 1000 // 밀리초로 변환

    const token: CachedToken = {
      access_token,
      expires_at,
      appKey,
      appSecret,
      isVirtual,
    }

    localStorage.setItem(cacheKey, JSON.stringify(token))
  } catch (error) {
    console.error('토큰 캐시 저장 오류:', error)
    // localStorage 용량 초과 등의 경우 무시
  }
}

/**
 * 캐시 초기화
 */
export function clearTokenCache(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('토큰 캐시 초기화 오류:', error)
  }
}
