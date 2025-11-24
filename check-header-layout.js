// Quick script to check Site Header layout
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ahulpaunsvzkvyewbxuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodWxwYXVuc3Z6a3Z5ZXdieHVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU4OTYwMCwiZXhwIjoyMDc4MTY1NjAwfQ.-Hl-SUNaEHduE_HBIpzcYmuX4VzXqEPGveqE85LARbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLayout() {
  const { data, error } = await supabase
    .from('layouts')
    .select('*')
    .eq('name', 'Site Header')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Site Header Layout:');
  console.log(JSON.stringify(data, null, 2));
}

checkLayout();
