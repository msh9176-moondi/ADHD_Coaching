/**
 * 날짜/시간 유틸리티 함수
 */

/**
 * Date 객체를 YYYY-MM-DD 형식으로 변환
 */
export function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0]
}

/**
 * Date 객체를 HH:MM 형식으로 변환
 */
export function formatTime(date = new Date()) {
  return date.toTimeString().split(' ')[0].substring(0, 5)
}

/**
 * Date 객체를 ISO 문자열로 변환
 */
export function formatDateTime(date = new Date()) {
  return date.toISOString()
}

/**
 * 현재 날짜의 주 범위 계산 (월요일 ~ 일요일)
 * @returns {{ startDate: string, endDate: string }}
 */
export function getWeekRange(date = new Date()) {
  const today = new Date(date)
  const dayOfWeek = today.getDay()

  // 월요일 계산 (일요일이면 6일 전, 아니면 dayOfWeek-1일 전)
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)

  // 일요일 계산
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday)
  }
}

/**
 * N개월 후 날짜 계산
 */
export function addMonths(date, months) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * 오늘 날짜 문자열 반환
 */
export function getToday() {
  return formatDate(new Date())
}

/**
 * 현재 시간 문자열 반환
 */
export function getCurrentTime() {
  return formatTime(new Date())
}

/**
 * 두 날짜 사이의 일수 차이 계산
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 날짜가 오늘인지 확인
 */
export function isToday(dateStr) {
  return formatDate(new Date(dateStr)) === getToday()
}

/**
 * 날짜가 지났는지 확인
 */
export function isPast(dateStr) {
  return new Date(dateStr) < new Date(getToday())
}

/**
 * 날짜를 한국어 형식으로 변환 (YYYY년 MM월 DD일)
 */
export function formatKoreanDate(date) {
  const d = new Date(date)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}
