const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://kmahhxniyrbzhlvtkyas.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttYWhoeG5peXJiemhsdnRreWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg0NzAsImV4cCI6MjA4NjU2NDQ3MH0.CQcu5qwgoBtfsmbzApdd-ig2O7aXhVKTakQJDAUU9Xo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchData() {
  const { data, error } = await supabase.from('app_content').select('content').eq('id', 'main').maybeSingle();
  if (error) {
    console.error('Error:', error);
    return;
  }
  const fileContent = 'import { Subject } from "../types";\n\nexport const STATIC_SUBJECTS: Subject[] = ' + JSON.stringify(data.content, null, 2) + ';\n';
  fs.writeFileSync('./lib/staticData.ts', fileContent);
  console.log('Successfully wrote to ./lib/staticData.ts');
}
fetchData();
