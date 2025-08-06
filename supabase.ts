
import { createClient } from '@supabase/supabase-js';

// 🔧 Reemplaza con tu URL y tu clave pública (anon key)
const supabaseUrl = 'https://wbozdadqteummqkqvzki.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib3pkYWRxdGV1bW1xa3F2emtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDgxMTEsImV4cCI6MjA2ODg4NDExMX0.RrEzMFTNH1iZ0Kku4jLrfoChkNelJbkxy9-xYd_Opfc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
