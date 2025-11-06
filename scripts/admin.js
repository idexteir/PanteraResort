console.log("[Admin] Script loading...");

document.addEventListener("DOMContentLoaded", ()=>{
  console.log("[Admin] DOMContentLoaded fired");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Attach button handler immediately (before waiting for Supabase)
  const loginBtn = document.getElementById("login");
  if (loginBtn) {
    console.log("[Admin] Login button found, attaching immediate handler");
    loginBtn.onclick = function(e) {
      e.preventDefault();
      console.log("[Admin] Login button clicked!");
      const supa = window.getSupabase && window.getSupabase();
      if (!supa) {
        alert("Supabase is not ready yet. Please wait a moment and try again.");
        console.error("[Admin] Supabase not ready when button clicked");
        return;
      }
      // Call the actual sign-in function
      handleSignIn(supa);
    };
  } else {
    console.error("[Admin] Login button not found in DOM");
  }

  // Wait for Supabase to be ready
  function waitForSupabase(callback, maxAttempts = 50) {
    // Check if Supabase CDN is loaded
    if (typeof window.supabase === "undefined") {
      if (maxAttempts <= 0) {
        console.error("[Admin] Supabase CDN not loaded after waiting");
        callback(null);
        return;
      }
      setTimeout(() => waitForSupabase(callback, maxAttempts - 1), 100);
      return;
    }
    
    // Check if client is initialized
    const supa = window.getSupabase && window.getSupabase();
    if (supa && supa.auth) {
      console.log("[Admin] Supabase client ready");
      callback(supa);
      return;
    }
    
    if (maxAttempts <= 0) {
      console.error("[Admin] Supabase client not available after waiting");
      callback(null);
      return;
    }
    setTimeout(() => waitForSupabase(callback, maxAttempts - 1), 100);
  }

  waitForSupabase((supa) => {
    if (!supa) {
      console.error("[Admin] Failed to initialize - Supabase not available");
      const guard = document.getElementById("guard");
      if (guard) {
        guard.innerHTML = '<p class="err"><strong>Error:</strong> Supabase not configured. Check scripts/supa.js and ensure Supabase CDN is loaded.</p>';
      }
      return;
    }
    initAdmin(supa);
  });
});

// Handle sign-in (called from button click)
async function handleSignIn(supa) {
  console.log("[Admin] handleSignIn called");
  console.log("[Admin] Supabase client passed:", !!supa);
  
  const flashBox = document.getElementById("flash");
  console.log("[Admin] Flash box found:", !!flashBox);
  
  function flash(msg, type="ok") {
    console[type==="ok"?"log":"error"]("[Admin] Flash:", msg);
    if (flashBox) {
      flashBox.className = "card " + (type==="ok" ? "ok" : "err");
      flashBox.textContent = msg;
      flashBox.style.display = "block";
      setTimeout(()=> flashBox.style.display="none", 3000);
    } else {
      alert(msg);
    }
  }
  
  if (!supa) { 
    console.error("[Admin] Supabase client is null");
    flash("Supabase not configured (scripts/supa.js).", "err"); 
    return; 
  }
  
  console.log("[Admin] Supabase client valid, checking auth...");
  if (!supa.auth) {
    console.error("[Admin] Supabase auth is not available");
    flash("Supabase auth not initialized.", "err");
    return;
  }
  
  console.log("[Admin] Attempting to sign out existing session (with timeout)...");
  // Sign out with timeout - don't block if it hangs
  const signOutPromise = supa.auth.signOut({ scope: "local" }).catch(e => {
    console.warn("[Admin] Sign out error (ignored):", e);
  });
  
  // Wait max 2 seconds for sign out, then proceed
  const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
  await Promise.race([signOutPromise, timeoutPromise]);
  console.log("[Admin] Sign out attempt completed (or timed out)");
  
  console.log("[Admin] Proceeding to OAuth sign-in...");
  
  try {
    const redirectUrl = window.location.origin + window.location.pathname;
    console.log("[Admin] Calling signInWithOAuth...");
    console.log("[Admin] Redirect URL:", redirectUrl);
    console.log("[Admin] Supabase client:", supa);
    console.log("[Admin] Supabase auth:", supa.auth);
    
    const { data, error } = await supa.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: redirectUrl,
        queryParams: { prompt: "select_account" }
      }
    });
    
    console.log("[Admin] OAuth response received:", { data, error });
    
    if (error) {
      console.error("[Admin] OAuth error:", error);
      flash(`Sign-in failed: ${error.message}`, "err");
      return;
    }
    
    if (data?.url) {
      console.log("[Admin] OAuth URL received, redirecting to:", data.url);
      // Manually redirect
      window.location.href = data.url;
    } else {
      console.warn("[Admin] OAuth response missing URL, data:", data);
      flash("Sign-in response received but no redirect URL. Check Supabase configuration.", "err");
    }
  } catch (e) {
    console.error("[Admin] Sign-in exception:", e);
    console.error("[Admin] Exception stack:", e.stack);
    flash(`Sign-in error: ${e.message || "Unknown error"}`, "err");
  }
}

function initAdmin(supa) {
  console.log("[Admin] initAdmin called with Supabase client");
  const login = document.getElementById("login");
  const logout = document.getElementById("logout");
  const guard = document.getElementById("guard");
  const formCard = document.getElementById("form-card");
  const listCard = document.getElementById("list-card");
  const flashBox = document.getElementById("flash");
  const itemsDiv = document.getElementById("items");
  const modal = document.getElementById("modal-backdrop");
  const editForm = document.getElementById("edit-form");
  const cancelEdit = document.getElementById("cancel-edit");

  function showAuth(a){
    if (login) login.style.display = a ? "none" : "inline-flex";
    if (logout) logout.style.display = a ? "inline-flex" : "none";
    if (guard) guard.style.display = a ? "none" : "block";
    if (formCard) formCard.style.display = a ? "block" : "none";
    if (listCard) listCard.style.display = a ? "block" : "none";
  }
  function flash(msg, type="ok"){
    console[type==="ok"?"log":"error"]("[Admin]", msg);
    if (flashBox) {
      flashBox.className = "card " + (type==="ok" ? "ok" : "err");
      flashBox.textContent = msg;
      flashBox.style.display = "block";
      setTimeout(()=> flashBox.style.display="none", 3000);
    }
  }
  const openM = () => (modal && (modal.style.display="flex"));
  const closeM = () => (modal && (modal.style.display="none"));

  // Update button handler to use the shared function
  if (login) {
    console.log("[Admin] Updating login button handler");
    login.onclick = function(e) {
      e.preventDefault();
      console.log("[Admin] Login button clicked (from initAdmin)");
      handleSignIn(supa);
    };
  }
  logout.onclick = async () => {
    if (!supa) return;
    await supa.auth.signOut({ scope: "local" });
    location.reload();
  };

  async function isStaff(){
    if (!supa) {
      console.log("[Admin] isStaff: No Supabase client");
      return false;
    }
    console.log("[Admin] isStaff: Calling RPC...");
    const { data, error } = await supa.rpc("is_staff");
    if (error) { 
      console.error("[Admin] is_staff RPC error:", error); 
      return false; 
    }
    console.log("[Admin] is_staff RPC result:", data);
    return !!data;
  }

  async function loadItems(){
    const { data, error } = await supa
      .from("menu_items")
      .select("*")
      .order("category")
      .order("display_order")
      .order("name_en");
    if (error) { itemsDiv.innerHTML = `<p class="err">${error.message}</p>`; return; }
    if (!data?.length) { itemsDiv.innerHTML = "<p>No items yet.</p>"; return; }

    const groups = {};
    for (const it of data) (groups[it.category] ||= []).push(it);

    itemsDiv.innerHTML = Object.keys(groups).map(cat => {
      const rows = groups[cat].map(it => `
        <tr>
          <td>${it.id}</td>
          <td>${it.name_en}${it.name_ar ? ` / <span dir="rtl">${it.name_ar}</span>` : ""}</td>
          <td>${Number(it.price).toFixed(2)}</td>
          <td>${it.available ? "Yes" : "No"}</td>
          <td>${it.display_order ?? 0}</td>
          <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.image || ""}</td>
          <td class="actions">
            <button class="btn edit-btn" data-edit="${it.id}" type="button">Edit</button>
            <button class="btn" data-del="${it.id}" type="button">Delete</button>
          </td>
        </tr>
      `).join("");
      return `
        <details open>
          <summary><strong>${cat}</strong> (${groups[cat].length})</summary>
          <div style="overflow:auto">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Avail.</th><th>Order</th><th>Image</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </details>
      `;
    }).join("");

    // Delete buttons
    document.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.del);
        if (!confirm(`Delete item #${id}?`)) return;
        const { error } = await supa.from("menu_items").delete().eq("id", id);
        if (error) { flash(error.message, "err"); return; }
        flash("Deleted.");
        loadItems();
      };
    });

    // Edit buttons
    document.querySelectorAll("[data-edit]").forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.dataset.edit);
        const item = Object.values(groups).flat().find(x => x.id === id);
        if (!item) return;
        // Prefill modal
        editForm.id.value = item.id;
        editForm.category.value = item.category || "";
        editForm.price.value = Number(item.price || 0).toFixed(2);
        editForm.name_en.value = item.name_en || "";
        editForm.name_ar.value = item.name_ar || "";
        editForm.desc_en.value = item.desc_en || "";
        editForm.desc_ar.value = item.desc_ar || "";
        editForm.image.value = item.image || "";
        editForm.available.value = item.available ? "true" : "false";
        editForm.display_order.value = Number(item.display_order || 0);
        openM();
      };
    });
  }

  // Add
  document.getElementById("item-form").onsubmit = async (e) => {
    e.preventDefault();
    if (!supa) { flash("Supabase not configured.", "err"); return; }
    const fd = new FormData(e.target);
    const p = {
      category: (fd.get("category")||"").trim(),
      price: Number(fd.get("price")),
      name_en: (fd.get("name_en")||"").trim(),
      name_ar: (fd.get("name_ar")||"").trim() || null,
      desc_en: (fd.get("desc_en")||"").trim() || null,
      desc_ar: (fd.get("desc_ar")||"").trim() || null,
      image: (fd.get("image")||"").trim() || null,
      available: fd.get("available") === "true",
      display_order: Number(fd.get("display_order")||0)
    };
    if (!p.category || !p.name_en || isNaN(p.price)) { flash("Fill Category, Name (EN), Price.", "err"); return; }
    const { error } = await supa.from("menu_items").insert(p);
    if (error) { flash(error.message, "err"); return; }
    e.target.reset(); flash("Added."); loadItems();
  };

  // Edit Save
  editForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!supa) { flash("Supabase not configured.", "err"); return; }
    const fd = new FormData(editForm);
    const id = Number(fd.get("id"));
    const p = {
      category: (fd.get("category")||"").trim(),
      price: Number(fd.get("price")),
      name_en: (fd.get("name_en")||"").trim(),
      name_ar: (fd.get("name_ar")||"").trim() || null,
      desc_en: (fd.get("desc_en")||"").trim() || null,
      desc_ar: (fd.get("desc_ar")||"").trim() || null,
      image: (fd.get("image")||"").trim() || null,
      available: fd.get("available") === "true",
      display_order: Number(fd.get("display_order")||0)
    };
    if (!id || !p.category || !p.name_en || isNaN(p.price)) { flash("Check required fields.", "err"); return; }
    const { error } = await supa.from("menu_items").update(p).eq("id", id);
    if (error) { flash(error.message, "err"); return; }
    flash("Updated."); closeM(); loadItems();
  };
  cancelEdit.onclick = closeM; modal.onclick = e => { if (e.target === modal) closeM(); };

  // Auth flow
  if (!supa) { showAuth(false); return; }

  supa.auth.onAuthStateChange(async (event, session) => {
    console.log("[Admin] Auth state changed:", event, session?.user?.email);
    if (!session?.user) { 
      console.log("[Admin] No session in auth state change");
      showAuth(false); 
      return; 
    }
    console.log("[Admin] Session found, checking if staff...");
    const ok = await isStaff();
    console.log("[Admin] Staff check result:", ok);
    if (!ok) {
      showAuth(false); 
      flash("This Google account is not authorized. Try another.", "err");
      await supa.auth.signOut({ scope: "local" });
      return;
    }
    console.log("[Admin] Staff authorized, showing admin interface");
    showAuth(true); 
    loadItems();
  });

  // Check for existing session on page load (including after OAuth redirect)
  (async () => {
    console.log("[Admin] Checking for existing session...");
    console.log("[Admin] Current URL:", window.location.href);
    
    // Check if there's a hash fragment (OAuth callback)
    const hasHash = window.location.hash && window.location.hash.length > 1;
    console.log("[Admin] Has hash fragment:", hasHash);
    
    // Use a promise that resolves when we get a session (either from getSession or onAuthStateChange)
    let sessionResolved = false;
    let resolvedSession = null;
    
    // Set up a one-time listener for auth state change (catches OAuth callback)
    const authStatePromise = new Promise((resolve) => {
      const unsubscribe = supa.auth.onAuthStateChange((event, session) => {
        console.log("[Admin] onAuthStateChange in session check:", event, session?.user?.email);
        if (session?.user && !sessionResolved) {
          sessionResolved = true;
          resolvedSession = session;
          unsubscribe();
          resolve(session);
        }
      });
      
      // Cleanup after 10 seconds
      setTimeout(() => {
        unsubscribe();
        if (!sessionResolved) resolve(null);
      }, 10000);
    });
    
    // Also try getSession with timeout
    const getSessionPromise = (async () => {
      const waitTime = hasHash ? 2000 : 500;
      console.log("[Admin] Waiting", waitTime, "ms before getSession...");
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("getSession timeout")), 3000)
        );
        const result = await Promise.race([supa.auth.getSession(), timeoutPromise]);
        console.log("[Admin] getSession completed:", !!result.data?.session);
        return result.data?.session || null;
      } catch (e) {
        console.error("[Admin] getSession failed:", e.message);
        return null;
      }
    })();
    
    // Wait for either method to get a session
    console.log("[Admin] Waiting for session from either method...");
    const session = await Promise.race([
      authStatePromise,
      getSessionPromise.then(s => s || new Promise(() => {})) // Don't resolve if null
    ]).catch(() => null) || resolvedSession || await getSessionPromise;
    
    if (!session?.user) { 
      console.log("[Admin] No session found");
      showAuth(false); 
      return; 
    }
    
    console.log("[Admin] Session found:", session.user.email);
    console.log("[Admin] Checking if staff...");
    const ok = await isStaff();
    console.log("[Admin] Staff check result:", ok);
    if (!ok) {
      showAuth(false);
      flash("This Google account is not authorized. Try another.", "err");
      await supa.auth.signOut({ scope: "local" });
      return;
    }
    console.log("[Admin] Staff authorized, showing admin interface");
    showAuth(true); 
    loadItems();
  })();
}


