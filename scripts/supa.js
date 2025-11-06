/* Pantera Resort — Supabase bootstrap (stable)
   1) Load order on pages:
        <script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script defer src="scripts/supa.js"></script>
   2) Fill SUPABASE_URL and SUPABASE_ANON with your real values.
*/

(function () {
    // === EDIT THESE TWO LINES ===
    const SUPABASE_URL  = "https://gqxsnpdalsnpwcbyagyy.supabase.co";   // e.g., https://abcd1234.supabase.co
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHNucGRhbHNucHdjYnlhZ3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk3OTksImV4cCI6MjA3ODAxNTc5OX0.toFDFvKW3nJeSwxaIhU3jgR390plKNVrCyUK5TMOsDI";                    // long jwt-like string
    // ============================
  
    // Soft checks + logs (never block the page)
    if (typeof window.supabase === "undefined") {
      console.error("[Pantera] supabase-js CDN not loaded. Include it BEFORE scripts/supa.js");
      window.getSupabase = () => null;
      return;
    }
    if (!/^https:\/\/.+\.supabase\.co$/.test(SUPABASE_URL) || SUPABASE_ANON.length < 20) {
      console.error("[Pantera] Supabase URL/key look unset. Update scripts/supa.js with real values.");
    }
  
    // Create or reuse client; never throw here
    try {
      window.supabaseClient =
        window.supabaseClient ||
        window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
      window.getSupabase = () => window.supabaseClient;
      console.log("[Pantera] Supabase client ready.");
    } catch (e) {
      console.error("[Pantera] Failed to create Supabase client:", e);
      window.getSupabase = () => null;
    }
  })();
  