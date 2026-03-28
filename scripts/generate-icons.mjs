/**
 * Generate PWA icon PNGs from an SVG-like drawing using canvas.
 * Run with: node scripts/generate-icons.mjs
 */
import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const s = size / 64 // scale factor

  // Background
  const r = 14 * s
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = '#FFF8F2'
  ctx.fill()

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Hanger hook
  ctx.beginPath()
  ctx.moveTo(32 * s, 10 * s)
  ctx.bezierCurveTo(32 * s, 10 * s, 37 * s, 10 * s, 37 * s, 14 * s)
  ctx.bezierCurveTo(37 * s, 17.5 * s, 33.5 * s, 18.5 * s, 32 * s, 18.5 * s)
  ctx.strokeStyle = '#C67E5A'
  ctx.lineWidth = 2.5 * s
  ctx.stroke()

  // Hanger body
  ctx.beginPath()
  ctx.moveTo(32 * s, 18.5 * s)
  ctx.lineTo(13 * s, 32 * s)
  ctx.lineTo(51 * s, 32 * s)
  ctx.closePath()
  ctx.strokeStyle = '#C67E5A'
  ctx.lineWidth = 2.5 * s
  ctx.stroke()

  // Shirt body
  ctx.beginPath()
  ctx.moveTo(19 * s, 32 * s)
  ctx.lineTo(19 * s, 50 * s)
  ctx.quadraticCurveTo(19 * s, 54 * s, 23 * s, 54 * s)
  ctx.lineTo(41 * s, 54 * s)
  ctx.quadraticCurveTo(45 * s, 54 * s, 45 * s, 50 * s)
  ctx.lineTo(45 * s, 32 * s)
  ctx.fillStyle = '#F5E6D8'
  ctx.fill()
  ctx.strokeStyle = '#C67E5A'
  ctx.lineWidth = 2 * s
  ctx.stroke()

  // Collar V
  ctx.beginPath()
  ctx.moveTo(27 * s, 32 * s)
  ctx.lineTo(32 * s, 39 * s)
  ctx.lineTo(37 * s, 32 * s)
  ctx.strokeStyle = '#C67E5A'
  ctx.lineWidth = 1.5 * s
  ctx.stroke()

  return canvas
}

// Generate icons
for (const size of [192, 512]) {
  const canvas = drawIcon(size)
  writeFileSync(`public/icon-${size}.png`, canvas.toBuffer('image/png'))
  console.log(`Generated icon-${size}.png`)
}

// Apple touch icon (180x180)
const appleCanvas = drawIcon(180)
writeFileSync('public/apple-touch-icon.png', appleCanvas.toBuffer('image/png'))
console.log('Generated apple-touch-icon.png')
