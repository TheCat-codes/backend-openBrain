import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import { router } from './Routes/routes.js'

const app = express()

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))
app.use(express.json())
app.use(cookieParser()) 
dotenv.config()

app.use('/api', router)

const PORT = process.env.PORT || 4000
console.log(PORT)

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})