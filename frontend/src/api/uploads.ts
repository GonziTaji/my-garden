import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './client'

export function useAllowedMimeTypes() {
  return useQuery({
    queryKey: [],
    queryFn: () => api.get<{ mimetypes: string[] }>('/api/uploads/mimetypes'),
    select: (data) => data.mimetypes,
  })
}

export function useImageUploads() {
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.upload('/api/uploads', fd)
      const data = await res.json()
      return data.filepath as string
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (imagepath: string) => {
      await api.del(`/api/uploads${imagepath.replace('/uploads', '')}`)
    },
  })

  return {
    uploadImage: uploadMutation.mutateAsync,
    deleteImage: deleteMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
