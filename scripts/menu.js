document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  const t = {
    en: { title:"Menu", search:"Search menu…", all:"All", currency:"SR" },
    ar: { title:"القائمة", search:"ابحث في القائمة…", all:"الكل", currency:"ر.س" }
  };
  let lang = localStorage.getItem("lang") || "en";
  let items = [];
  let categories = [];

  function setLang(l){ lang=l; const ar=lang==='ar';
    document.documentElement.lang = ar?'ar':'en';
    document.documentElement.dir  = ar?'rtl':'ltr';
    document.getElementById('title').textContent = t[lang].title;
    document.getElementById('search').placeholder = t[lang].search;
    const all = document.getElementById('cat-all'); if (all) all.textContent = t[lang].all;
    localStorage.setItem('lang', lang);
    render();
  }
  function formatPrice(v){ return `${Number(v).toFixed(2)} ${t[lang].currency}`; }
  function uniqueCategories(data){ return [...new Set(data.map(i=>i.category).filter(Boolean))]; }
  function currentFilters(){
    return {
      q: (document.getElementById("search").value||"").trim().toLowerCase(),
      cat: document.querySelector(".cat-btn.active")?.dataset.cat || "all"
    };
  }
  function onCategoryClick(e){
    document.querySelectorAll(".cat-btn").forEach(b=>b.classList.remove("active"));
    e.currentTarget.classList.add("active");
    render();
  }
  function renderCategories(){
    const wrap = document.getElementById("cat-wrap");
    wrap.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.id = "cat-all";
    allBtn.className = "cat-btn active";
    allBtn.dataset.cat = "all";
    allBtn.textContent = t[lang].all;
    allBtn.onclick = onCategoryClick;
    wrap.appendChild(allBtn);
    for (const c of categories){
      const b = document.createElement("button");
      b.className = "cat-btn";
      b.dataset.cat = c;
      b.textContent = c;
      b.onclick = onCategoryClick;
      wrap.appendChild(b);
    }
  }
  function imageAlt(it){
    const n = (lang==="ar" && it.name_ar) ? it.name_ar : it.name_en;
    return n ? `${n} image` : "menu item image";
  }
  function render(){
    const grid = document.getElementById("grid");
    const { q, cat } = currentFilters();
    const filtered = items.filter(it=>{
      const byCat = (cat === "all") || (it.category === cat);
      const text = `${it.name_en} ${it.name_ar||""} ${it.desc_en||""} ${it.desc_ar||""}`.toLowerCase();
      const byQ = q ? text.includes(q) : true;
      return byCat && byQ && (it.available !== false);
    });
    grid.innerHTML = filtered.map(it=>`
      <article class="menu-card">
        <div class="menu-card-top">
          <div class="menu-name">
            <strong>${lang==="ar" && it.name_ar ? it.name_ar : it.name_en}</strong>
            <span class="menu-price">${formatPrice(it.price)}</span>
          </div>
          ${it.desc_en || it.desc_ar ? `
          <div class="menu-desc">
            ${lang==="ar" && it.desc_ar ? it.desc_ar : (it.desc_en||"")}
          </div>` : ""}
        </div>
        ${it.image ? `<img class=\"menu-img\" src=\"${it.image}\" alt=\"${imageAlt(it)}\">` : ""}
      </article>
    `).join("");
  }

  // Wait for Supabase to be ready, then try loading (with shorter timeout)
  async function waitForSupabase(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const supa = window.getSupabase && window.getSupabase();
      if (supa && supa.auth) {
        console.log("[Menu] Supabase ready after", i + 1, "attempts");
        return supa;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log("[Menu] Supabase not ready after", maxAttempts, "attempts, proceeding without it");
    return null;
  }

  async function loadFromSupabase(supa){
    if (!supa) {
      console.log("[Menu] Supabase not available");
      return null;
    }
    try {
      console.log("[Menu] Querying Supabase for menu items...");
      const { data, error } = await supa
        .from('menu_items')
        .select('id,category,name_en,name_ar,desc_en,desc_ar,price,image,available,display_order')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true })
        .order('name_en', { ascending: true });
      
      if (error) {
        console.error("[Menu] Supabase query error:", error);
        return null;
      }
      
      if (!data || data.length === 0) {
        console.warn("[Menu] Supabase returned no items");
        return null;
      }
      
      console.log("[Menu] Successfully loaded", data.length, "items from Supabase");
      return data;
    } catch (e) {
      console.error("[Menu] Supabase load exception:", e);
      return null;
    }
  }

  async function loadFallbackJSON(){
    try {
      const res = await fetch("data/menu.json", { cache: "no-store" });
      if (!res.ok) {
        console.warn("[Menu] JSON fetch failed:", res.status);
        return [];
      }
      const data = await res.json();
      console.log("[Menu] Loaded", data?.length || 0, "items from JSON");
      return data || [];
    } catch (e) {
      console.error("[Menu] JSON load error:", e);
      return [];
    }
  }

  async function init(){
    const grid = document.getElementById("grid");
    if (!grid) {
      console.error("[Menu] Grid element not found");
      return;
    }
    grid.innerHTML = "<p>Loading menu...</p>";
    
    try {
      // Wait for Supabase (max 2 seconds)
      console.log("[Menu] Waiting for Supabase...");
      const supa = await waitForSupabase(20);
      
      if (!supa) {
        console.error("[Menu] Supabase not available after waiting");
        grid.innerHTML = "<p>Error: Supabase not configured. Please check scripts/supa.js</p>";
        return;
      }
      
      console.log("[Menu] Supabase ready, loading menu items...");
      items = await loadFromSupabase(supa);
      
      // Only fallback to JSON if Supabase completely fails
      if (!items || items.length === 0) {
        console.warn("[Menu] Supabase returned no items, falling back to JSON...");
        items = await loadFallbackJSON();
        
        if (!items || items.length === 0) {
          grid.innerHTML = "<p>No menu items available.</p>";
          console.error("[Menu] No items loaded from any source");
          return;
        }
        console.log("[Menu] Loaded", items.length, "items from JSON fallback");
      }
      
      console.log("[Menu] Successfully loaded", items.length, "items");
      categories = uniqueCategories(items);
      renderCategories();
      setLang(lang);
    } catch (e) {
      console.error("[Menu] Init error:", e);
      grid.innerHTML = "<p>Error loading menu. Please refresh the page.</p>";
    }
  }

  const enBtn = document.getElementById('lang-en');
  const arBtn = document.getElementById('lang-ar');
  if (enBtn) enBtn.onclick = ()=> setLang('en');
  if (arBtn) arBtn.onclick = ()=> setLang('ar');
  document.getElementById('search').addEventListener('input', render);

  init();
});


