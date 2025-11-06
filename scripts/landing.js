/* Pantera Resort — landing.js (EN/AR i18n + RTL) */
(function () {
  // ---- 1) Text dictionary (same keys you shared) ----
  const copy = {
    en: {
      tit: "Pantera Resort",
      nav_home: "Home",
      nav_fac: "Facilities",
      nav_loc: "Location",
      nav_contact: "Contact",
      nav_menu: "Menu",
      nav_admin: "Admin",
      hero_h1: "Unwind in Style at Pantera Resort",
      hero_p: "Thoughtful spaces, warm service, and effortless comfort.",
      cta_whatsapp: "Chat on WhatsApp",
      cta_call: "Call Us",
      card1_h: "Big Pool",
      card1_p: "Beat the summer heat.",
      card2_h: "Family Friendly",
      card2_p: "Spacious villa and play areas.",
      card3_h: "Easy Access",
      card3_p: "Convenient location and parking.",
      footer: "© " + new Date().getFullYear() + " Pantera Resort. All rights reserved."
    },
    ar: {
      tit: "منتجع بانتيرا",
      nav_home: "الرئيسية",
      nav_fac: "المرافق",
      nav_loc: "الموقع",
      nav_contact: "التواصل",
      nav_menu: "القائمة",
      nav_admin: "الدعم",
      hero_h1: "استرخِ بأناقة في منتجع بانتيرا",
      hero_p: "ملاذ هادئ بخدمة دافئة ومساحات مريحة.",
      cta_whatsapp: "واتساب",
      cta_call: "اتصل بنا",
      card1_h: "مسابح خاصة",
      card1_p: "راحة وخصوصية.",
      card2_h: "مناسب للعائلة",
      card2_p: "مساحات واسعة ومناطق لعب.",
      card3_h: "سهولة الوصول",
      card3_p: "موقع مميز ومواقف متاحة.",
      footer: "© " + new Date().getFullYear() + " منتجع بانتيرا. جميع الحقوق محفوظة."
    }
  };

  // ---- 2) Helpers exposed for other scripts if needed ----
  window.isAR = () => document.documentElement.lang === "ar";
  window.nameHTML = (it) => {
    if (!it) return "";
    return (window.isAR() && it.name_ar)
      ? `<span lang="ar">${it.name_ar}</span>`
      : (it.name_en || "");
  };

  // ---- 3) Main language switch (idempotent, safe) ----
  function setLang(lang) {
    const ml = document.querySelector('.nav .menu-links');
if (ml) ml.style.flexDirection = (lang === 'ar') ? 'row-reverse' : 'row';

    const html = document.documentElement;
    const isAR = (lang === "ar");
    const t = copy[lang] || {};

    // A) Flip document attributes → CSS will handle fonts + layout
    html.setAttribute("lang", isAR ? "ar" : "en");
    html.setAttribute("dir",  isAR ? "rtl" : "ltr");

    // Optional: also add/remove a class in case your CSS targets it
    document.body.classList.toggle("rtl", isAR);

    // B) Apply text translations
    //    Elements must have data-i18n="key" matching the dictionary
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      if (k && (k in t)) el.textContent = t[k];
    });

    // Placeholders / title / aria (only if you use these data attributes)
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const k = el.getAttribute("data-i18n-placeholder");
      if (k && (k in t)) el.setAttribute("placeholder", t[k]);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const k = el.getAttribute("data-i18n-title");
      if (k && (k in t)) el.setAttribute("title", t[k]);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => {
      const k = el.getAttribute("data-i18n-aria");
      if (k && (k in t)) el.setAttribute("aria-label", t[k]);
    });

    // C) Update <title> if you want the tab title localized
    try {
      if (t.tit) document.title = t.tit;
    } catch (_) {}

    // D) Toggle active style on language buttons (if present)
    const enBtn = document.getElementById("lang-en");
    const arBtn = document.getElementById("lang-ar");
    if (enBtn) enBtn.classList.toggle("active", !isAR);
    if (arBtn) arBtn.classList.toggle("active",  isAR);

    // E) Persist preference
    try { localStorage.setItem("lang", lang); } catch (_) {}

    // F) If your page has dynamic sections, re-render them
    if (typeof window.render === "function") window.render();

    // G) Ensure nav visual order reverses even if DOM is re-rendered
    const links = document.querySelector(".nav .links");
    if (links) links.classList.toggle("rtl", isAR);

    console.log(`[Lang] Switched to ${lang} | dir=${html.dir}`);
  }
  window.setLang = setLang;

  // ---- 4) Boot ----
  document.addEventListener("DOMContentLoaded", () => {
    // Initial language (remember previous choice)
    let initial = "en";
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "ar" || saved === "en") initial = saved;
    } catch (_) {}
    setLang(initial);

    // Wire language buttons if they exist
    const enBtn = document.getElementById("lang-en");
    const arBtn = document.getElementById("lang-ar");
    if (enBtn) enBtn.onclick = () => setLang("en");
    if (arBtn) arBtn.onclick = () => setLang("ar");
  });
})();
