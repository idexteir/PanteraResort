document.addEventListener("DOMContentLoaded", ()=>{
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Wait for Supabase to be ready
  function waitForSupabase(callback, maxAttempts = 50) {
    const supa = window.getSupabase && window.getSupabase();
    if (supa) {
      callback(supa);
      return;
    }
    if (maxAttempts <= 0) {
      console.error("[Admin] Supabase not available after waiting");
      callback(null);
      return;
    }
    setTimeout(() => waitForSupabase(callback, maxAttempts - 1), 100);
  }

  waitForSupabase((supa) => {
    initAdmin(supa);
  });
});

function initAdmin(supa) {
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
    login.style.display = a ? "none" : "inline-flex";
    logout.style.display = a ? "inline-flex" : "none";
    guard.style.display = a ? "none" : "block";
    formCard.style.display = a ? "block" : "none";
    listCard.style.display = a ? "block" : "none";
  }
  function flash(msg, type="ok"){
    console[type==="ok"?"log":"error"]("[Admin]", msg);
    flashBox.className = "card " + (type==="ok" ? "ok" : "err");
    flashBox.textContent = msg;
    flashBox.style.display = "block";
    setTimeout(()=> flashBox.style.display="none", 3000);
  }
  const openM = () => (modal.style.display="flex");
  const closeM = () => (modal.style.display="none");

  // Always attach a click handler so the button is "clickable"
  login.onclick = async () => {
    if (!supa) { flash("Supabase not configured (scripts/supa.js).", "err"); return; }
    try { await supa.auth.signOut({ scope: "local" }); } catch(_) {}
    const { error } = await supa.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.href, queryParams: { prompt: "select_account" } }
    });
    if (error) flash(error.message, "err");
  };
  logout.onclick = async () => {
    if (!supa) return;
    await supa.auth.signOut({ scope: "local" });
    location.reload();
  };

  async function isStaff(){
    if (!supa) return false;
    const { data, error } = await supa.rpc("is_staff");
    if (error) { console.error("is_staff error:", error); return false; }
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

  supa.auth.onAuthStateChange(async (_evt, session) => {
    if (!session?.user) { showAuth(false); return; }
    const ok = await isStaff();
    if (!ok) {
      showAuth(false); flash("This Google account is not authorized. Try another.", "err");
      await supa.auth.signOut({ scope: "local" });
      return;
    }
    showAuth(true); loadItems();
  });

  (async () => {
    const { data:{ session } } = await supa.auth.getSession();
    if (!session?.user) { showAuth(false); return; }
    const ok = await isStaff();
    if (!ok) {
      showAuth(false);
      await supa.auth.signOut({ scope: "local" });
      return;
    }
    showAuth(true); loadItems();
  })();
}


