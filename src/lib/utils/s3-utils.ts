import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Типы для S3 конфигурации
interface S3Config {
  endpoint: string
  region: string
  bucketName: string
  accessKeyId: string
  secretAccessKey: string
}

// Проверяем доступность S3 конфигурации
export function isS3Available(): boolean {
  const endpoint = process.env.S3_ENDPOINT
  const region = process.env.S3_REGION
  const bucketName = process.env.S3_BUCKET_NAME
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

  console.log('S3 Environment Variables Check:', {
    S3_ENDPOINT: endpoint ? 'SET' : 'MISSING',
    S3_REGION: region ? 'SET' : 'MISSING', 
    S3_BUCKET_NAME: bucketName ? 'SET' : 'MISSING',
    S3_ACCESS_KEY_ID: accessKeyId ? 'SET' : 'MISSING',
    S3_SECRET_ACCESS_KEY: secretAccessKey ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV
  })

  const isAvailable = !!(endpoint && region && bucketName && accessKeyId && secretAccessKey)
  console.log('S3 Available:', isAvailable)
  
  return isAvailable
}

// Получаем конфигурацию S3 из переменных окружения
function getS3Config(): S3Config {
  const endpoint = process.env.S3_ENDPOINT
  const region = process.env.S3_REGION
  const bucketName = process.env.S3_BUCKET_NAME
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

  if (!endpoint || !region || !bucketName || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing S3 configuration variables')
  }

  return {
    endpoint,
    region,
    bucketName,
    accessKeyId,
    secretAccessKey
  }
}

// Создаем S3 клиент
function createS3Client(): S3Client {
  const config = getS3Config()
  
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // Важно для совместимости с S3-подобными сервисами
  })
}

/**
 * Загружает файл в S3 хранилище
 * @param buffer - Буфер файла
 * @param key - Ключ (путь) файла в S3
 * @param mimeType - MIME тип файла
 * @returns Promise<string> - URL файла в S3
 */
export async function uploadToS3(
  buffer: Buffer, 
  key: string, 
  mimeType: string
): Promise<string> {
  console.log('Starting S3 upload with key:', key, 'mimeType:', mimeType)
  
  if (!isS3Available()) {
    throw new Error('S3 configuration is not available')
  }

  const s3Client = createS3Client()
  const config = getS3Config()

  console.log('S3 Config:', {
    endpoint: config.endpoint,
    bucketName: config.bucketName,
    region: config.region,
    keyExists: !!config.accessKeyId
  })

  try {
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read', // Делаем файл публично доступным
    })

    console.log('Sending S3 command...')
    await s3Client.send(command)

    // Формируем URL файла
    const fileUrl = `${config.endpoint}/${config.bucketName}/${key}`
    console.log('S3 upload successful, URL:', fileUrl)
    return fileUrl

  } catch (error) {
    console.error('S3 upload error:', error)
    throw new Error(`Failed to upload file to S3: ${error}`)
  }
}

/**
 * Удаляет файл из S3 хранилища
 * @param key - Ключ (путь) файла в S3
 * @returns Promise<void>
 */
export async function deleteFromS3(key: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('S3 delete is only available in production environment')
    return
  }

  const s3Client = createS3Client()
  const config = getS3Config()

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })

    await s3Client.send(command)

  } catch (error) {
    console.error('S3 delete error:', error)
    throw new Error(`Failed to delete file from S3: ${error}`)
  }
}

/**
 * Извлекает ключ S3 из полного URL
 * @param s3Url - Полный URL файла в S3
 * @returns string - Ключ файла в S3
 */
export function extractS3Key(s3Url: string): string {
  const config = getS3Config()
  const baseUrl = `${config.endpoint}/${config.bucketName}/`
  
  if (s3Url.startsWith(baseUrl)) {
    return s3Url.replace(baseUrl, '')
  }
  
  throw new Error('Invalid S3 URL format')
}

/**
 * Генерирует ключ S3 для файла с учетом структуры папок
 * @param userId - ID пользователя
 * @param filename - Имя файла
 * @param folderPath - Путь к папке (опционально)
 * @returns string - Ключ для S3
 */
export function generateS3Key(
  userId: number, 
  filename: string, 
  folderPath?: string
): string {
  let key = `user_${userId}`
  
  if (folderPath) {
    // Убираем начальные и конечные слеши, заменяем backslashes
    const cleanFolderPath = folderPath
      .replace(/^\/+|\/+$/g, '')
      .replace(/\\/g, '/')
    
    if (cleanFolderPath) {
      key += `/${cleanFolderPath}`
    }
  }
  
  key += `/${filename}`
  
  return key
}
