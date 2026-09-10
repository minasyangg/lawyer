import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Единственный PrismaClient на процесс.
 *
 * Каждый экземпляр PrismaClient открывает собственный пул соединений к БД,
 * поэтому в приложении не должно быть `new PrismaClient()` нигде, кроме этого
 * файла — иначе пулы плодятся и исчерпывают лимит соединений (max_connections
 * у БД, и лимит на клиента у Supabase pooler).
 *
 * На Vercel это почти не проявлялось: serverless-инстансы короткоживущие и
 * умирают вместе со своими соединениями. В self-host (VPS, один долгоживущий
 * Node-процесс) лишние пулы накапливаются, соединения зависают в состоянии
 * `idle in transaction`, и страницы начинают отваливаться по P2024
 * (connection pool timeout).
 *
 * Кэш в globalThis нужен и в production: рантайм Next.js может подгружать
 * модуль повторно (разные бандлы серверных чанков), и без общего кэша это
 * снова даст несколько клиентов в одном процессе.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

globalForPrisma.prisma = prisma
