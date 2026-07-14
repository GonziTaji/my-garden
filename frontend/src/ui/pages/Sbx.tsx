import type { FC } from 'react'
import { ImageUploader } from '../components/ImageUploader'

export const Sbx: FC = () => {
  // const image = { filepath: '', id: null }
  const image = undefined

  return <ImageUploader defaultImage={image} />
}
