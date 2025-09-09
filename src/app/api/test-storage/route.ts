import { NextRequest, NextResponse } from 'next/server';
import { runFullStorageTest, testStorageConnection, uploadTestFile } from '@/tests/storage-test';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type') || 'full';
  
  try {
    let result;
    
    switch (testType) {
      case 'connection':
        result = await testStorageConnection();
        break;
      case 'upload':
        result = await uploadTestFile();
        break;
      case 'full':
      default:
        result = await runFullStorageTest();
        break;
    }
    
    return NextResponse.json({
      success: true,
      testType,
      timestamp: new Date().toISOString(),
      result
    });
    
  } catch (error) {
    console.error('Storage test API error:', error);
    
    return NextResponse.json({
      success: false,
      testType,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'reset-provider') {
      // Сброс кэшированного провайдера для переключения
      const { StorageFactory } = await import('@/lib/storage/factory');
      StorageFactory.reset();
      
      return NextResponse.json({
        success: true,
        message: 'Storage provider cache reset'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Storage test POST API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
