/* Pantera Resort — Supabase bootstrap (safe)
   1) Ensure the Supabase CDN is loaded BEFORE this file:
      <script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
      <script defer src="scripts/supa.js"></script>
   2) Put your real URL/key below.
*/

(function () {
    // TODO: replace with your real values from Supabase → Settings → API
    const SUPABASE_URL  = "https://gqxsnpdalsnpwcbyagyy.supabase.co";   // <-- change me
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHNucGRhbHNucHdjYnlhZ3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk3OTksImV4cCI6MjA3ODAxNTc5OX0.toFDFvKW3nJeSwxaIhU3jgR390plKNVrCyUK5TMOsDI";                    // <-- change me
  
    // Guard: CDN must be present
    if (typeof window.supabase === "undefined") {
      console.error("[Pantera] Supabase JS CDN not loaded. Include it BEFORE scripts/supa.js.");
      window.getSupabase = () => null;
      return;
    }
  
    // Guard: prevent using placeholders in production
    const hasPlaceholders =
      !SUPABASE_URL.startsWith("https://") ||
      /YOUR-PROJECT-REF/i.test(SUPABASE_URL) ||
      /YOUR_PUBLIC_ANON_KEY/i.test(SUPABASE_ANON);
  
    if (hasPlaceholders) {
      console.error("[Pantera] Supabase URL/key not set in scripts/supa.js");
      window.getSupabase = () => null;
      return;
    }
  
    // Create (or reuse) the global client; persist session & refresh tokens automatically
    window.supabaseClient =
      window.supabaseClient ||
      window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
  
    // Getter for other scripts
    window.getSupabase = () => window.supabaseClient;
  })();
  