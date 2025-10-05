"use client"

import React from 'react'
import { FileManagerPage } from './FileManagerPage'
import { FileManagerProps } from './types'

export default function FileManager({ userRole, mode = 'full', onFileSelect }: FileManagerProps) {
  return <FileManagerPage userRole={userRole} mode={mode} onFileSelect={onFileSelect} />
}