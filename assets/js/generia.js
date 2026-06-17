/** Shared site behavior — GetGeneria */
(function () {
    const CONTACT = {
        email: "info@getgeneria.com",
        phoneDisplay: "+52 55 4027 3270",
        phoneDigits: "525540273270",
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
