import { useEffect, useRef, useState } from 'react'

const allowedPhotoTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxPhotoSize = 10 * 1024 * 1024
const maxPhotos = 8

export function useListingPhotos({ onError, onValid }) {
  const [photos, setPhotos] = useState([])
  const photoInput = useRef(null)
  const photosRef = useRef([])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => () => {
    photosRef.current.forEach(photo => { if (!photo.existing) URL.revokeObjectURL(photo.preview) })
  }, [])

  const addPhotos = event => {
    const files = Array.from(event.target.files || [])
    const invalid = files.find(file => !allowedPhotoTypes.includes(file.type) || file.size > maxPhotoSize)

    if (invalid) {
      onError?.()
      event.target.value = ''
      return
    }

    setPhotos(current => {
      const availableSlots = maxPhotos - current.length
      const additions = files.slice(0, availableSlots).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        existing: false,
      }))
      return [...current, ...additions]
    })
    onValid?.()
    event.target.value = ''
  }

  const removePhoto = index => setPhotos(current => {
    const photo = current[index]
    if (!photo.existing) URL.revokeObjectURL(photo.preview)
    return current.filter((_, photoIndex) => photoIndex !== index)
  })

  // Loads an existing listing's already-uploaded photos (edit mode) as
  // "existing" entries — these have no local File/preview to revoke and are
  // kept as-is unless the seller removes them.
  const setExistingPhotos = existingPhotos => {
    setPhotos(existingPhotos.map(photo => ({ ...photo, existing: true })))
  }

  return {
    addPhotos,
    maxPhotos,
    photoInput,
    photos,
    removePhoto,
    setExistingPhotos,
  }
}
