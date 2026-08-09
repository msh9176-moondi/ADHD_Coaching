import { useState, useCallback } from 'react'

/**
 * 접을 수 있는 리스트 상태 관리 훅
 * @param {string[]} initialExpanded - 초기에 펼쳐진 항목 ID 배열
 * @returns {Object} { expanded, isExpanded, toggle, expand, collapse, expandAll, collapseAll, setExpanded }
 */
export function useCollapsibleList(initialExpanded = []) {
  const [expanded, setExpanded] = useState(initialExpanded)

  /**
   * 특정 항목이 펼쳐져 있는지 확인
   */
  const isExpanded = useCallback((id) => {
    return expanded.includes(id)
  }, [expanded])

  /**
   * 특정 항목 토글
   */
  const toggle = useCallback((id) => {
    setExpanded(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }, [])

  /**
   * 특정 항목 펼치기
   */
  const expand = useCallback((id) => {
    setExpanded(prev =>
      prev.includes(id) ? prev : [...prev, id]
    )
  }, [])

  /**
   * 특정 항목 접기
   */
  const collapse = useCallback((id) => {
    setExpanded(prev => prev.filter(item => item !== id))
  }, [])

  /**
   * 모든 항목 펼치기
   */
  const expandAll = useCallback((ids) => {
    setExpanded(ids)
  }, [])

  /**
   * 모든 항목 접기
   */
  const collapseAll = useCallback(() => {
    setExpanded([])
  }, [])

  return {
    expanded,
    isExpanded,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    setExpanded
  }
}
