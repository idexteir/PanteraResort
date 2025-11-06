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

  // Try Supabase first; if not configured, optionally fallback to JSON
  const supa = window.getSupabase && window.getSupabase();

  async function loadFromSupabase(){
    const { data, error } = await supa
      .from('menu_items')
      .select('id,category,name_en,name_ar,desc_en,desc_ar,price,image,available,display_order')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })
      .order('name_en', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function loadFallbackJSON(){
    const res = await fetch("data/menu.json", { cache: "no-store" });
    return res.ok ? (await res.json()) : [];
  }

  async function init(){
    try {
      if (supa) {
        items = await loadFromSupabase();
      } else {
        items = await loadFallbackJSON();
      }
    } catch (e) {
      console.error("[Pantera] load error:", e);
      items = await loadFallbackJSON();
    }
    categories = uniqueCategories(items);
    renderCategories();
    setLang(lang);
  }

  const enBtn = document.getElementById('lang-en');
  const arBtn = document.getElementById('lang-ar');
  if (enBtn) enBtn.onclick = ()=> setLang('en');
  if (arBtn) arBtn.onclick = ()=> setLang('ar');
  document.getElementById('search').addEventListener('input', render);

  init();
});


