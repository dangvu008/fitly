import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const BUCKET_NAME = 'try-on-images';
    const TEMP_FOLDER = 'temp';
    const MAX_AGE_HOURS = 24;

    console.log(`Starting cleanup of temp images older than ${MAX_AGE_HOURS} hours...`);

    // List all files in temp folder
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(TEMP_FOLDER, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' },
      });

    if (listError) {
      console.error('Error listing files:', listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('No temp files found');
      return new Response(
        JSON.stringify({ success: true, deleted: 0, message: 'No temp files found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cutoffTime = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);
    const filesToDelete: string[] = [];

    for (const file of files) {
      // Skip folders
      if (!file.name || file.id === null) continue;
      
      const fileCreatedAt = new Date(file.created_at);
      if (fileCreatedAt < cutoffTime) {
        filesToDelete.push(`${TEMP_FOLDER}/${file.name}`);
      }
    }

    if (filesToDelete.length === 0) {
      console.log('No expired temp files found');
      return new Response(
        JSON.stringify({ success: true, deleted: 0, message: 'No expired files' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filesToDelete.length} expired files to delete`);

    // Delete files in batches of 100
    const batchSize = 100;
    let totalDeleted = 0;

    for (let i = 0; i < filesToDelete.length; i += batchSize) {
      const batch = filesToDelete.slice(i, i + batchSize);
      const { error: deleteError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove(batch);

      if (deleteError) {
        console.error('Error deleting batch:', deleteError);
      } else {
        totalDeleted += batch.length;
        console.log(`Deleted batch of ${batch.length} files`);
      }
    }

    console.log(`Cleanup complete. Deleted ${totalDeleted} files.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: totalDeleted,
        message: `Deleted ${totalDeleted} expired temp files` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
