import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:/Users/Admin/Documents/GitHub/QU-N-L-CHO-THU-M-Y-NHCAOS/.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function testWrite() {
  try {
    const testId = 'test-write-check-' + Date.now();
    const { error } = await supabase.from('settings').upsert({ key: testId, value: 'test' });
    if (error) {
      console.log(`settings write: failed - ${error.message} (code ${error.code})`);
    } else {
      console.log(`settings write: success!`);
      // Clean it up
      await supabase.from('settings').delete().eq('key', testId);
    }
  } catch (err) {
    console.log(`settings write exception: ${err.message}`);
  }
}

testWrite();
