const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys')

const P = require('pino')

let sock
let qrData = null

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  sock = makeWASocket({
    logger: P({ level: 'silent' }),
    auth: state,
    browser: ['PresenceBot', 'Chrome', '1.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (u) => {
    if (u.qr) qrData = u.qr

    if (u.connection === 'open') {
      qrData = null
      keepOnline()
      groupRecording()
      console.log('✅ BOT ONLINE')
    }

    if (u.connection === 'close') {
      const code = u.lastDisconnect?.error?.output?.statusCode
      if (code !== DisconnectReason.loggedOut) startBot()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg?.message || msg.key.fromMe) return

    const jid = msg.key.remoteJid
    if (!jid.endsWith('@g.us')) {
      await sock.sendPresenceUpdate('composing', jid)
      await delay(5000)
      await sock.sendPresenceUpdate('paused', jid)
    }
  })
}

function keepOnline() {
  setInterval(() => sock.sendPresenceUpdate('available'), 12000)
}

async function groupRecording() {
  setInterval(async () => {
    const groups = await sock.groupFetchAllParticipating()
    for (const jid of Object.keys(groups)) {
      await sock.sendPresenceUpdate('recording', jid)
    }
  }, 8000)
}

const delay = ms => new Promise(r => setTimeout(r, ms))

module.exports = { startBot, getQR: () => qrData }
