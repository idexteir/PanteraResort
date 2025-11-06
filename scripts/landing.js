const copy = {
  en: {
    nav_home: "Home",
    nav_fac: "Facilities",
    nav_loc: "Location",
    nav_contact: "Contact",
    hero_h1: "Unwind in Style at Pantera Resort",
    hero_p: "A serene Saudi escape—thoughtful spaces, warm service, and effortless comfort.",
    cta_whatsapp: "Chat on WhatsApp",
    cta_call: "Call Us",
    card1_h: "Private Pools",
    card1_p: "Relax in temperature-controlled privacy.",
    card2_h: "Family Friendly",
    card2_p: "Spacious villas and play areas.",
    card3_h: "Easy Access",
    card3_p: "Convenient location and parking.",
    footer: "© " + new Date().getFullYear() + " Pantera Resort. All rights reserved."
  },
  ar: {
    nav_home: "الرئيسية",
    nav_fac: "المرافق",
    nav_loc: "الموقع",
    nav_contact: "التواصل",
    hero_h1: "استرخِ بأناقة في منتجع بانتيرا",
    hero_p: "ملاذ هادئ بخدمة دافئة ومساحات مريحة.",
    cta_whatsapp: "واتساب",
    cta_call: "اتصل بنا",
    card1_h: "مسابح خاصة",
    card1_p: "راحة وخصوصية بدرجة حرارة مناسبة.",
    card2_h: "مناسب للعائلة",
    card2_p: "فلل واسعة ومناطق لعب.",
    card3_h: "سهولة الوصول",
    card3_p: "موقع مميز ومواقف متاحة.",
    footer: "© " + new Date().getFullYear() + " منتجع بانتيرا. جميع الحقوق محفوظة."
  }
};

function setLang(lang){
  const html=document.documentElement;
  const isAR=lang==='ar';
  html.lang=isAR?'ar':'en';
  html.dir=isAR?'rtl':'ltr';
  const t=copy[lang];
  for(const[k,v] of Object.entries(t)){
    const el=document.querySelector('[data-i18n="'+k+'"]');
    if(el) el.textContent=v;
  }
  localStorage.setItem('lang',lang);
}

document.addEventListener('DOMContentLoaded',()=>{
  setLang(localStorage.getItem('lang')||'en');
  const enBtn = document.getElementById('lang-en');
  const arBtn = document.getElementById('lang-ar');
  if (enBtn) enBtn.onclick=()=>setLang('en');
  if (arBtn) arBtn.onclick=()=>setLang('ar');
});


