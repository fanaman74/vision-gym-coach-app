export async function resizeImage(
  file: File,
  maxWidth: number
): Promise<{ base64: string; mimeType: string }> {
  // First try canvas resize (handles JPEG, PNG, WebP, GIF)
  try {
    return await resizeViaCanvas(file, maxWidth)
  } catch {
    // Fallback: send the raw file as-is (handles HEIC, AVIF, etc.)
    return readRawBase64(file)
  }
}

function resizeViaCanvas(
  file: File,
  maxWidth: number
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      // If canvas can't encode it returns a tiny data URL — treat as failure
      if (dataUrl.length < 100) {
        reject(new Error('Canvas produced empty output'))
        return
      }
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Canvas could not decode image'))
    }

    img.src = objectUrl
  })
}

function readRawBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const [header, base64] = dataUrl.split(',')
      const mimeType = header.match(/:(.*?);/)?.[1] ?? file.type ?? 'image/jpeg'
      if (!base64) {
        reject(new Error('FileReader returned empty result'))
        return
      }
      resolve({ base64, mimeType })
    }
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.readAsDataURL(file)
  })
}
