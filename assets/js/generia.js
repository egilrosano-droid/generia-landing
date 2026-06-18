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

    const sectionIds = ["capacidades", "productos", "proceso", "contacto"];
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

    document.querySelectorAll("[data-product-carousel]").forEach((carousel) => {
        const slides = carousel.querySelectorAll(".product-carousel-slide");
        const dots = carousel.querySelectorAll(".product-carousel-dot");
        const total = slides.length;
        if (!total || !dots.length) return;

        let index = 0;
        let timer;

        const goTo = (next) => {
            index = ((next % total) + total) % total;
            slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
            dots.forEach((dot, i) => {
                const active = i === index;
                dot.classList.toggle("is-active", active);
                dot.setAttribute("aria-selected", active ? "true" : "false");
            });
        };

        const startTimer = () => {
            clearInterval(timer);
            timer = setInterval(() => goTo(index + 1), 5000);
        };

        dots.forEach((dot, i) => {
            dot.addEventListener("click", () => {
                goTo(i);
                startTimer();
            });
        });

        carousel.addEventListener("mouseenter", () => clearInterval(timer));
        carousel.addEventListener("mouseleave", startTimer);

        goTo(0);
        startTimer();
    });

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
