// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ppbhbrbzjklsarodahoo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYmhicmJ6amtsc2Fyb2RhaG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNzYyNjMsImV4cCI6MjA2Mjg1MjI2M30.MI0hglNk2Idc05zASTSiwurhGLFC1D-vONxQTBmgwlU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);