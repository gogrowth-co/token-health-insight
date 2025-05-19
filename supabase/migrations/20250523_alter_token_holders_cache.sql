
-- Function to add holders_data column to token_holders_cache if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_alter_token_holders_cache_function()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  CREATE OR REPLACE FUNCTION public.alter_token_holders_cache_add_holders_data()
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
  AS $inner_function$
  BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'token_holders_cache'
        AND column_name = 'holders_data'
    ) THEN
      -- Add the holders_data column if it doesn't exist
      ALTER TABLE public.token_holders_cache 
      ADD COLUMN holders_data TEXT;
    END IF;
  END;
  $inner_function$;
END;
$function$;

-- Create the holders_data alteration function
SELECT public.create_alter_token_holders_cache_function();

-- Execute the alteration function to add the column
SELECT public.alter_token_holders_cache_add_holders_data();
