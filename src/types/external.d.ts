// Временные типы для speakeasy и qrcode
// src/types/external.d.ts

declare module 'speakeasy' {
  export interface GeneratedSecret {
    base32: string;
    otpauth_url?: string;
  }

  export function generateSecret(options: {
    name: string;
    issuer: string;
    length?: number;
  }): GeneratedSecret;

  export namespace totp {
    export function verify(options: {
      secret: string;
      encoding: string;
      token: string;
      window?: number;
      time?: number;
    }): boolean;
  }

  export function totp(options: {
    secret: string;
    encoding: string;
  }): string;
}

declare module 'qrcode' {
  export function toDataURL(text: string): Promise<string>;
}