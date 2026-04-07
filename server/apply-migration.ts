// Apply database migration to add profile fields
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://etbswnymhzwlvmvrhxra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0YnN3bnlteHp3bHZtdnJoeHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzk2NjAwMCwiZXhwIjoyMDU0ODM0NDAwfQ.6IJJrA9HTi-IH5lkxAYpGi4Q3wSMs3lNshOHZ2xH0kg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying migration to add profile fields...');

  // Test if gender column exists by trying to select it
  const { error: selectError } = await supabase
    .from('users')
    .select('gender')
    .limit(1);

  if (selectError && selectError.message.includes('column')) {
    console.log('Gender column does not exist, need to add it via Supabase dashboard');
    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE users ADD COLUMN gender VARCHAR(10);');
    console.log('ALTER TABLE users ADD COLUMN birthday DATE;');
    console.log('ALTER TABLE users ADD COLUMN email VARCHAR(100);');
  } else {
    console.log('Gender column already exists');
  }
}

applyMigration();