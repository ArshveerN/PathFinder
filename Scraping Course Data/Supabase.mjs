// // ================================
// // Supabase Table Extraction (1 File)
// // ================================
//
// // 1️⃣ Import Supabase client and utilities
// import { createClient } from '@supabase/supabase-js';
// import { writeFile } from 'fs/promises';
// import path from 'path';
// import { fileURLToPath } from 'url';
//
// // 2️⃣ Supabase credentials
// // ⚠️ Use ANON key only (safe for frontend too)
// const SUPABASE_URL = 'https://lizixhskuaptkbgoituc.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpeml4aHNrdWFwdGtiZ29pdHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODk5NTksImV4cCI6MjA4NTQ2NTk1OX0.SSpx7bOByr7bx72SVWOykbX2BOTt2f0BejzuG_bRfl0';
//
// // 3️⃣ Create Supabase client
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
//
// // 4️⃣ Main function to fetch table data and save to a JSON file
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const OUTPUT_FILENAME = 'supabase_output.json';
//
// async function fetchTableData() {
//     try {
//         const { data, error } = await supabase
//             .from('Courses')   // 👈 change this to the table you want
//             .select('*');      // 👈 choose columns if needed
//
//         if (error) {
//             throw error;
//         }
//
//         const outPath = path.join(__dirname, OUTPUT_FILENAME);
//         const payload = data ?? [];
//
//         // Write pretty-printed JSON to file
//         await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');
//
//         console.log(`✅ Data fetched and saved to ${outPath}`);
//
//     } catch (err) {
//         console.error('❌ Error fetching or saving data:');
//         console.error(err.message || err);
//     }
// }
//
// // 5️⃣ Run the function
// fetchTableData();
