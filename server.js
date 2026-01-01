const express = require('express')
const QRCode = require('qrcode')
const { startBot, getQR } = require('./bot')

const app = express()
const PORT = process.env.PORT || 3000

app.get('/', async (req, res) => {
  const qr = getQR()
  if (!qr) {
    return res.send('<h2>✅ Bot already linked & online</h2>')
  }

  const img = await QRCode.toDataURL(qr)
  res.send(`
    <h2>Scan QR with WhatsApp</h2>
    <img src="${img}" />
    <p>Linked automatically after scan</p>
  `)
})

app.listen(PORT, () => {
  console.log('🌍 Web server running')
  startBot()
})
