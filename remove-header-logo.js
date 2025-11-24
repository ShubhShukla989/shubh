// Script to remove logo from Site Header
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ahulpaunsvzkvyewbxuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodWxwYXVuc3Z6a3Z5ZXdieHVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU4OTYwMCwiZXhwIjoyMDc4MTY1NjAwfQ.-Hl-SUNaEHduE_HBIpzcYmuX4VzXqEPGveqE85LARbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeLogo() {
  // New structure with empty rows (logo removed)
  const newStructure = {
    rows: []
  };

  const { data, error } = await supabase
    .from('layouts')
    .update({ 
      structure: newStructure,
      updated_at: new Date().toISOString()
    })
    .eq('name', 'Site Header')
    .select();

  if (error) {
    console.error('Error removing logo:', error);
    return;
  }

  console.log('✅ Logo successfully removed from Site Header!');
  console.log('Updated layout:', JSON.stringify(data, null, 2));
}

removeLogo();
