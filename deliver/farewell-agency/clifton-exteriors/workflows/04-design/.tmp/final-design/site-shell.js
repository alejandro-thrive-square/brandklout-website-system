(function () {
  if (window.__cxSiteShellReady) return;
  window.__cxSiteShellReady = true;

  var routes = {
    home: "index.html",
    windows: "page-windows.html",
    doors: "page-doors.html",
    roofing: "page-roofing.html",
    siding: "page-siding.html",
    gutters: "page-gutters.html",
    process: "page-our-process.html",
    pricing: "page-pricing.html",
    portfolio: "page-portfolio.html",
    financing: "page-financing.html",
    insurance: "page-insurance-claims.html",
    contact: "page-contact-us.html",
    about: "page-about-us.html",
    testimonials: "page-testimonials.html",
    locations: "page-service-locations.html",
    blog: "page-blog.html",
    employment: "page-employment.html",
    media: "page-media.html",
    privacy: "page-privacy-policy.html",
    terms: "page-terms-of-service.html"
  };

  var logoDark = "https://cdn.prod.website-files.com/6a234fcd5732d1f0a674156f/6a260cc3d597c8e6797e1f57_clifton-sharp.svg";
  var logoLight = "https://cdn.prod.website-files.com/6a234fcd5732d1f0a674156f/6a3b00bd1500e9ece1ed5b46_clifton-light.svg";

  function item(route, title, description) {
    return '<a class="cx-site-nav__item" data-cx-route="' + route + '" href="' + routes[route] + '"><strong>' + title + '</strong><span>' + description + '</span></a>';
  }

  var serviceItems =
    item("windows", "Windows", "Energy-efficient custom vinyl") +
    item("doors", "Doors", "Secure entryways and patio styles") +
    item("roofing", "Roofing", "Architectural shingle systems") +
    item("siding", "Siding", "Low-maintenance home protection") +
    item("gutters", "Gutters", "High-capacity drainage systems") +
    item("process", "Our 10-Step Method", "From inspection to completion");

  var companyItems =
    item("about", "Our Story", "Family-owned local values") +
    item("testimonials", "Our Testimonials", "Read our reviews") +
    item("portfolio", "Photo Portfolio", "See our local work") +
    item("locations", "Service Areas", "Serving Northern Virginia") +
    item("blog", "The Exterior Blog", "Maintenance tips and ideas") +
    item("employment", "Join Our Team", "Careers in craftsmanship");

  var nav = document.createElement("header");
  nav.className = "cx-site-nav";
  nav.setAttribute("data-cx-site-nav", "");
  nav.innerHTML =
    '<div class="cx-site-nav__bar">' +
      '<a class="cx-site-nav__logo" href="' + routes.home + '" aria-label="Clifton Exteriors home"><img src="' + logoDark + '" alt="Clifton Exteriors"></a>' +
      '<nav class="cx-site-nav__links" aria-label="Primary navigation">' +
        '<button class="cx-site-nav__toggle" type="button" data-cx-panel="services" aria-expanded="false">Services</button>' +
        '<button class="cx-site-nav__toggle" type="button" data-cx-panel="company" aria-expanded="false">Company</button>' +
      '</nav>' +
      '<div class="cx-site-nav__actions">' +
        '<a class="cx-site-nav__phone" href="tel:+15712491480">(571) 249-1480</a>' +
        '<a class="cx-site-shell__button" href="' + routes.contact + '">Get Quote</a>' +
        '<button class="cx-site-nav__mobile-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span></button>' +
      '</div>' +
    '</div>' +
    '<div class="cx-site-nav__dropdown" data-cx-dropdown="services">' +
      '<div class="cx-site-nav__panel"><p class="cx-site-nav__eyebrow">Expertise</p><div class="cx-site-nav__grid">' + serviceItems + '</div></div>' +
      '<div class="cx-site-nav__panel is-accent"><p class="cx-site-nav__eyebrow">Plan Your Project</p><div class="cx-site-nav__grid">' +
        item("pricing", "Project Pricing", "Upfront cost estimates") +
        item("financing", "Financing Options", "Monthly payment plans") +
        item("insurance", "Insurance Claims", "Storm damage coordination") +
        item("contact", "Get a Free Quote", "Schedule your consultation") +
      '</div></div>' +
    '</div>' +
    '<div class="cx-site-nav__dropdown" data-cx-dropdown="company">' +
      '<div class="cx-site-nav__panel"><p class="cx-site-nav__eyebrow">Company</p><div class="cx-site-nav__grid">' + companyItems + '</div></div>' +
      '<div class="cx-site-nav__panel is-accent"><p class="cx-site-nav__eyebrow">Start Here</p><div class="cx-site-nav__grid">' +
        item("media", "Media Center", "See Clifton in action") +
        item("contact", "Contact Us", "Tell us about your project") +
      '</div></div>' +
    '</div>' +
    '<div class="cx-site-nav__dropdown" data-mobile-menu>' +
      '<div class="cx-site-nav__panel"><p class="cx-site-nav__eyebrow">Explore</p><div class="cx-site-nav__grid">' + serviceItems + companyItems +
        item("pricing", "Pricing", "Project cost guidance") +
        item("financing", "Financing", "Payment options") +
        item("insurance", "Insurance Claims", "Storm damage help") +
        item("contact", "Get a Quote", "Schedule your consultation") +
      '</div></div>' +
    '</div>';

  var footer = document.createElement("footer");
  footer.className = "cx-site-footer";
  footer.setAttribute("data-cx-site-footer", "");
  footer.innerHTML =
    '<div class="cx-site-footer__top">' +
      '<div class="cx-site-footer__brand">' +
        '<p>Proudly serving Fairfax County, Prince William County, Loudoun County, and surrounding areas.</p>' +
        '<div class="cx-site-footer__contact"><a href="tel:+15712491480">(571) 249-1480</a><a href="mailto:info@cliftonexteriors.com">info@cliftonexteriors.com</a><address class="cx-site-footer__address">12644 Chapel Rd #104, Clifton, VA 20124</address></div>' +
        '<a class="cx-site-shell__button" href="' + routes.contact + '">Get Quote</a>' +
      '</div>' +
      '<div class="cx-site-footer__cols">' +
        '<div class="cx-site-footer__col"><h2>Services</h2><a href="' + routes.windows + '">Windows</a><a href="' + routes.doors + '">Doors</a><a href="' + routes.roofing + '">Roofing</a><a href="' + routes.siding + '">Siding</a><a href="' + routes.gutters + '">Gutters</a></div>' +
        '<div class="cx-site-footer__col"><h2>Company</h2><a href="' + routes.about + '">About Us</a><a href="' + routes.process + '">Our Process</a><a href="' + routes.portfolio + '">Portfolio</a><a href="' + routes.locations + '">Service Areas</a><a href="' + routes.employment + '">Employment</a></div>' +
        '<div class="cx-site-footer__col"><h2>Resources</h2><a href="' + routes.pricing + '">Pricing</a><a href="' + routes.financing + '">Financing</a><a href="' + routes.insurance + '">Insurance Claims</a><a href="' + routes.testimonials + '">Testimonials</a><a href="' + routes.blog + '">Blog</a></div>' +
      '</div>' +
    '</div>' +
    '<div class="cx-site-footer__divider"></div>' +
    '<div class="cx-site-footer__bottom"><span>© 2026 Clifton Exteriors, LLC. All rights reserved.</span><div class="cx-site-footer__legal"><a href="' + routes.privacy + '">Privacy Policy</a><a href="' + routes.terms + '">Terms of Service</a></div><div class="cx-site-footer__social"><a href="https://www.facebook.com/profile.php?id=61552804499371" target="_blank" rel="noopener">Facebook</a><a href="https://www.instagram.com/cliftonexteriors/" target="_blank" rel="noopener">Instagram</a><a href="https://www.yelp.com/biz/clifton-exteriors-clifton-2" target="_blank" rel="noopener">Yelp</a><a href="https://www.youtube.com/channel/UCKnfekr9tH3H5h_3b42T07A" target="_blank" rel="noopener">YouTube</a></div></div>' +
    '<a class="cx-site-footer__wordmark" href="' + routes.home + '" aria-label="Clifton Exteriors home"><img src="' + logoLight + '" alt="Clifton Exteriors"></a>';

  var first = document.body.firstElementChild;
  document.body.insertBefore(nav, first);
  document.body.appendChild(footer);

  var file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  nav.querySelectorAll("[data-cx-route]").forEach(function (link) {
    if (routes[link.getAttribute("data-cx-route")] === file) link.setAttribute("aria-current", "page");
  });

  var toggles = nav.querySelectorAll("[data-cx-panel]");
  var dropdowns = nav.querySelectorAll("[data-cx-dropdown]");
  function closePanels(except) {
    dropdowns.forEach(function (panel) { if (panel !== except) panel.classList.remove("is-open"); });
    toggles.forEach(function (toggle) {
      var panel = nav.querySelector('[data-cx-dropdown="' + toggle.getAttribute("data-cx-panel") + '"]');
      toggle.setAttribute("aria-expanded", panel && panel.classList.contains("is-open") ? "true" : "false");
    });
  }
  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var panel = nav.querySelector('[data-cx-dropdown="' + toggle.getAttribute("data-cx-panel") + '"]');
      var opening = !panel.classList.contains("is-open");
      closePanels(panel);
      panel.classList.toggle("is-open", opening);
      toggle.setAttribute("aria-expanded", opening ? "true" : "false");
    });
  });

  var mobileToggle = nav.querySelector(".cx-site-nav__mobile-toggle");
  var mobileMenu = nav.querySelector("[data-mobile-menu]");
  mobileToggle.addEventListener("click", function () {
    var opening = !mobileMenu.classList.contains("is-open");
    closePanels(mobileMenu);
    mobileMenu.classList.toggle("is-open", opening);
    mobileToggle.setAttribute("aria-expanded", opening ? "true" : "false");
    mobileToggle.setAttribute("aria-label", opening ? "Close navigation" : "Open navigation");
  });

  document.addEventListener("click", function (event) {
    if (!nav.contains(event.target)) closePanels();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closePanels();
      mobileMenu.classList.remove("is-open");
      mobileToggle.setAttribute("aria-expanded", "false");
    }
  });
})();
