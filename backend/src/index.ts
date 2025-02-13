import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'

config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`)
}) 