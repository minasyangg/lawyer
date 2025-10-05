interface FileManagerSelectCallback {
  (file: { id: number; url: string; originalName: string; mimeType: string }): void
}

declare global {
  interface Window {
    fileManagerSelectCallback?: FileManagerSelectCallback
  }
}

export {}