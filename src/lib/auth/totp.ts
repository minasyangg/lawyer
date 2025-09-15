// Двухфакторная аутентификация (TOTP) с Google Authenticator
// src/lib/auth/totp.ts

import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'

export interface TOTPSecret {
  secret: string
  qrCode: string
  backupCodes: string[]
  otpauthUrl: string
}

/**
 * Генерирует секрет для TOTP и QR код для Google Authenticator
 */
export async function generateTOTPSecret(userEmail: string, siteName: string = 'LawyerSite'): Promise<TOTPSecret> {
  // Генерируем секрет для TOTP
  const secret = speakeasy.generateSecret({
    name: `${siteName} (${userEmail})`,
    issuer: siteName,
    length: 32
  })

  if (!secret.otpauth_url || !secret.base32) {
    throw new Error('Failed to generate TOTP secret')
  }

  // Генерируем QR код
  const qrCode = await QRCode.toDataURL(secret.otpauth_url)
  
  // Генерируем резервные коды (backup codes)
  const backupCodes = generateBackupCodes(8)

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
    otpauthUrl: secret.otpauth_url
  }
}

/**
 * Проверяет TOTP токен
 */
export function verifyTOTP(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Разрешаем 2 временных окна (±60 секунд)
    time: Math.floor(Date.now() / 1000)
  })
}

/**
 * Генерирует резервные коды для восстановления доступа
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    // Генерируем 8-значный код
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }
  
  return codes
}

/**
 * Проверяет резервный код
 */
export function verifyBackupCode(inputCode: string, backupCodes: string[]): boolean {
  const normalizedInput = inputCode.toUpperCase().trim()
  return backupCodes.includes(normalizedInput)
}

/**
 * Удаляет использованный резервный код из списка
 */
export function removeUsedBackupCode(usedCode: string, backupCodes: string[]): string[] {
  const normalizedUsedCode = usedCode.toUpperCase().trim()
  return backupCodes.filter(code => code !== normalizedUsedCode)
}

/**
 * Проверяет, является ли код корректным TOTP токеном (6 цифр)
 */
export function isValidTOTPFormat(token: string): boolean {
  return /^\d{6}$/.test(token.trim())
}

/**
 * Проверяет, является ли код корректным форматом резервного кода
 */
export function isValidBackupCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code.toUpperCase().trim())
}

/**
 * Генерирует временный токен для настройки 2FA
 * Используется для подтверждения настройки перед сохранением секрета
 */
export function generateSetupToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/**
 * Проверяет настройку 2FA - пользователь должен ввести корректный TOTP
 * чтобы подтвердить, что приложение настроено правильно
 */
export function verifyTOTPSetup(token: string, secret: string): {
  isValid: boolean
  error?: string
} {
  if (!isValidTOTPFormat(token)) {
    return {
      isValid: false,
      error: 'Код должен содержать 6 цифр'
    }
  }

  const isValid = verifyTOTP(token, secret)
  
  if (!isValid) {
    return {
      isValid: false,
      error: 'Неверный код. Проверьте время на устройстве и попробуйте еще раз'
    }
  }

  return { isValid: true }
}

/**
 * Создает человеко-читаемый секрет для ручного ввода
 * (на случай, если QR код не сканируется)
 */
export function formatSecretForManualEntry(secret: string): string {
  // Разбиваем секрет на группы по 4 символа для удобства
  return secret.match(/.{1,4}/g)?.join(' ') || secret
}

/**
 * Получает оставшееся время до следующего TOTP токена (в секундах)
 */
export function getTimeRemaining(): number {
  const now = Math.floor(Date.now() / 1000)
  const period = 30 // TOTP период в секундах
  return period - (now % period)
}

/**
 * Получает текущий TOTP токен (для тестирования)
 */
export function getCurrentTOTP(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32'
  })
}