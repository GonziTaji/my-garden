
export const useImageUploads() {
  const [images, setImages] = useState()

  async function handleDeleteImage(imageId: number) {
    try {
      await deletePlantImage(plant.id, imageId)
      setImages((prev) => prev.filter((img) => img.id !== imageId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar imagen')
    }
  }

  async function handleAddImage(file: File) {
    setUploading(true)
    try {
      const newImage = await addPlantImage(plant.id, file)
      setImages((prev) => [...prev, newImage])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  return {
  }
}

