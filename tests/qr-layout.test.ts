import assert from "node:assert/strict"
import test from "node:test"
import { calculateFullScreenQrSize } from "../lib/qr-layout.ts"

const phoneViewports = [
  { name: "mali iPhone", width: 320, height: 568 },
  { name: "standardni iPhone", width: 390, height: 844 },
  { name: "veliki iPhone", width: 430, height: 932 },
  { name: "Android", width: 412, height: 915 },
  { name: "telefon položen vodoravno", width: 844, height: 390 },
]

for (const viewport of phoneViewports) {
  test(`ceo QR staje na ekran: ${viewport.name}`, () => {
    const size = calculateFullScreenQrSize(viewport.width, viewport.height)
    assert.ok(size <= viewport.width - 24)
    assert.ok(size <= viewport.height - 104)
    assert.ok(size <= 520)
  })
}
