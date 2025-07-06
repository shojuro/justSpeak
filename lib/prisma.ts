import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Only initialize Prisma if DATABASE_URL is provided
let prismaInstance: PrismaClient | null = null

if (process.env.DATABASE_URL) {
  prismaInstance = global.prisma || new PrismaClient()
  
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prismaInstance
  }
}

export const prisma = prismaInstance
export const isDatabaseConnected = !!process.env.DATABASE_URL

export default prisma