import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

const {
  DATABASE_URL,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_DIALECT,
} = process.env

let prisma

if (DATABASE_URL) {
  prisma = new PrismaClient()
} else {
  const dialect = (DB_DIALECT || 'mysql').toLowerCase()
  const port = DB_PORT || '3306'
  const passwordPart = DB_PASSWORD ? `:${encodeURIComponent(DB_PASSWORD)}` : ''
  const url = `${dialect}://${DB_USER}${passwordPart}@${DB_HOST}:${port}/${DB_NAME}`
  prisma = new PrismaClient({ datasources: { db: { url } } })
}

export default prisma


