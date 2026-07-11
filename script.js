/* ============================================================
   STEEMLITE — script.js
   Vanilla JS: nav, scroll reveal, count-up, back-to-top, lace,
   category gallery, language toggle, share, privacy modal.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Current year in footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     LANGUAGE (English / Hindi)
     Edit the strings below to change any wording on the site — every
     data-i18n / data-i18n-html element in index.html is filled from
     here. WhatsApp message bodies and image alt text stay English-only
     on purpose (kept simple, and the business owner reads them either way).
     ============================================================ */
  var TRANSLATIONS = {
    en: {
      "nav.collections": "Collections", "nav.about": "About", "nav.whyUs": "Why Us", "nav.contact": "Contact",
      "hero.eyebrow": "Footwear Manufacturer & Wholesaler · Since 1998",
      "hero.tagline": "Crafting footwear for every step.",
      "hero.viewCollections": "View Collections", "hero.whatsapp": "WhatsApp Us", "hero.scroll": "Scroll",
      "trust.label": "Trusted by retailers & distributors across India", "trust.logo": "Retailer Logo",
      "collections.title": "Collections",
      "collections.lead": "Six footwear categories, built in-house and ready for bulk order.",
      "collections.pdf": "Prefer a PDF? Download our catalog →",
      "card.slippers.title": "Slippers", "card.slippers.desc": "Everyday comfort in soft, durable soles.",
      "card.sandals.title": "Sandals", "card.sandals.desc": "Breezy styles for warm-weather retail.",
      "card.casual.title": "Casual Footwear", "card.casual.desc": "Versatile everyday shoes that move fast.",
      "card.sports.title": "Sports Shoes", "card.sports.desc": "Performance builds with grip and cushioning.",
      "card.formal.title": "Formal Shoes", "card.formal.desc": "Sharp, office-ready leather-look finishes.",
      "card.kids.title": "Kids Footwear", "card.kids.desc": "Playful, tough little shoes that last.",
      "card.enquire": "Enquire →", "card.badge.new": "New",
      "about.title": "About Steemlite",
      "about.lead": "Since 1998, we've been a footwear <strong>manufacturer and wholesaler</strong> — making quality footwear in India at factory-direct prices, and shipping it in bulk to retailers and distributors across the country.",
      "about.p1": "Everything is produced <strong>in-house</strong>, so we control quality at every stage and keep prices honest. From everyday slippers to performance sports shoes, our range is wide, our designs stay fresh, and our quality stays consistent order after order.",
      "about.p2": "New retailer or established distributor — bulk orders are always welcome, and custom / OEM manufacturing is available on request.",
      "stats.years": "Years Since 1998", "stats.designs": "Designs", "stats.cities": "Cities Served", "stats.inhouse": "In-House Manufacturing",
      "why.title": "Why Choose Us",
      "why.1.title": "Factory-Direct Pricing", "why.1.desc": "No middlemen. You buy straight from the people who make the shoes.",
      "why.2.title": "Low MOQ for New Retailers", "why.2.desc": "Start small and scale up — we make it easy to test the market.",
      "why.3.title": "Fresh Designs, Regularly", "why.3.desc": "New styles drop often so your shelves always feel current.",
      "why.4.title": "Durable Materials", "why.4.desc": "Built to survive daily wear — fewer returns, happier customers.",
      "why.5.title": "Timely Dispatch", "why.5.desc": "Orders confirmed and packed fast, then shipped to your city.",
      "why.6.title": "Custom / OEM Available", "why.6.desc": "Your brand, your specs — we manufacture to order.",
      "process.title": "How To Order In Bulk",
      "step.1.title": "Browse Collections", "step.1.desc": "Pick the categories and styles you want to stock.",
      "step.2.title": "Send Enquiry on WhatsApp", "step.2.desc": "Message us with the categories you're interested in.",
      "step.3.title": "Confirm Designs & Quantity", "step.3.desc": "We finalise designs, quantities and pricing together.",
      "step.4.title": "Dispatch to Your City", "step.4.desc": "We pack and ship your order straight to you.",
      "lookbook.title": "Lookbook", "lookbook.lead": "Swipe through a few of our latest builds.",
      "faq.title": "Frequently Asked", "faq.lead": "What retailers usually ask before placing a bulk order.",
      "faq.q1": "What's your Minimum Order Quantity (MOQ)?",
      "faq.a1": "Our MOQ starts at 50 pairs per style for new retailers, with better per-pair pricing at higher volumes. Mix and match styles within a category is welcome.",
      "faq.q2": "What are your payment terms?",
      "faq.a2": "Typically 50% advance to confirm the order, with the balance due before dispatch. We can discuss terms for repeat and larger orders.",
      "faq.q3": "Can I get samples before ordering in bulk?",
      "faq.a3": "Yes — message us on WhatsApp with the styles you're interested in and we'll arrange samples so you can check quality before committing to a bulk order.",
      "faq.q4": "How long does dispatch take?",
      "faq.a4": "Most orders are packed and dispatched within 7–10 working days of confirming designs and quantities, depending on order size.",
      "faq.q5": "Do you offer custom or private-label (OEM) manufacturing?",
      "faq.a5": "Yes — we manufacture to your specifications, including your own branding, on request. Share your requirements on WhatsApp and we'll take it from there.",
      "faq.q6": "Which cities do you deliver to?",
      "faq.a6": "We ship pan-India to retailers and distributors in 50+ cities. Message us your location and we'll confirm delivery timelines for your city.",
      "contact.title": "LET'S TALK<br />BUSINESS",
      "contact.whatsappBtn": "Chat on WhatsApp", "contact.instagramBtn": "Instagram →", "contact.catalogBtn": "Download Catalog ↓",
      "detail.phone": "Phone", "detail.email": "Email", "detail.address": "Address",
      "detail.addressValue": "Your Street, Your City,<br />Your State — PIN",
      "detail.hours": "Hours", "detail.hoursValue": "Mon–Sat, 10am – 7pm",
      "footer.rights": "All rights reserved.", "footer.unit": "A unit of Paris Footwear Company",
      "footer.made": "Footwear Manufacturer & Wholesaler · Since 1998 · Made in India",
      "privacy.linkText": "Privacy Policy",
      "privacy.p1": "This is a draft privacy policy — please have it reviewed before publishing, and update it if you turn on analytics or start collecting information beyond what's described here.",
      "privacy.h1": "Information We Collect",
      "privacy.p2": "We don't run an online store or accounts, so we don't collect payment details or passwords through this site. When you message us on WhatsApp or Instagram, we see whatever you choose to share there (name, number, order details) so we can respond to your enquiry.",
      "privacy.h2": "Analytics & Cookies",
      "privacy.p3": "Analytics tracking is currently switched off on this site. If we turn it on in future (e.g. Google Analytics or Meta Pixel), it would collect general visit data — pages viewed, approximate location, device type — to help us understand which parts of the site are useful. This policy will be updated first.",
      "privacy.h3": "Third-Party Links",
      "privacy.p4": "This site links out to WhatsApp and Instagram. Once you leave our site, their own privacy policies apply.",
      "privacy.h4": "Contact Us",
      "privacy.p5": "Questions about this policy or your information? Reach us using the contact details on this page.",
      "share.label": "Share", "share.copied": "Link copied!",
      "gallery.style": "Style", "gallery.enquireInBulk": "Enquire in Bulk →"
    },
    hi: {
      "nav.collections": "कलेक्शन", "nav.about": "हमारे बारे में", "nav.whyUs": "हमें क्यों चुनें", "nav.contact": "संपर्क करें",
      "hero.eyebrow": "फुटवियर निर्माता और थोक विक्रेता · 1998 से",
      "hero.tagline": "हर कदम के लिए फुटवियर तैयार।",
      "hero.viewCollections": "कलेक्शन देखें", "hero.whatsapp": "व्हाट्सएप करें", "hero.scroll": "स्क्रॉल करें",
      "trust.label": "पूरे भारत के रिटेलर्स और डिस्ट्रीब्यूटर्स का भरोसा", "trust.logo": "रिटेलर लोगो",
      "collections.title": "कलेक्शन",
      "collections.lead": "छह फुटवियर श्रेणियां, इन-हाउस निर्मित और थोक ऑर्डर के लिए तैयार।",
      "collections.pdf": "PDF पसंद है? हमारा कैटलॉग डाउनलोड करें →",
      "card.slippers.title": "चप्पल", "card.slippers.desc": "मुलायम, टिकाऊ सोल में रोज़ का आराम।",
      "card.sandals.title": "सैंडल", "card.sandals.desc": "गर्मियों के लिए हल्के और आरामदायक डिज़ाइन।",
      "card.casual.title": "कैज़ुअल फुटवियर", "card.casual.desc": "रोज़मर्रा के लिए बहुउपयोगी जूते, तेज़ बिकने वाले।",
      "card.sports.title": "स्पोर्ट्स शूज़", "card.sports.desc": "अच्छी पकड़ और कुशनिंग के साथ परफॉर्मेंस डिज़ाइन।",
      "card.formal.title": "फॉर्मल जूते", "card.formal.desc": "ऑफिस के लिए स्मार्ट, लेदर-लुक फिनिश।",
      "card.kids.title": "बच्चों के जूते", "card.kids.desc": "मज़ेदार और मज़बूत, लंबे समय तक चलने वाले।",
      "card.enquire": "पूछताछ करें →", "card.badge.new": "नया",
      "about.title": "स्टीमलाइट के बारे में",
      "about.lead": "1998 से, हम एक फुटवियर <strong>निर्माता और थोक विक्रेता</strong> हैं — भारत में फैक्ट्री-डायरेक्ट कीमतों पर गुणवत्तापूर्ण फुटवियर बनाते हैं, और देशभर के रिटेलर्स व डिस्ट्रीब्यूटर्स को थोक में भेजते हैं।",
      "about.p1": "सब कुछ <strong>इन-हाउस</strong> बनाया जाता है, इसलिए हम हर स्तर पर गुणवत्ता को नियंत्रित करते हैं और कीमतें ईमानदार रखते हैं। रोज़मर्रा की चप्पलों से लेकर परफॉर्मेंस स्पोर्ट्स शूज़ तक, हमारी रेंज विस्तृत है, डिज़ाइन हमेशा नए रहते हैं, और हर ऑर्डर पर गुणवत्ता एक जैसी बनी रहती है।",
      "about.p2": "नए रिटेलर हों या स्थापित डिस्ट्रीब्यूटर — थोक ऑर्डर का हमेशा स्वागत है, और अनुरोध पर कस्टम / OEM निर्माण भी उपलब्ध है।",
      "stats.years": "साल, 1998 से", "stats.designs": "डिज़ाइन", "stats.cities": "शहरों में सेवा", "stats.inhouse": "इन-हाउस निर्माण",
      "why.title": "हमें क्यों चुनें",
      "why.1.title": "फैक्ट्री-डायरेक्ट कीमत", "why.1.desc": "कोई बिचौलिया नहीं। आप सीधे जूते बनाने वालों से खरीदते हैं।",
      "why.2.title": "नए रिटेलर्स के लिए कम MOQ", "why.2.desc": "छोटे से शुरू करें और आगे बढ़ें — हम बाज़ार परखना आसान बनाते हैं।",
      "why.3.title": "नियमित रूप से नए डिज़ाइन", "why.3.desc": "नई स्टाइलें अक्सर आती हैं ताकि आपकी दुकान हमेशा अपडेट रहे।",
      "why.4.title": "टिकाऊ सामग्री", "why.4.desc": "रोज़ के इस्तेमाल के लिए मज़बूत — कम रिटर्न, ज़्यादा खुश ग्राहक।",
      "why.5.title": "समय पर डिस्पैच", "why.5.desc": "ऑर्डर की पुष्टि और पैकिंग तेज़ी से होती है, फिर आपके शहर भेजा जाता है।",
      "why.6.title": "कस्टम / OEM उपलब्ध", "why.6.desc": "आपका ब्रांड, आपकी ज़रूरतें — हम ऑर्डर पर बनाते हैं।",
      "process.title": "थोक में ऑर्डर कैसे करें",
      "step.1.title": "कलेक्शन देखें", "step.1.desc": "जो श्रेणियां और स्टाइलें रखनी हैं, उन्हें चुनें।",
      "step.2.title": "व्हाट्सएप पर पूछताछ भेजें", "step.2.desc": "आपकी रुचि की श्रेणियों के बारे में हमें मैसेज करें।",
      "step.3.title": "डिज़ाइन और मात्रा तय करें", "step.3.desc": "हम मिलकर डिज़ाइन, मात्रा और कीमत तय करते हैं।",
      "step.4.title": "आपके शहर भेजा जाता है", "step.4.desc": "हम आपका ऑर्डर पैक करके सीधे आपको भेजते हैं।",
      "lookbook.title": "लुकबुक", "lookbook.lead": "हमारे कुछ नवीनतम डिज़ाइन देखने के लिए स्वाइप करें।",
      "faq.title": "अक्सर पूछे जाने वाले सवाल", "faq.lead": "थोक ऑर्डर देने से पहले रिटेलर्स आमतौर पर जो पूछते हैं।",
      "faq.q1": "आपकी न्यूनतम ऑर्डर मात्रा (MOQ) क्या है?",
      "faq.a1": "नए रिटेलर्स के लिए हमारी MOQ प्रति स्टाइल 50 जोड़ी से शुरू होती है, ज़्यादा मात्रा पर बेहतर कीमत मिलती है। एक श्रेणी के भीतर अलग-अलग स्टाइल मिलाना भी ठीक है।",
      "faq.q2": "आपकी भुगतान शर्तें क्या हैं?",
      "faq.a2": "आमतौर पर ऑर्डर पक्का करने के लिए 50% एडवांस, बाकी राशि डिस्पैच से पहले। बड़े और दोहराए जाने वाले ऑर्डर के लिए शर्तों पर बात की जा सकती है।",
      "faq.q3": "क्या थोक ऑर्डर से पहले सैंपल मिल सकते हैं?",
      "faq.a3": "हां — अपनी पसंद की स्टाइलों के साथ हमें व्हाट्सएप पर मैसेज करें, हम सैंपल भेज देंगे ताकि थोक ऑर्डर से पहले आप गुणवत्ता जांच सकें।",
      "faq.q4": "डिस्पैच में कितना समय लगता है?",
      "faq.a4": "डिज़ाइन और मात्रा तय होने के 7–10 कार्यदिवसों में अधिकतर ऑर्डर पैक और डिस्पैच हो जाते हैं, यह ऑर्डर के आकार पर निर्भर करता है।",
      "faq.q5": "क्या आप कस्टम या प्राइवेट-लेबल (OEM) निर्माण करते हैं?",
      "faq.a5": "हां — अनुरोध पर हम आपकी ज़रूरतों और आपकी ब्रांडिंग के अनुसार निर्माण करते हैं। अपनी ज़रूरतें व्हाट्सएप पर बताएं, आगे की प्रक्रिया हम संभाल लेंगे।",
      "faq.q6": "आप किन शहरों में डिलीवरी करते हैं?",
      "faq.a6": "हम पूरे भारत में 50+ शहरों के रिटेलर्स और डिस्ट्रीब्यूटर्स को भेजते हैं। अपना स्थान बताएं, हम आपके शहर के लिए डिलीवरी समय बता देंगे।",
      "contact.title": "बिज़नेस की<br />बात करें",
      "contact.whatsappBtn": "व्हाट्सएप पर बात करें", "contact.instagramBtn": "इंस्टाग्राम →", "contact.catalogBtn": "कैटलॉग डाउनलोड करें ↓",
      "detail.phone": "फ़ोन", "detail.email": "ईमेल", "detail.address": "पता",
      "detail.addressValue": "आपकी सड़क, आपका शहर,<br />आपका राज्य — पिन कोड",
      "detail.hours": "समय", "detail.hoursValue": "सोम–शनि, सुबह 10 – शाम 7 बजे",
      "footer.rights": "सर्वाधिकार सुरक्षित।", "footer.unit": "पेरिस फुटवियर कंपनी की एक इकाई",
      "footer.made": "फुटवियर निर्माता और थोक विक्रेता · 1998 से · मेड इन इंडिया",
      "privacy.linkText": "गोपनीयता नीति",
      "privacy.p1": "यह एक ड्राफ्ट गोपनीयता नीति है — प्रकाशित करने से पहले इसकी समीक्षा करवाएं, और यदि आप एनालिटिक्स चालू करते हैं या यहां बताई गई जानकारी से अधिक जानकारी एकत्र करना शुरू करते हैं तो इसे अपडेट करें।",
      "privacy.h1": "हम कौन-सी जानकारी एकत्र करते हैं",
      "privacy.p2": "हम कोई ऑनलाइन स्टोर या अकाउंट नहीं चलाते, इसलिए इस साइट के ज़रिए हम भुगतान विवरण या पासवर्ड एकत्र नहीं करते। जब आप हमें व्हाट्सएप या इंस्टाग्राम पर मैसेज करते हैं, तो हम वही जानकारी देखते हैं जो आप वहां साझा करना चुनते हैं (नाम, नंबर, ऑर्डर विवरण) ताकि हम आपकी पूछताछ का जवाब दे सकें।",
      "privacy.h2": "एनालिटिक्स और कुकीज़",
      "privacy.p3": "इस साइट पर फिलहाल एनालिटिक्स ट्रैकिंग बंद है। यदि हम इसे भविष्य में चालू करते हैं (जैसे Google Analytics या Meta Pixel), तो यह सामान्य विज़िट डेटा एकत्र करेगी — देखे गए पेज, अनुमानित स्थान, डिवाइस प्रकार — ताकि हम समझ सकें कि साइट के कौन-से हिस्से उपयोगी हैं। इसे चालू करने से पहले यह नीति अपडेट की जाएगी।",
      "privacy.h3": "थर्ड-पार्टी लिंक",
      "privacy.p4": "यह साइट व्हाट्सएप और इंस्टाग्राम से जुड़ती है। हमारी साइट छोड़ने के बाद, उनकी अपनी गोपनीयता नीतियां लागू होती हैं।",
      "privacy.h4": "हमसे संपर्क करें",
      "privacy.p5": "इस नीति या आपकी जानकारी के बारे में सवाल हैं? इस पेज पर दिए गए संपर्क विवरण से हमसे संपर्क करें।",
      "share.label": "शेयर करें", "share.copied": "लिंक कॉपी हो गया!",
      "gallery.style": "स्टाइल", "gallery.enquireInBulk": "थोक में पूछताछ करें →"
    }
  };

  var LANG_STORAGE_KEY = "steemlite-lang";
  var currentLang = "en";

  function applyLanguage(lang) {
    if (!TRANSLATIONS[lang]) lang = "en";
    currentLang = lang;
    var dict = TRANSLATIONS[lang];

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
    });

    document.documentElement.lang = lang;
    var langBtn = document.getElementById("langToggle");
    if (langBtn) langBtn.classList.toggle("is-hi", lang === "hi");
    try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* storage unavailable, ignore */ }

    // if a category gallery happens to be open while switching language, refresh it
    if (galleryModal && galleryModal.classList.contains("is-open") && openGalleryKey) {
      openGallery(openGalleryKey, true);
    }
  }

  var langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", function () {
      applyLanguage(currentLang === "en" ? "hi" : "en");
    });
  }

  var savedLang = "en";
  try { savedLang = localStorage.getItem(LANG_STORAGE_KEY) || "en"; } catch (e) { /* ignore */ }
  applyLanguage(savedLang);

  /* ============================================================
     GENERIC MODAL helpers (shared by the category gallery and the
     Privacy Policy panel — both use the same .gallery markup/CSS)
     ============================================================ */
  var modalLastFocus = null;

  function openModal(modalEl, focusEl) {
    if (!modalEl) return;
    modalLastFocus = document.activeElement;
    modalEl.classList.add("is-open");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    (focusEl || modalEl.querySelector(".gallery__close")).focus();
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (modalLastFocus) modalLastFocus.focus();
  }

  document.querySelectorAll(".gallery [data-gallery-close]").forEach(function (el) {
    el.addEventListener("click", function () { closeModal(el.closest(".gallery")); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openEl = document.querySelector(".gallery.is-open");
    if (openEl) closeModal(openEl);
  });

  /* ---------- Privacy Policy modal ---------- */
  var privacyModal = document.getElementById("privacyModal");
  var privacyBtn = document.getElementById("privacyBtn");
  if (privacyBtn && privacyModal) {
    privacyBtn.addEventListener("click", function () { openModal(privacyModal); });
  }

  /* ---------- Category gallery: every style in a collection, one click away ----------
     Placeholder photos below are reused from elsewhere on the page — swap each
     "items" array for your own per-style product shots when you have them.
     "whatsapp" stays English-only: it only feeds the outgoing WhatsApp message. */
  var CATEGORY_ITEMS = {
    Slippers: {
      title: { en: "Slippers", hi: "चप्पल" },
      desc: { en: "Everyday comfort in soft, durable soles.", hi: "मुलायम, टिकाऊ सोल में रोज़ का आराम।" },
      whatsapp: "Slippers",
      items: [
        "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=500&q=80"
      ]
    },
    Sandals: {
      title: { en: "Sandals", hi: "सैंडल" },
      desc: { en: "Breezy styles for warm-weather retail.", hi: "गर्मियों के लिए हल्के और आरामदायक डिज़ाइन।" },
      whatsapp: "Sandals",
      items: [
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?auto=format&fit=crop&w=500&q=80"
      ]
    },
    Casual: {
      title: { en: "Casual Footwear", hi: "कैज़ुअल फुटवियर" },
      desc: { en: "Versatile everyday shoes that move fast.", hi: "रोज़मर्रा के लिए बहुउपयोगी जूते, तेज़ बिकने वाले।" },
      whatsapp: "Casual Footwear",
      items: [
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=500&q=80"
      ]
    },
    Sports: {
      title: { en: "Sports Shoes", hi: "स्पोर्ट्स शूज़" },
      desc: { en: "Performance builds with grip and cushioning.", hi: "अच्छी पकड़ और कुशनिंग के साथ परफॉर्मेंस डिज़ाइन।" },
      whatsapp: "Sports Shoes",
      items: [
        "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80"
      ]
    },
    Formal: {
      title: { en: "Formal Shoes", hi: "फॉर्मल जूते" },
      desc: { en: "Sharp, office-ready leather-look finishes.", hi: "ऑफिस के लिए स्मार्ट, लेदर-लुक फिनिश।" },
      whatsapp: "Formal Shoes",
      items: [
        "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=500&q=80"
      ]
    },
    Kids: {
      title: { en: "Kids Footwear", hi: "बच्चों के जूते" },
      desc: { en: "Playful, tough little shoes that last.", hi: "मज़ेदार और मज़बूत, लंबे समय तक चलने वाले।" },
      whatsapp: "Kids Footwear",
      items: [
        "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=500&q=80"
      ]
    }
  };

  var galleryModal = document.getElementById("galleryModal");
  var galleryTitle = document.getElementById("galleryTitle");
  var galleryDesc = document.getElementById("galleryDesc");
  var galleryGrid = document.getElementById("galleryGrid");
  var galleryEnquire = document.getElementById("galleryEnquire");
  var openGalleryKey = null;

  function waMsg(text) {
    return "https://wa.me/91XXXXXXXXXX?text=" + encodeURIComponent(text);
  }

  function openGallery(key, refreshOnly) {
    var data = CATEGORY_ITEMS[key];
    if (!data || !galleryModal) return;
    openGalleryKey = key;
    var t = TRANSLATIONS[currentLang];

    galleryTitle.textContent = data.title[currentLang] || data.title.en;
    galleryDesc.textContent = data.desc[currentLang] || data.desc.en;
    galleryGrid.innerHTML = data.items.map(function (src, i) {
      var n = String(i + 1).padStart(2, "0");
      var href = waMsg("Hi Steemlite, I'm interested in bulk order of " + data.whatsapp + " — Style " + n);
      return '<figure class="gitem">' +
        '<div class="gitem__media"><img loading="lazy" src="' + src + '" alt="' + data.whatsapp + " style " + n + '" width="350" height="350" /></div>' +
        '<figcaption><span>' + t["gallery.style"] + " " + n + '</span><a href="' + href + '" target="_blank" rel="noopener">' + t["card.enquire"] + '</a></figcaption>' +
        '</figure>';
    }).join("");
    galleryEnquire.textContent = t["gallery.enquireInBulk"];
    galleryEnquire.href = waMsg("Hi Steemlite, I'm interested in bulk order of " + data.whatsapp);

    if (!refreshOnly) openModal(galleryModal);
  }

  if (galleryModal) {
    document.querySelectorAll(".card[data-lace]").forEach(function (card) {
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
      card.addEventListener("click", function (e) {
        if (e.target.closest(".card__link")) return; // let the direct Enquire link work as-is
        openGallery(card.getAttribute("data-lace"));
      });
      card.addEventListener("keydown", function (e) {
        if ((e.key === "Enter" || e.key === " ") && !e.target.closest(".card__link")) {
          e.preventDefault();
          openGallery(card.getAttribute("data-lace"));
        }
      });
    });
  }

  /* ---------- Share button: native share sheet, falls back to copy-link ---------- */
  var shareBtn = document.getElementById("shareBtn");
  var shareToast = document.getElementById("shareToast");
  var shareToastTimer;

  function showToast(msg) {
    if (!shareToast) return;
    shareToast.textContent = msg;
    shareToast.classList.add("is-visible");
    clearTimeout(shareToastTimer);
    shareToastTimer = setTimeout(function () { shareToast.classList.remove("is-visible"); }, 2200);
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var shareData = { title: document.title, url: window.location.href };
      if (navigator.share) {
        navigator.share(shareData).catch(function () { /* user cancelled — no-op */ });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(function () {
          showToast(TRANSLATIONS[currentLang]["share.copied"]);
        });
      }
    });
  }

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function closeNav() {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    // Close when a link is tapped
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Sticky nav background on scroll ---------- */
  var nav = document.getElementById("nav");
  var toTop = document.getElementById("toTop");

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-scrolled", y > 40);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Back to top ---------- */
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Shoelace: laces up the page as you scroll ----------
     Anchor points hug alternating page edges at each section boundary
     (grommet eyelets), joined by smooth curves. stroke-dashoffset draws
     the cord in sync with scroll; the aglet rides the drawn tip.      */
  var laceSvg = document.getElementById("lace");
  var lacePath = document.getElementById("laceBody");        // geometry + length reference
  var laceMaskPath = document.getElementById("laceMaskPath"); // animated reveal stroke
  var laceLayers = ["laceGlowOuter", "laceGlowInner", "laceEdge", "laceBody", "laceRibs", "laceSheen", "laceMaskPath"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var laceEyelets = document.getElementById("laceEyelets");
  var laceAglet = document.getElementById("laceAglet");
  var laceLen = 0;
  var laceSamples = null;   // Y -> length lookup, so the tip tracks the viewport
  var laceWaypoints = [];   // labelled markers that light up as the lace reaches them

  function buildLace() {
    if (!laceSvg || !lacePath) return;
    var docH = document.documentElement.scrollHeight;
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    [laceSvg, document.getElementById("laceMarkers")].forEach(function (svg) {
      if (!svg) return;
      svg.setAttribute("width", vw);
      svg.setAttribute("height", docH);
      svg.setAttribute("viewBox", "0 0 " + vw + " " + docH);
    });

    var xL = Math.max(vw * 0.06, 22);
    var xR = vw - xL;

    // anchors: every section, plus a labelled stop at each category card
    var anchors = [];
    document.querySelectorAll("main section").forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      var top = r.top + window.pageYOffset;
      anchors.push({ y: top + 46, label: sec.getAttribute("data-lace") || "", small: false });
      // tall sections without their own card stops get a plain mid-pass
      if (r.height > vh * 1.2 && !sec.querySelector(".card[data-lace]")) {
        anchors.push({ y: top + r.height * 0.6, label: "", small: false });
      }
    });
    document.querySelectorAll(".card[data-lace]").forEach(function (card) {
      var r = card.getBoundingClientRect();
      anchors.push({ y: r.top + window.pageYOffset - 12, label: card.getAttribute("data-lace"), small: true });
    });
    anchors.sort(function (a, b) { return a.y - b.y; });

    // strictly descending path so each scroll position maps to one lace point
    var pts = [{ x: -30, y: Math.max(20, vh * 0.14) }];
    var side = 1; // 1 = right edge next, -1 = left
    anchors.forEach(function (a, i) {
      a.y = Math.max(a.y, pts[pts.length - 1].y + 90);
      a.x = side > 0 ? xR : xL;
      a.eyelet = i > 0;
      pts.push(a);
      side = -side;
    });
    pts.push({ x: side > 0 ? vw + 30 : -30, y: docH - 40 });

    var d = "M " + pts[0].x + " " + pts[0].y;
    for (var i = 1; i < pts.length; i++) {
      var cy = (pts[i - 1].y + pts[i].y) / 2;
      d += " C " + pts[i - 1].x + " " + cy + " " + pts[i].x + " " + cy + " " + pts[i].x + " " + pts[i].y;
    }
    laceLayers.forEach(function (el) { el.setAttribute("d", d); });

    // ribbon width scales down a little on small screens
    var scale = vw < 700 ? 0.72 : 1;
    var widths = { laceGlowOuter: 44, laceGlowInner: 27, laceEdge: 16, laceBody: 12.5, laceRibs: 12.5, laceSheen: 3.5, laceMaskPath: 52 };
    laceLayers.forEach(function (el) {
      el.setAttribute("stroke-width", (widths[el.id] * scale).toFixed(1));
    });

    laceLen = lacePath.getTotalLength();
    // only the mask stroke animates; the woven layers keep their own textures
    laceMaskPath.style.strokeDasharray = laceLen;

    // sample the path once so any page Y maps to a length along the lace
    var N = 600, lens = new Float32Array(N + 1), ys = new Float32Array(N + 1);
    for (var s = 0; s <= N; s++) {
      var sp = lacePath.getPointAtLength(laceLen * s / N);
      lens[s] = laceLen * s / N; ys[s] = sp.y;
    }
    laceSamples = { lens: lens, ys: ys };

    // grommets + labelled waypoint markers that light up when reached
    var mk = "";
    pts.forEach(function (p) {
      if (!p.eyelet) return;
      var r = (p.small ? 9 : 13) * scale;
      var ring = '<circle class="wp-ring" cx="' + p.x + '" cy="' + p.y + '" r="' + r.toFixed(1) + '" fill="#0b0b0a" stroke-width="' + (3.5 * scale).toFixed(1) + '"/>';
      if (!p.label) { mk += ring; return; }
      var left = p.x < vw / 2;
      var tx = left ? p.x + r + 14 : p.x - r - 14;
      mk += '<g class="wp' + (p.small ? " wp--sm" : "") + '" data-len="' + lenAtY(p.y).toFixed(1) + '">' + ring +
        '<circle class="wp-pulse" cx="' + p.x + '" cy="' + p.y + '" r="' + (r + 9).toFixed(1) + '"/>' +
        '<text class="wp-label" x="' + tx + '" y="' + p.y + '" dominant-baseline="middle" text-anchor="' + (left ? "start" : "end") + '">' + p.label + '</text></g>';
    });
    laceEyelets.innerHTML = mk;
    laceWaypoints = [];
    laceEyelets.querySelectorAll("g.wp").forEach(function (g) {
      laceWaypoints.push({ el: g, len: parseFloat(g.getAttribute("data-len")) });
    });

    updateLace(window.pageYOffset || 0);
  }

  // map a page Y to the lace length at that height (path Y only ever descends)
  function lenAtY(ty) {
    if (!laceSamples) return 0;
    var ys = laceSamples.ys, lens = laceSamples.lens, lo = 0, hi = ys.length - 1;
    if (ty <= ys[0]) return lens[0];
    if (ty >= ys[hi]) return laceLen;
    while (hi - lo > 1) { var mid = (hi + lo) >> 1; if (ys[mid] < ty) lo = mid; else hi = mid; }
    var f = (ty - ys[lo]) / ((ys[hi] - ys[lo]) || 1);
    return lens[lo] + (lens[hi] - lens[lo]) * f;
  }

  function updateLace(y) {
    if (!laceLen || !laceSamples) return;
    var docH = document.documentElement.scrollHeight;
    var vh = window.innerHeight;
    // the tip tracks a fixed line ~80% down the viewport, so the lace moves
    // 1:1 with scrolling; snaps fully laced at the page bottom
    var drawn = (reduceMotion || y + vh >= docH - 2) ? laceLen
      : Math.max(60, lenAtY(y + vh * 0.8));
    laceMaskPath.style.strokeDashoffset = laceLen - drawn;
    var tip = lacePath.getPointAtLength(drawn);
    var back = lacePath.getPointAtLength(Math.max(0, drawn - 16));
    var ang = Math.atan2(tip.y - back.y, tip.x - back.x) * 180 / Math.PI;
    laceAglet.setAttribute("transform", "translate(" + tip.x + " " + tip.y + ") rotate(" + ang + ")");
    // light up every waypoint the lace has reached
    for (var i = 0; i < laceWaypoints.length; i++) {
      laceWaypoints[i].el.classList.toggle("is-lit", drawn >= laceWaypoints[i].len - 2);
    }
  }

  // (re)build once now, again when everything has loaded, and on layout changes
  var laceRebuildTimer;
  function queueLaceRebuild() {
    clearTimeout(laceRebuildTimer);
    laceRebuildTimer = setTimeout(buildLace, 200);
  }
  buildLace();
  window.addEventListener("load", buildLace);
  if ("ResizeObserver" in window) {
    new ResizeObserver(queueLaceRebuild).observe(document.body);
  } else {
    window.addEventListener("resize", queueLaceRebuild);
  }

  /* ---------- Live background: parallax + marquee skew + progress ----------
     One requestAnimationFrame loop drives everything the scroll touches:
     - .bg-scene orbs/watermark words drift at their data-speed
     - marquee strips skew with scroll velocity, then ease back
     - top progress bar tracks how far down the page you are            */
  var parallaxEls = document.querySelectorAll(".bg-scene [data-speed]");
  var marquees = document.querySelectorAll(".marquee");
  var progress = document.getElementById("scrollProgress");

  if (!reduceMotion && (parallaxEls.length || marquees.length || progress)) {
    var lastY = window.pageYOffset;
    var skew = 0;

    var tick = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;

      // parallax drift
      parallaxEls.forEach(function (el) {
        var s = parseFloat(el.getAttribute("data-speed")) || 0;
        el.style.transform = "translate3d(" + (y * s) + "px," + (y * s * 0.35) + "px,0)";
      });

      // marquee skew follows scroll velocity, eased back to 0
      var vel = y - lastY;
      lastY = y;
      skew += ((Math.max(-14, Math.min(14, vel * 0.45))) - skew) * 0.12;
      if (Math.abs(skew) < 0.01) skew = 0;
      marquees.forEach(function (m) {
        m.style.transform = "skewX(" + skew.toFixed(2) + "deg)";
      });

      // progress bar
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
      }

      // lace up the page
      updateLace(y);

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Scroll reveal via IntersectionObserver ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach(function (el, i) {
      // subtle stagger for groups of siblings
      el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + "ms";
      io.observe(el);
    });
  }

  /* ---------- Animated count-up for stats ---------- */
  var statNums = document.querySelectorAll(".stat__num");

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }

    var duration = 1600;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && statNums.length) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statNums.forEach(function (el) { statIO.observe(el); });
  } else {
    statNums.forEach(function (el) {
      el.textContent = (el.getAttribute("data-target") || "") + (el.getAttribute("data-suffix") || "");
    });
  }
})();
