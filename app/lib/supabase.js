const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Exporta uma única instância para ser usada em toda a aplicação
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;