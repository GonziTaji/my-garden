export function useImageUploads() {
  const uploadImage = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/uploads', { method: 'POST', body: fd })

    if (!res.ok) {
      // TODO: handle errors
      return { error: await res.json() }
    }

    const { filepath } = await res.json()

    return { error: null, filepath }
  }

  const deleteImage = async (imagepath: string) => {
    const res = await fetch(`/api/uploads${imagepath.replace('/uploads', '')}`, { method: 'DELETE' })

    if (res.ok) {
      // TODO: handle errors
      return { error: await res.text() }
    }

    return { error: null }
  }

  return {
    uploadImage,
    deleteImage,
  }
}
