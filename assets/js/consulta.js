/** Consulta multi-step form — GetGeneria */
document.addEventListener("DOMContentLoaded", () => {
    const CONTACT = window.GENERIA_CONTACT || {
        email: "info@getgeneria.com",
        phoneDisplay: "+52 56 7127 6611",
        phoneDigits: "525671276611",
    };

    const form = document.getElementById("consulta-form");
    if (!form) return;

    const steps = form.querySelectorAll(".step");
    const progressFill = document.getElementById("progress-fill");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const tipoSelect = document.getElementById("tipo");
    const diagnosticoFields = document.getElementById("diagnostico-fields");
    const resumenContent = document.getElementById("resumen-content");
    const alcanceTextarea = document.getElementById("alcance");
    const submitBtn = document.getElementById("submit-btn");
    const quickAlcanceBtn = document.getElementById("quick-alcance");
    const stepTitle = document.getElementById("step-title");
    const stepDesc = document.getElementById("step-desc");

    const stepMeta = [
        { title: "Cuéntanos sobre ti", desc: "Datos básicos para personalizar tu propuesta." },
        { title: "Enfoque del proyecto", desc: "Dos preguntas rápidas según el tipo de producto." },
        { title: "Alcance y envío", desc: "Describe tu proyecto y recibe respuesta en 24–48 h hábiles." },
    ];

    let currentStep = 0;

    const trackEvent = (eventName, details = {}) => {
        const key = "generia_metrics";
        const events = JSON.parse(localStorage.getItem(key) || "[]");
        events.push({ event: eventName, details, ts: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(events.slice(-200)));
    };

    const diagnosticoConfig = {
        "plataforma-saas": [
            { label: "Sector principal", id: "objetivo", options: ["Salud", "Educación", "Servicios profesionales", "Otro"] },
            { label: "Escala inicial", id: "volumen", options: ["MVP / piloto", "Cientos de usuarios", "Miles de usuarios"] },
        ],
        "automatizacion-ia": [
            { label: "Proceso a automatizar", id: "objetivo", options: ["Atención y clasificación", "Reportes y análisis", "Flujos operativos"] },
            { label: "Volumen de información", id: "volumen", options: ["Bajo", "Medio", "Alto"] },
        ],
        "portal-empresarial": [
            { label: "Usuarios principales", id: "objetivo", options: ["Clientes externos", "Equipo interno", "Ambos"] },
            { label: "Prioridad", id: "volumen", options: ["Autoservicio", "Control centralizado", "Integraciones"] },
        ],
        "landing-page": [
            { label: "Objetivo del sitio", id: "objetivo", options: ["Captar leads", "Validar producto", "Presentar marca"] },
            { label: "Tráfico esperado", id: "volumen", options: ["Campañas puntuales", "Crecimiento constante", "Alto volumen"] },
        ],
        "sistema-citas": [
            { label: "Tipo de agenda", id: "objetivo", options: ["Servicios", "Consultoría", "Espacios / recursos"] },
            { label: "Volumen de citas", id: "volumen", options: ["Hasta 50 / semana", "50–200 / semana", "Más de 200 / semana"] },
        ],
        "crm-operativo": [
            { label: "Área crítica", id: "objetivo", options: ["Pipeline comercial", "Seguimiento post-venta", "Operación diaria"] },
            { label: "Tamaño del equipo", id: "volumen", options: ["1–5 personas", "6–20 personas", "Más de 20"] },
        ],
        "asistente-ia": [
            { label: "Canal principal", id: "objetivo", options: ["Sitio web", "WhatsApp", "Portal interno"] },
            { label: "Complejidad", id: "volumen", options: ["FAQ y respuestas", "Clasificación", "Acciones automatizadas"] },
        ],
        otro: [
            { label: "Tipo de resultado buscado", id: "objetivo", options: ["Nuevo producto digital", "Mejorar proceso existente", "Escalar plataforma actual"] },
            { label: "Urgencia", id: "volumen", options: ["Exploración", "Medio plazo", "Prioridad alta"] },
        ],
    };

    const alcanceTemplates = {
        "plataforma-saas": "Necesito una plataforma SaaS con módulos claros, usuarios por rol y métricas de negocio desde el día uno.",
        "automatizacion-ia": "Necesito automatizar procesos con IA para reducir trabajo manual y acelerar decisiones con datos accionables.",
        "portal-empresarial": "Necesito un portal para clientes o equipos con acceso seguro, autoservicio y visibilidad del estado de cada caso.",
        "landing-page": "Necesito una landing page profesional orientada a conversión, con mensaje claro y formulario de contacto optimizado.",
        "sistema-citas": "Necesito un sistema de citas con disponibilidad en tiempo real, confirmaciones y recordatorios automáticos.",
        "crm-operativo": "Necesito un CRM operativo para priorizar oportunidades, dar seguimiento y tener control del pipeline comercial.",
        "asistente-ia": "Necesito un asistente de IA integrado que responda, clasifique y derive casos según reglas de negocio.",
        otro: "Necesito un producto digital a medida. Comparto contexto y objetivos para recibir una propuesta inicial.",
    };

    const showStep = (step) => {
        steps.forEach((s, i) => s.classList.toggle("hidden", i !== step));
        if (progressFill) progressFill.style.width = `${((step + 1) / steps.length) * 100}%`;
        if (stepTitle) stepTitle.textContent = stepMeta[step].title;
        if (stepDesc) stepDesc.textContent = stepMeta[step].desc;
        if (prevBtn) {
            prevBtn.disabled = step === 0;
            prevBtn.style.opacity = step === 0 ? "0.5" : "1";
        }
        if (nextBtn) nextBtn.classList.toggle("hidden", step === steps.length - 1);
        if (step === steps.length - 1) {
            updateResumen();
            checkAlcanceLength();
        }
    };

    const checkAlcanceLength = () => {
        if (!submitBtn || !alcanceTextarea) return;
        submitBtn.disabled = alcanceTextarea.value.trim().length < 25;
    };

    const validateStep = (step) => {
        const fields = steps[step].querySelectorAll("input, select, textarea");
        for (const field of fields) {
            if (field.hasAttribute("required") && !field.value.trim()) return false;
        }
        return true;
    };

    const buildField = (field) => {
        const div = document.createElement("div");
        div.className = "form-group";
        const label = document.createElement("label");
        label.textContent = field.label;
        label.setAttribute("for", field.id);
        const select = document.createElement("select");
        select.id = field.id;
        select.name = field.id;
        select.className = "form-select";
        select.required = true;
        select.innerHTML =
            '<option value="" disabled selected>Selecciona una opción</option>' +
            field.options.map((o) => `<option value="${o}">${o}</option>`).join("");
        div.appendChild(label);
        div.appendChild(select);
        return div;
    };

    const generateDiagnostico = (tipo) => {
        if (!diagnosticoFields) return;
        diagnosticoFields.innerHTML = "";
        (diagnosticoConfig[tipo] || []).forEach((f) => diagnosticoFields.appendChild(buildField(f)));
        const o = document.getElementById("objetivo");
        const v = document.getElementById("volumen");
        if (o && o.options.length > 1) o.selectedIndex = 1;
        if (v && v.options.length > 1) v.selectedIndex = 1;
    };

    const getDiagnosticoText = () => {
        const o = document.getElementById("objetivo");
        const v = document.getElementById("volumen");
        return o && v ? `${o.value} · ${v.value}` : "";
    };

    const updateResumen = () => {
        if (!resumenContent) return;
        const nombre = document.getElementById("nombre")?.value || "";
        const tipo = tipoSelect?.options[tipoSelect.selectedIndex]?.text || "";
        const email = document.getElementById("email")?.value || "";
        const alcance = alcanceTextarea?.value || "";
        const tiempo = document.getElementById("tiempo");
        const tiempoText = tiempo?.options[tiempo.selectedIndex]?.text || "";
        resumenContent.innerHTML = `
            <strong>Nombre:</strong> ${nombre}<br>
            <strong>Producto:</strong> ${tipo}<br>
            <strong>Email:</strong> ${email}<br>
            <strong>Enfoque:</strong> ${getDiagnosticoText()}<br>
            <strong>Alcance:</strong> ${alcance}<br>
            <strong>Lanzamiento:</strong> ${tiempoText}
        `;
    };

    const buildMailTo = (payload) => {
        const subject = encodeURIComponent(`Propuesta — ${payload.tipo || "proyecto"}`);
        const body = encodeURIComponent(
            [
                "Nueva solicitud — GetGeneria",
                "",
                `Nombre: ${payload.nombre}`,
                `Email: ${payload.email}`,
                `Tipo: ${payload.tipo}`,
                `Diagnóstico: ${payload.diagnostico}`,
                `Alcance: ${payload.alcance}`,
                `Tiempo: ${payload.tiempo}`,
                `Fecha: ${payload.timestamp}`,
                "",
                JSON.stringify(payload, null, 2),
            ].join("\n")
        );
        return `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    };

    const emailLink = document.getElementById("contact-email-link");
    const phoneLink = document.getElementById("contact-phone-link");
    if (emailLink) {
        emailLink.href = `mailto:${CONTACT.email}`;
        emailLink.textContent = CONTACT.email;
    }
    if (phoneLink) {
        phoneLink.href = `https://wa.me/${CONTACT.phoneDigits}`;
        phoneLink.textContent = CONTACT.phoneDisplay;
    }

    const params = new URLSearchParams(window.location.search);
    const tipoParam = params.get("tipo");
    if (tipoParam && tipoSelect) {
        const opt = [...tipoSelect.options].find((o) => o.value === tipoParam);
        if (opt) {
            tipoSelect.value = tipoParam;
            generateDiagnostico(tipoParam);
        }
    }

    tipoSelect?.addEventListener("change", () => generateDiagnostico(tipoSelect.value));

    quickAlcanceBtn?.addEventListener("click", () => {
        if (!tipoSelect?.value) {
            alert("Primero selecciona el tipo de producto.");
            return;
        }
        alcanceTextarea.value = alcanceTemplates[tipoSelect.value] || alcanceTemplates.otro;
        checkAlcanceLength();
        updateResumen();
    });

    alcanceTextarea?.addEventListener("input", () => {
        checkAlcanceLength();
        updateResumen();
    });

    nextBtn?.addEventListener("click", () => {
        if (!validateStep(currentStep)) {
            alert("Completa todos los campos obligatorios.");
            return;
        }
        if (currentStep === 0 && tipoSelect?.value) generateDiagnostico(tipoSelect.value);
        if (currentStep < steps.length - 1) {
            currentStep++;
            showStep(currentStep);
            trackEvent("consulta_next_step", { step: currentStep + 1 });
        }
    });

    prevBtn?.addEventListener("click", () => {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validateStep(2)) {
            alert("Completa todos los campos obligatorios.");
            return;
        }
        const payload = {
            nombre: document.getElementById("nombre")?.value,
            tipo: tipoSelect?.value,
            email: document.getElementById("email")?.value,
            diagnostico: getDiagnosticoText(),
            alcance: alcanceTextarea?.value,
            tiempo: document.getElementById("tiempo")?.value,
            timestamp: new Date().toISOString(),
        };
        trackEvent("consulta_submit", payload);
        submitBtn.disabled = true;
        submitBtn.textContent = "Abriendo correo…";
        window.location.href = buildMailTo(payload);
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = "Enviar propuesta";
        }, 2000);
    });

    showStep(0);
});
