/** Soft rotating point-globe + orbiting comms satellite for the hero. */
import createGlobe from "./vendor/cobe.js";

(function initHeroGlobe() {
    const canvas = document.getElementById("hero-globe-canvas");
    const orbitCanvas = document.getElementById("hero-orbit-canvas");
    const host = document.querySelector(".hero-globe");
    const stage = document.querySelector(".hero-globe-stage");
    const hero = document.getElementById("hero");
    if (!canvas || !orbitCanvas || !host || !stage || !hero) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const orbitCtx = orbitCanvas.getContext("2d");
    let phi = 2.35;
    let globe = null;
    let width = 0;
    let visible = true;
    let running = true;
    let orbitAngle = 0.85;
    let wavePhase = 0;
    let rafId = 0;

    const markers = [
        { location: [19.4326, -99.1332], size: 0.07 }, // CDMX
        { location: [25.6866, -100.3161], size: 0.045 }, // Monterrey
        { location: [20.6597, -103.3496], size: 0.04 }, // Guadalajara
        { location: [4.711, -74.0721], size: 0.04 }, // Bogotá
        { location: [-12.0464, -77.0428], size: 0.035 }, // Lima
        { location: [-34.6037, -58.3816], size: 0.04 }, // Buenos Aires
        { location: [40.4168, -3.7038], size: 0.035 }, // Madrid
    ];

    const syncOrbitSize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const css = stage.getBoundingClientRect();
        const side = Math.max(1, Math.round(Math.max(css.width, css.height)));
        orbitCanvas.width = Math.round(side * dpr);
        orbitCanvas.height = Math.round(side * dpr);
        orbitCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return side;
    };

    const drawOrbitScene = (cssSize) => {
        const w = cssSize;
        const h = cssSize;
        orbitCtx.clearRect(0, 0, w, h);

        const cx = w * 0.5;
        const cy = h * 0.5;
        // Matches COBE's visible sphere footprint inside the square canvas.
        const globeR = w * 0.4;
        const orbitRx = globeR * 1.28;
        const orbitRy = globeR * 0.42;
        const tilt = -0.38;

        // Soft orbital trail
        orbitCtx.save();
        orbitCtx.translate(cx, cy);
        orbitCtx.rotate(tilt);
        orbitCtx.beginPath();
        orbitCtx.ellipse(0, 0, orbitRx, orbitRy, 0, 0, Math.PI * 2);
        orbitCtx.strokeStyle = "rgba(165, 180, 252, 0.18)";
        orbitCtx.lineWidth = Math.max(1, w * 0.0022);
        orbitCtx.setLineDash([w * 0.012, w * 0.018]);
        orbitCtx.stroke();
        orbitCtx.setLineDash([]);
        orbitCtx.restore();

        // 3D-ish elliptical orbit position
        const cosA = Math.cos(orbitAngle);
        const sinA = Math.sin(orbitAngle);
        const localX = orbitRx * cosA;
        const localY = orbitRy * sinA;
        const worldX = cx + localX * Math.cos(tilt) - localY * Math.sin(tilt);
        const worldY = cy + localX * Math.sin(tilt) + localY * Math.cos(tilt);
        // Depth cue: front when sinA > 0 in this projection
        const depth = Math.sin(orbitAngle + tilt);
        const inFront = depth >= -0.05;
        const satScale = 0.88 + 0.22 * ((depth + 1) / 2);
        const satAlpha = inFront ? 1 : 0.28;

        // Ground contact point (beam aim) — slightly toward equator front
        const aimX = cx + globeR * 0.18;
        const aimY = cy + globeR * 0.08;

        // Direction from sat to earth aim
        const dx = aimX - worldX;
        const dy = aimY - worldY;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        const px = -uy;
        const py = ux;

        // Clip beam start just outside earth surface along the ray
        const toCenterX = cx - worldX;
        const toCenterY = cy - worldY;
        const toCenterDist = Math.hypot(toCenterX, toCenterY) || 1;
        const surfaceDist = Math.max(globeR * 0.15, toCenterDist - globeR * 0.98);
        const hitX = worldX + (toCenterX / toCenterDist) * surfaceDist;
        const hitY = worldY + (toCenterY / toCenterDist) * surfaceDist;
        const beamLen = Math.hypot(hitX - worldX, hitY - worldY);

        if (inFront && beamLen > 8) {
            const baseHalf = Math.max(10, w * 0.018);
            const tipHalf = Math.max(1.5, w * 0.0035);
            const cone = new Path2D();
            cone.moveTo(worldX + px * tipHalf, worldY + py * tipHalf);
            cone.lineTo(worldX - px * tipHalf, worldY - py * tipHalf);
            cone.lineTo(hitX - px * baseHalf, hitY - py * baseHalf);
            cone.lineTo(hitX + px * baseHalf, hitY + py * baseHalf);
            cone.closePath();

            const grad = orbitCtx.createLinearGradient(worldX, worldY, hitX, hitY);
            grad.addColorStop(0, "rgba(34, 211, 238, 0.55)");
            grad.addColorStop(0.45, "rgba(129, 140, 248, 0.22)");
            grad.addColorStop(1, "rgba(165, 180, 252, 0.02)");

            orbitCtx.save();
            orbitCtx.globalAlpha = 0.9;
            orbitCtx.fillStyle = grad;
            orbitCtx.fill(cone);

            // Soft outer glow cone
            orbitCtx.globalAlpha = 0.35;
            orbitCtx.filter = `blur(${Math.max(2, w * 0.006)}px)`;
            orbitCtx.fill(cone);
            orbitCtx.filter = "none";
            orbitCtx.restore();

            // Traveling wave rings along the beam
            for (let i = 0; i < 4; i++) {
                const t = (wavePhase + i * 0.22) % 1;
                const rx = worldX + ux * beamLen * t;
                const ry = worldY + uy * beamLen * t;
                const half = tipHalf + (baseHalf - tipHalf) * t;
                const alpha = (1 - t) * 0.55;

                orbitCtx.save();
                orbitCtx.translate(rx, ry);
                orbitCtx.rotate(Math.atan2(uy, ux));
                orbitCtx.beginPath();
                orbitCtx.ellipse(0, 0, half * 0.35, half, 0, 0, Math.PI * 2);
                orbitCtx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
                orbitCtx.lineWidth = Math.max(1, w * 0.002);
                orbitCtx.stroke();
                orbitCtx.restore();
            }

            // Ground footprint pulse
            const pulse = 0.55 + 0.45 * Math.sin(wavePhase * Math.PI * 2);
            orbitCtx.beginPath();
            orbitCtx.arc(hitX, hitY, baseHalf * (0.7 + pulse * 0.35), 0, Math.PI * 2);
            orbitCtx.fillStyle = `rgba(34, 211, 238, ${0.12 * pulse})`;
            orbitCtx.fill();
            orbitCtx.beginPath();
            orbitCtx.arc(hitX, hitY, baseHalf * 0.35, 0, Math.PI * 2);
            orbitCtx.fillStyle = `rgba(165, 180, 252, ${0.35 * pulse})`;
            orbitCtx.fill();
        }

        drawSatellite(orbitCtx, worldX, worldY, Math.atan2(uy, ux), satScale * (w / 900), satAlpha);
    };

    const drawSatellite = (ctx, x, y, aimAngle, scale, alpha) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(aimAngle);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        // Soft glow
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(129, 140, 248, 0.18)";
        ctx.fill();

        // Solar panels
        const panelGrad = ctx.createLinearGradient(0, -10, 0, 10);
        panelGrad.addColorStop(0, "rgba(56, 189, 248, 0.95)");
        panelGrad.addColorStop(1, "rgba(99, 102, 241, 0.85)");
        ctx.fillStyle = panelGrad;
        ctx.fillRect(-34, -7, 14, 14);
        ctx.fillRect(20, -7, 14, 14);
        ctx.strokeStyle = "rgba(226, 232, 240, 0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-34, -7, 14, 14);
        ctx.strokeRect(20, -7, 14, 14);

        // Panel grid lines
        ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-34 + i * 4.5, -7);
            ctx.lineTo(-34 + i * 4.5, 7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(20 + i * 4.5, -7);
            ctx.lineTo(20 + i * 4.5, 7);
            ctx.stroke();
        }

        // Bus / body
        ctx.fillStyle = "rgba(226, 232, 240, 0.92)";
        ctx.fillRect(-8, -6, 16, 12);
        ctx.fillStyle = "rgba(99, 102, 241, 0.55)";
        ctx.fillRect(-5, -3, 10, 6);

        // Antenna boom + dish facing Earth (local +x after rotate to aim)
        ctx.strokeStyle = "rgba(226, 232, 240, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(22, 0, 5.5, 7.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 211, 238, 0.35)";
        ctx.fill();
        ctx.strokeStyle = "rgba(165, 243, 252, 0.9)";
        ctx.stroke();

        // Tiny status LED
        ctx.beginPath();
        ctx.arc(-3, -8.5, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
        ctx.fill();

        ctx.restore();
    };

    const tickOrbit = () => {
        if (!running || !visible) {
            rafId = requestAnimationFrame(tickOrbit);
            return;
        }
        const cssSize = orbitCanvas.width / Math.min(window.devicePixelRatio || 1, 2);
        if (!reduceMotion) {
            orbitAngle += 0.0065;
            wavePhase = (wavePhase + 0.012) % 1;
        }
        drawOrbitScene(cssSize || stage.getBoundingClientRect().width);
        rafId = requestAnimationFrame(tickOrbit);
    };

    const mount = () => {
        const rect = host.getBoundingClientRect();
        const side = Math.max(rect.width * 0.9, rect.height * 0.9, 640);
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

        syncOrbitSize();
        drawOrbitScene(stage.getBoundingClientRect().width);
    };

    const resizeObserver = new ResizeObserver(() => {
        const next = Math.max(host.clientWidth, host.clientHeight, 480);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const nextWidth = next * dpr;
        if (Math.abs(nextWidth - width) > 24) mount();
        else syncOrbitSize();
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
    rafId = requestAnimationFrame(tickOrbit);

    window.addEventListener(
        "beforeunload",
        () => {
            cancelAnimationFrame(rafId);
            if (globe) globe.destroy();
        },
        { once: true }
    );
})();
