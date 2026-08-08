/** Soft rotating point-globe for the hero background (COBE / WebGL). */
import createGlobe from "./vendor/cobe.js";

(function initHeroGlobe() {
    const canvas = document.getElementById("hero-globe-canvas");
    const host = document.querySelector(".hero-globe");
    const hero = document.getElementById("hero");
    if (!canvas || !host || !hero) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phi = 2.35;
    let globe = null;
    let width = 0;
    let visible = true;
    let running = true;

    const markers = [
        { location: [19.4326, -99.1332], size: 0.07 }, // CDMX
        { location: [25.6866, -100.3161], size: 0.045 }, // Monterrey
        { location: [20.6597, -103.3496], size: 0.04 }, // Guadalajara
        { location: [4.711, -74.0721], size: 0.04 }, // Bogotá
        { location: [-12.0464, -77.0428], size: 0.035 }, // Lima
        { location: [-34.6037, -58.3816], size: 0.04 }, // Buenos Aires
        { location: [40.4168, -3.7038], size: 0.035 }, // Madrid
    ];

    const mount = () => {
        const rect = host.getBoundingClientRect();
        const side = Math.max(rect.width, rect.height, 480);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = side * dpr;

        if (globe) {
            globe.destroy();
            globe = null;
        }

        globe = createGlobe(canvas, {
            devicePixelRatio: dpr,
            width,
            height: width,
            phi,
            theta: 0.28,
            dark: 1,
            diffuse: 1.15,
            mapSamples: 14000,
            mapBrightness: 5.2,
            baseColor: [0.22, 0.24, 0.42],
            markerColor: [0.13, 0.83, 0.93],
            glowColor: [0.45, 0.5, 0.95],
            opacity: 0.92,
            scale: 1.05,
            offset: [0, 0],
            markers,
            onRender: (state) => {
                if (!reduceMotion && running && visible) {
                    phi += 0.0028;
                }
                state.phi = phi;
                state.width = width;
                state.height = width;
            },
        });
    };

    const resizeObserver = new ResizeObserver(() => {
        const next = Math.max(host.clientWidth, host.clientHeight, 480);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const nextWidth = next * dpr;
        if (Math.abs(nextWidth - width) > 24) mount();
    });

    const io = new IntersectionObserver(
        ([entry]) => {
            visible = Boolean(entry?.isIntersecting);
        },
        { threshold: 0.05 }
    );

    document.addEventListener("visibilitychange", () => {
        running = document.visibilityState === "visible";
    });

    mount();
    resizeObserver.observe(host);
    io.observe(hero);
})();
