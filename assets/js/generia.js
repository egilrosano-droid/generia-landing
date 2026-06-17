/** Shared site behavior — GetGeneria */
(function () {
    const CONTACT = {
        email: "info@getgeneria.com",
        phoneDisplay: "+52 56 7127 6611",
        phoneDigits: "525671276611",
    };

    window.GENERIA_CONTACT = CONTACT;

    const header = document.querySelector(".site-header");
    const menuToggle = document.querySelector(".menu-toggle");
    const navMobile = document.querySelector(".nav-mobile");

    if (header) {
        const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    if (menuToggle && navMobile) {
        menuToggle.addEventListener("click", () => {
            const open = navMobile.classList.toggle("is-open");
            menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
        navMobile.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                navMobile.classList.remove("is-open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    const sectionIds = ["soluciones", "productos", "proceso", "contacto"];
    const navAnchors = document.querySelectorAll(
        '.nav-desktop a[href^="#"], .nav-mobile a[href^="#"]'
    );
    const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    if (sections.length && navAnchors.length) {
        const setActive = (id) => {
            navAnchors.forEach((a) => {
                const href = a.getAttribute("href");
                a.classList.toggle("is-active", href === `#${id}`);
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: `-${header ? header.offsetHeight : 72}px 0px -45% 0px`, threshold: [0.15, 0.35, 0.55] }
        );

        sections.forEach((section) => observer.observe(section));
    }

    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const fd = new FormData(contactForm);
            const nombre = fd.get("nombre") || "";
            const email = fd.get("email") || "";
            const tipo = fd.get("tipo") || "";
            const mensaje = fd.get("mensaje") || "";
            const subject = encodeURIComponent(`Contacto web — ${tipo || "consulta"}`);
            const body = encodeURIComponent(
                [
                    "Nuevo contacto desde getgeneria.com",
                    "",
                    `Nombre: ${nombre}`,
                    `Email: ${email}`,
                    `Interés: ${tipo}`,
                    "",
                    mensaje,
                ].join("\n")
            );
            window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
        });
    }
})();
