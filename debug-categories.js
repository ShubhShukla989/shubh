// Debug script to check categories
// Run this in browser console on the editions page

async function debugCategories() {
  console.log('=== Fetching all categories ===');
  
  const response = await fetch('/api/epaper/categories');
  const result = await response.json();
  
  console.log('API Response:', result);
  
  if (result.success && result.data) {
    console.log('\n=== All Categories ===');
    result.data.forEach(cat => {
      console.log(`ID: ${cat.id}, Title: ${cat.title}, Alias: ${cat.alias}, Active: ${cat.is_active}`);
    });
    
    const mumbai = result.data.find(c => c.alias === 'mumbai');
    const lucknow = result.data.find(c => c.alias === 'lucknow');
    
    console.log('\n=== Mumbai Category ===');
    console.log(mumbai);
    
    console.log('\n=== Lucknow Category ===');
    console.log(lucknow);
    
    if (mumbai && !mumbai.is_active) {
      console.error('❌ PROBLEM FOUND: Mumbai category is INACTIVE!');
      console.log('To fix: Go to Categories page and activate Mumbai category');
    } else if (!mumbai) {
      console.error('❌ PROBLEM FOUND: Mumbai category does NOT exist in database!');
    } else {
      console.log('✅ Mumbai category is active');
    }
  }
}

debugCategories();
