import { Redis } from '@upstash/redis'

// Initialize Redis client with Upstash credentials
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Universal caching function
export async function withCache<T>(
  key: string,
  ttl: number, // TTL in seconds
  fetcherFn: () => Promise<T>
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await redis.get<T>(key)
    
    if (cached !== null) {
      console.log(`Cache HIT for key: ${key}`)
      return cached
    }

    console.log(`Cache MISS for key: ${key}`)
    
    // Execute the fetcher function
    const result = await fetcherFn()
    
    // Store in cache with TTL
    await redis.setex(key, ttl, JSON.stringify(result))
    
    return result
  } catch (error) {
    console.error(`Redis error for key ${key}:`, error)
    // Fallback to direct execution if Redis fails
    return await fetcherFn()
  }
}

// Cache invalidation helpers
export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`)
    }
  } catch (error) {
    console.error(`Failed to invalidate cache for pattern ${pattern}:`, error)
  }
}

// Specific cache keys for file manager
export const CACHE_KEYS = {
  FILES_LIST: (folderId?: string) => `files:list:${folderId || 'root'}`,
  FOLDER_TREE: 'files:tree',
  FILE_USAGE: (fileId: string) => `files:usage:${fileId}`,
  FOLDER_CONTENTS: (folderId: string) => `files:contents:${folderId}`,
} as const

// Cache TTL settings (in seconds)
export const CACHE_TTL = {
  FILES_LIST: 300, // 5 minutes
  FOLDER_TREE: 600, // 10 minutes  
  FILE_USAGE: 180, // 3 minutes
  FOLDER_CONTENTS: 300, // 5 minutes
} as const