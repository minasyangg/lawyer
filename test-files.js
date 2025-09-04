// Простой тест для проверки доступности файлов
const testUrls = [
  'http://localhost:3000/api/files/w9CMw__knXZ2rFFu',
  'http://localhost:3000/api/files/Eyxn6cn4aMFY8Xbm',
  'http://localhost:3000/api/files/qKntk5Ojzqj5HTgu',
  'http://localhost:3000/api/files/24',
  'http://localhost:3000/api/files/25',
  'http://localhost:3000/api/files/26'
]

async function testFileAccess() {
  console.log('=== ПРОВЕРКА ДОСТУПНОСТИ ФАЙЛОВ ===')
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url)
      console.log(`${url}: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        console.log(`  Content-Type: ${contentType}`)
      }
    } catch (error) {
      console.log(`${url}: ERROR - ${error.message}`)
    }
  }
  
  console.log('=== КОНЕЦ ПРОВЕРКИ ===')
}

testFileAccess()
