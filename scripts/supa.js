/* Pantera Resort — Supabase bootstrap
   Replace the placeholders with your real Supabase URL & anon key.
   Load order on pages:
     1) <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     2) <script src="scripts/supa.js"></script>
*/

(function () {
    const SUPABASE_URL  = "https://gqxsnpdalsnpwcbyagyy.supabase.co";   // <-- change me
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHNucGRhbHNucHdjYnlhZ3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk3OTksImV4cCI6MjA3ODAxNTc5OX0.toFDFvKW3nJeSwxaIhU3jgR390plKNVrCyUK5TMOsDI";                    // <-- change me
  
    if (!window.supabase && typeof window.supabase !== "object" && typeof window.supabase.createClient !== "function") {
      // if the CDN isn't loaded, fail early with a clear message
      throw new Error("Supabase JS not loaded. Make sure to include @supabase/supabase-js@2 before scripts/supa.js");
    }
  
    // Create (or reuse) the global client.
    // Persist session so admin stays logged in across refreshes; auto-refresh tokens.
    window.supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  
    // Tiny helper so other scripts can import an already-created client.
    window.getSupabase = () => window.supabaseClient;
  })();
  