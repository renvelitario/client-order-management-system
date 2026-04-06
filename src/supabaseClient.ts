import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	const missingVars = [
		!supabaseUrl ? 'VITE_SUPABASE_URL' : null,
		!supabaseKey ? 'VITE_SUPABASE_ANON_KEY' : null,
	].filter(Boolean).join(', ');

	throw new Error(`Supabase environment variables are not configured: ${missingVars}`);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
