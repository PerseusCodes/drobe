import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal'

// Calm Drobe background color (matches --bg token)
const BACKGROUND_COLOR = '#fcf9f4'

export async function removeBackground(imageDataUrl: string): Promise<string> {
  // Convert data URL to blob
  const response = await fetch(imageDataUrl)
  const blob = await response.blob()

  // Remove background — returns blob with transparent background
  const resultBlob = await imglyRemoveBackground(blob, {
    publicPath: '/bg-removal/',
    progress: () => {},
  })

  // Composite onto calm background color
  return compositeOnBackground(resultBlob, BACKGROUND_COLOR)
}

async function compositeOnBackground(blob: Blob, bgColor: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      // Fill calm background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Draw transparent image on top
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.src = url
  })
}
