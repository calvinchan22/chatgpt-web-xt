import express from 'express'
import multer from 'multer'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import {
  cancelModel,
  chatConfig,
  chatReplyProcess,
  createModel,
  currentModel,
  deleteModel,
  getList,
  getModelDetail,
  getModels,
  prepareData,
} from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString } from './utils/is'
import { storage } from './utils/file'

const app = express()
const router = express.Router()

const upload = multer({ storage })

app.use(express.static('public'))
app.use(express.json())

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

router.post('/chat-process', [auth, limiter], async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    const { prompt, options = {}, systemMessage, completionParams } = req.body as RequestProps
    let firstChunk = true
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
      completionParams,
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/models', auth, async (req, res) => {
  try {
    const response = await getModels()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.get('/list', auth, async (req, res) => {
  try {
    const response = await getList()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/model-detail', auth, async (req, res) => {
  try {
    const response = await getModelDetail(req)
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/create-model', auth, async (req, res) => {
  try {
    const response = await createModel(req)
    res.send(response)
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/cancel-model', auth, async (req, res) => {
  try {
    const response = await cancelModel(req)
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/delete-model', auth, async (req, res) => {
  try {
    const response = await deleteModel(req)
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req, res) => {
  try {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
    const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
    res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('Secret key is empty')

    if (process.env.AUTH_SECRET_KEY !== token)
      throw new Error('密钥无效 | Secret key is invalid')

    res.send({ status: 'Success', message: 'Verify successfully', data: null })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/prepare-data', upload.single('file'), async (req, res) => {
  try {
    const response = await prepareData((req as any).file)
    res.send(response)
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

app.use('', router)
app.use('/api', router)
app.set('trust proxy', 1)

app.listen(3003, () => globalThis.console.log('Server is running on port 3003'))
