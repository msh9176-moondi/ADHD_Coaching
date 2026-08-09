/**
 * 데이터 처리 유틸리티 함수
 */

/**
 * 배열을 ID 기반 맵으로 변환
 * @param {Array} array - 변환할 배열
 * @param {string} keyField - 키로 사용할 필드명 (기본: 'id')
 * @returns {Object} ID를 키로 하는 객체
 */
export function createLookupMap(array, keyField = 'id') {
  if (!array || !Array.isArray(array)) return {}

  return array.reduce((acc, item) => {
    if (item && item[keyField] != null) {
      acc[item[keyField]] = item
    }
    return acc
  }, {})
}

/**
 * 데이터 배열에 사용자 정보를 매핑
 * @param {Array} dataArray - 원본 데이터 배열
 * @param {Array} users - 사용자 배열
 * @param {Object} options - 옵션
 * @param {string} options.userIdField - 데이터의 사용자 ID 필드명 (기본: 'user_id')
 * @param {string[]} options.fields - 매핑할 필드 목록 (기본: ['name', 'email', 'phone'])
 * @param {Object} options.defaults - 기본값 객체
 * @returns {Array} 사용자 정보가 추가된 데이터 배열
 */
export function enrichWithUserData(dataArray, users, options = {}) {
  const {
    userIdField = 'user_id',
    fields = ['name', 'email', 'phone'],
    defaults = { name: '이름 없음' }
  } = options

  if (!dataArray || !Array.isArray(dataArray)) return []

  const userMap = createLookupMap(users || [], 'id')

  return dataArray.map(item => {
    const userId = item[userIdField]
    const user = userMap[userId]

    const enrichedFields = {}
    fields.forEach(field => {
      enrichedFields[field] = user?.[field] ?? defaults[field] ?? null
    })

    return {
      ...item,
      ...enrichedFields
    }
  })
}

/**
 * 안전한 JSON 파싱
 * @param {string} jsonString - JSON 문자열
 * @param {*} fallback - 파싱 실패 시 반환할 기본값
 * @returns {*} 파싱된 객체 또는 기본값
 */
export function safeJsonParse(jsonString, fallback = {}) {
  if (!jsonString) return fallback
  if (typeof jsonString !== 'string') return jsonString

  try {
    return JSON.parse(jsonString)
  } catch (e) {
    return fallback
  }
}

/**
 * 객체에서 지정된 필드만 추출
 * @param {Object} obj - 원본 객체
 * @param {string[]} fields - 추출할 필드 목록
 * @returns {Object} 추출된 필드만 포함된 객체
 */
export function pick(obj, fields) {
  if (!obj) return {}

  return fields.reduce((acc, field) => {
    if (field in obj) {
      acc[field] = obj[field]
    }
    return acc
  }, {})
}

/**
 * snake_case를 camelCase로 변환
 */
export function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 객체의 모든 키를 snake_case에서 camelCase로 변환
 */
export function keysToCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(keysToCamel)

  return Object.keys(obj).reduce((acc, key) => {
    acc[snakeToCamel(key)] = obj[key]
    return acc
  }, {})
}

/**
 * 배열에서 고유한 값만 추출
 * @param {Array} array - 원본 배열
 * @param {string} field - 필드명 (선택, 객체 배열인 경우)
 * @returns {Array} 고유한 값 배열
 */
export function unique(array, field = null) {
  if (!array || !Array.isArray(array)) return []

  if (field) {
    const seen = new Set()
    return array.filter(item => {
      const value = item[field]
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
  }

  return [...new Set(array)]
}

/**
 * 배열을 지정된 필드로 그룹핑
 * @param {Array} array - 원본 배열
 * @param {string} field - 그룹핑 기준 필드
 * @returns {Object} 그룹핑된 객체
 */
export function groupBy(array, field) {
  if (!array || !Array.isArray(array)) return {}

  return array.reduce((acc, item) => {
    const key = item[field]
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}

/**
 * Supabase에서 사용자 정보를 조회하여 데이터에 매핑 (async)
 * @param {Array} dataArray - 원본 데이터 배열
 * @param {Object} supabase - Supabase 클라이언트
 * @param {string} userIdField - 데이터의 사용자 ID 필드명
 * @param {string} targetField - 매핑할 대상 필드명 (예: 'coachee_name')
 * @returns {Promise<Array>} 사용자 정보가 추가된 데이터 배열
 */
export async function enrichWithUserDataAsync(dataArray, supabase, userIdField, targetField) {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
    return dataArray || []
  }

  // 고유한 사용자 ID 추출
  const userIds = [...new Set(dataArray.map(item => item[userIdField]).filter(Boolean))]

  if (userIds.length === 0) return dataArray

  // Supabase에서 사용자 정보 조회
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .in('id', userIds)

  // 사용자 맵 생성
  const userMap = new Map(users?.map(u => [u.id, u.name]) || [])

  // 데이터에 사용자 이름 매핑
  return dataArray.map(item => ({
    ...item,
    [targetField]: userMap.get(item[userIdField]) || ''
  }))
}
