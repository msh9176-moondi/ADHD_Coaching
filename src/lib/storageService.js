/**
 * 스토리지 서비스
 * Supabase Storage를 사용한 파일 업로드
 */

import { supabase, isSupabaseConfigured } from './supabase'

const BUCKET_NAME = 'chat-images'

// 이미지 업로드
export async function uploadImage(file, userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('LOCAL_MODE')
  }

  // 파일 확장자 추출
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('이미지 업로드 실패:', error)
    throw error
  }

  // 공개 URL 가져오기
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)

  return {
    path: data.path,
    url: urlData.publicUrl
  }
}

// 여러 이미지 업로드
export async function uploadImages(files, userId) {
  const results = await Promise.all(
    Array.from(files).map(file => uploadImage(file, userId))
  )
  return results
}

// 이미지 삭제
export async function deleteImage(path) {
  if (!isSupabaseConfigured()) {
    throw new Error('LOCAL_MODE')
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    console.error('이미지 삭제 실패:', error)
    throw error
  }

  return true
}
