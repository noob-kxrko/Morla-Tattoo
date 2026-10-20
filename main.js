/* ============================================================
   MORLA TATTOO – main.js
   Módulos: Config → Gallery → Modal → Header → Scroll → Stats → Citas → Init
   ============================================================ */

'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const CONFIG = {
    imagePath:    'tatuajes/',
    chunkSize:    12,       // imágenes por lote
    rootMargin:   '200px',  // pre-cargar antes de entrar al viewport
    statsSpeed:   1800,     // ms animación contadores
    scrollThresh: 400,      // px para mostrar scroll-top
};

const IMAGE_NAMES = [
    "475497168_1807998266641064_5969291779317501928_n.jpg",
    "475670221_1803453090428915_766508315985944549_n.jpg",
    "475837867_1803453100428914_1850601968987183355_n.jpg",
    "475847172_1805187330255491_6696791531203954024_n.jpg",
    "475920125_1805174376923453_8687505687794945580_n.jpg",
    "475998440_1804502140324010_987989070631356609_n.jpg",
    "476031815_1807988206642070_2110784754772435301_n.jpg",
    "476227343_1807079370066287_8984817803875149283_n.jpg",
    "476641765_1807990713308486_5807019179537970180_n.jpg",
    "480460065_1819613182146239_8257843426504997025_n.jpg",
    "480985129_1825710901536467_1366806533733866092_n.jpg",
    "481257873_1825711228203101_462210398685290520_n.jpg",
    "481268678_1821662771941280_3352646125731681239_n.jpg",
    "481363052_1829506524490238_2215154275309277650_n.jpg",
    "491378945_1862384361202454_7859196883988077915_n.jpg",
    "634119060_2106736153433939_2876039232792222447_n.jpg",
    "636166383_2106738693433685_8100303242761066457_n.jpg",
    "636788866_2106737860100435_594942321298680689_n.jpg",
    "654744320_2132383584202529_2374428139151920299_n.jpg"
];

/* ============================================================
   UTILIDADES
   ============================================================ */
/** Debounce para eventos de scroll/resize */
function debounce(fn, wait) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

/** requestAnimationFrame throttle para scroll */
function rafThrottle(fn) {
    let raf = false;
    return function (...args) {
        if (raf) return;
        raf = true;
        requestAnimationFrame(() => {
            fn.apply(this, args);
            raf = false;
        });
    };
}

/* ============================================================
   MÓDULO: GALERÍA
   ============================================================ */
const Gallery = (() => {
    let grid, loadMoreBtn, loadMoreWrapper;
    let renderedCount = 0;
    const cards = [];           // referencia a cada tarjeta DOM
    let cardObserver = null;    // IntersectionObserver para lazy reveal
    let imgObserver = null;     // IntersectionObserver para lazy load images

    /* Crea una tarjeta individual */
    function createCard(name, idx) {
        const card = document.createElement('div');
        card.className = 'tattoo-card';
        card.setAttribute('role', 'listitem');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Tatuaje ${idx + 1} de ${IMAGE_NAMES.length}`);

        const img = document.createElement('img');
        // Lazy: data-src para imágenes fuera del viewport inicial
        img.dataset.src = `${CONFIG.imagePath}${name}`;
        img.alt = `Trabajo de tatuaje – Morla Tattoo #${idx + 1}`;
        img.width = 400;
        img.height = 340;
        img.className = 'gallery-img';
        // Placeholder borroso mientras carga
        img.style.background = 'linear-gradient(135deg,#1a0000,#000)';

        card.appendChild(img);

        // Click → modal
        card.addEventListener('click', () => Modal.open(idx));
        // Teclado → modal
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Modal.open(idx); }
        });

        return card;
    }

    /* Renderiza el siguiente chunk sin bloquear el hilo principal */
    function renderChunk() {
        const start = renderedCount;
        const end = Math.min(renderedCount + CONFIG.chunkSize, IMAGE_NAMES.length);
        const fragment = document.createDocumentFragment();

        for (let i = renderedCount; i < end; i++) {
            const card = createCard(IMAGE_NAMES[i], i);
            cards.push(card);
            fragment.appendChild(card);
        }
        renderedCount = end;

        // Eliminar skeletons si es el primer lote
        if (renderedCount <= CONFIG.chunkSize) {
            grid.querySelectorAll('.skeleton-card').forEach(s => s.remove());
        }

        grid.appendChild(fragment);

        // Observar las nuevas tarjetas
        cards.slice(start, end).forEach(c => {
            cardObserver.observe(c);
            imgObserver.observe(c.querySelector('img'));
        });

        // Ocultar botón si ya no quedan
        if (renderedCount >= IMAGE_NAMES.length) {
            loadMoreWrapper.hidden = true;
        }
    }

    /* IntersectionObserver: revelar tarjeta cuando entra al viewport */
    function createCardObserver() {
        cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    cardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    }

    /* IntersectionObserver: cargar src real de la imagen */
    function createImgObserver() {
        imgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        delete img.dataset.src;
                        imgObserver.unobserve(img);
                    }
                }
            });
        }, { rootMargin: CONFIG.rootMargin });
    }

    function init() {
        grid           = document.getElementById('galleryGrid');
        loadMoreBtn    = document.getElementById('loadMoreBtn');
        loadMoreWrapper= document.getElementById('loadMoreWrapper');
        if (!grid) return;

        createCardObserver();
        createImgObserver();

        // Renderizar primer lote inmediatamente
        renderChunk();

        // Botón "cargar más"
        loadMoreBtn.addEventListener('click', () => {
            const first = cards.length;
            renderChunk();
            // Auto-scroll suave hacia las nuevas tarjetas
            cards[first]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    /* Getter para el modal (acceso por índice) */
    function getImageSrc(idx) {
        const name = IMAGE_NAMES[idx];
        return name ? `${CONFIG.imagePath}${name}` : null;
    }

    function getTotal() { return IMAGE_NAMES.length; }

    return { init, getImageSrc, getTotal };
})();

/* ============================================================
   MÓDULO: MODAL
   ============================================================ */
const Modal = (() => {
    let modal, img, closeBtn, prevBtn, nextBtn;
    let currentIdx = 0;
    let lastFocused = null;
    // Touch swipe
    let touchStartX = 0;

    function show() {
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        // Pequeño delay para permitir display antes del fade
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });
    }

    function hide() {
        modal.style.opacity = '0';
        modal.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            modal.hidden = true;
            document.body.style.overflow = '';
            lastFocused?.focus();
        }, 300);
    }

    function loadImage(idx) {
        const src = Gallery.getImageSrc(idx);
        if (!src) return;
        img.style.opacity = '0';
        img.src = src;
        img.alt = `Tatuaje #${idx + 1} – Morla Tattoo`;
        img.onload = () => { img.style.opacity = '1'; };
        img.onerror = () => { img.style.opacity = '1'; };
        currentIdx = idx;
        // Actualizar botones
        prevBtn.disabled = idx === 0;
        nextBtn.disabled = idx === Gallery.getTotal() - 1;
    }

    function open(idx) {
        lastFocused = document.activeElement;
        loadImage(idx);
        show();
        // Focus al botón cerrar (accesibilidad)
        requestAnimationFrame(() => closeBtn.focus());
    }

    function navigate(dir) {
        const next = currentIdx + dir;
        if (next < 0 || next >= Gallery.getTotal()) return;
        loadImage(next);
    }

    function init() {
        modal    = document.getElementById('imageModal');
        img      = document.getElementById('modalImg');
        closeBtn = document.getElementById('modalClose');
        prevBtn  = document.getElementById('modalPrev');
        nextBtn  = document.getElementById('modalNext');
        if (!modal) return;

        // Cerrar
        closeBtn.addEventListener('click', hide);
        modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });

        // Flechas
        prevBtn.addEventListener('click', () => navigate(-1));
        nextBtn.addEventListener('click', () => navigate(1));

        // Teclado
        document.addEventListener('keydown', (e) => {
            if (modal.hidden) return;
            if (e.key === 'Escape')     hide();
            if (e.key === 'ArrowLeft')  navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        });

        // Swipe móvil
        modal.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        modal.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
        }, { passive: true });
    }

    return { init, open };
})();

/* ============================================================
   MÓDULO: HEADER
   ============================================================ */
const Header = (() => {
    let header, hamburger, mobileNav;
    let menuOpen = false;

    function toggleMenu(force) {
        menuOpen = (force !== undefined) ? force : !menuOpen;
        hamburger.setAttribute('aria-expanded', String(menuOpen));
        mobileNav.setAttribute('aria-hidden', String(!menuOpen));
        mobileNav.classList.toggle('open', menuOpen);
        document.body.style.overflow = menuOpen ? 'hidden' : '';
    }

    function onScroll() {
        header.classList.toggle('scrolled', window.scrollY > 10);
    }

    function setActiveLink() {
        const sections = document.querySelectorAll('section[id], header[id]');
        const links = document.querySelectorAll('.nav-link');
        let current = '';

        sections.forEach(sec => {
            const top = sec.getBoundingClientRect().top;
            if (top <= 100) current = sec.id;
        });

        links.forEach(link => {
            const href = link.getAttribute('href')?.replace('#', '');
            link.classList.toggle('active', href === current);
        });
    }

    function init() {
        header     = document.getElementById('site-header');
        hamburger  = document.getElementById('hamburgerBtn');
        mobileNav  = document.getElementById('mobileMenu');
        if (!header) return;

        hamburger.addEventListener('click', () => toggleMenu());

        // Cerrar al hacer click en un enlace del menú móvil
        mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => toggleMenu(false));
        });

        // Scroll optimizado con RAF throttle
        window.addEventListener('scroll', rafThrottle(() => {
            onScroll();
            setActiveLink();
        }), { passive: true });

        onScroll();
    }

    return { init };
})();

/* ============================================================
   MÓDULO: SCROLL TO TOP
   ============================================================ */
const ScrollTop = (() => {
    function init() {
        const btn = document.getElementById('scrollTopBtn');
        if (!btn) return;

        btn.hidden = false; // mostrar el botón (controlado por CSS .visible)

        window.addEventListener('scroll', rafThrottle(() => {
            btn.classList.toggle('visible', window.scrollY > CONFIG.scrollThresh);
        }), { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    return { init };
})();

/* ============================================================
   MÓDULO: SMOOTH SCROLL (nav links)
   ============================================================ */
const SmoothScroll = (() => {
    function init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }
    return { init };
})();

/* ============================================================
   MÓDULO: REVEAL ANIMATION (Intersection Observer)
   ============================================================ */
const RevealObserver = (() => {
    function init() {
        const elements = document.querySelectorAll('.reveal');
        if (!elements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        elements.forEach(el => observer.observe(el));
    }
    return { init };
})();

/* ============================================================
   MÓDULO: CONTADORES ANIMADOS
   ============================================================ */
const StatsCounter = (() => {
    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        const duration = CONFIG.statsSpeed;
        const start = performance.now();

        function step(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Easing ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function init() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        if (!counters.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => observer.observe(c));
    }
    return { init };
})();

/* ============================================================
   MÓDULO: CITAS (promo Halloween 2x1500)
   ============================================================ */
const Booking = (() => {
    const C = {
        whatsapp:   '18298667998',
        minHours:   48,             // las citas cierran 48 h antes
        maxDesigns: 2,
        maxSide:    1600,           // px, se comprime antes de subir
        days: [
            { iso: '2026-10-29', name: 'Jueves',  num: 29 },
            { iso: '2026-10-30', name: 'Viernes', num: 30 },
            { iso: '2026-10-31', name: 'Sábado',  num: 31 },
        ],
        hours: [8, 9, 10, 11, 12, 13, 14, 16, 17, 18],   // igual que el flyer (sin 3 PM)
    };
    const st = { day: C.days[0].iso, slot: null, taken: new Set(), designs: [], online: false, busy: false };
    const $ = (id) => document.getElementById(id);
    let form, dayTabs, slotGrid, summary, msg, preview, done;

    const hh      = (h) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;
    const range   = (h) => `${hh(h)} – ${hh(h + 1)}`;
    const keyOf   = (iso, h) => `${iso}-${String(h).padStart(2, '0')}`;
    const startOf = (iso, h) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, h); };
    const dayOf   = (iso) => C.days.find(d => d.iso === iso);
    const label   = (key) => {
        const iso = key.slice(0, 10), h = Number(key.slice(11));
        const d = dayOf(iso);
        return `${d.name} ${d.num} de octubre, ${range(h)}`;
    };

    function slotState(key, iso, h) {
        if (!st.online) return 'unavailable';
        if (st.taken.has(key)) return 'taken';
        if (startOf(iso, h) - Date.now() < C.minHours * 36e5) return 'closed';
        return 'open';
    }

    function renderDays() {
        dayTabs.innerHTML = '';
        C.days.forEach(d => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'day-tab';
            b.setAttribute('aria-pressed', String(d.iso === st.day));
            b.innerHTML = `<span class="day-name">${d.name}</span><span class="day-num">${d.num}</span>`;
            b.addEventListener('click', () => { st.day = d.iso; renderDays(); renderSlots(); });
            dayTabs.appendChild(b);
        });
    }

    function renderSlots() {
        slotGrid.innerHTML = '';
        C.hours.forEach(h => {
            const key = keyOf(st.day, h);
            const state = slotState(key, st.day, h);
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'slot';
            b.dataset.state = state;
            b.disabled = state !== 'open';
            b.setAttribute('aria-pressed', String(st.slot === key));
            b.innerHTML = `<span>${range(h)}</span>` +
                (state === 'taken' ? '<small>Ocupada</small>' :
                    state === 'closed' ? '<small>Cerrada</small>' :
                    state === 'unavailable' ? '<small>No disponible</small>' : '');
            b.addEventListener('click', () => { st.slot = key; renderSlots(); });
            slotGrid.appendChild(b);
        });
        summary.textContent = st.slot ? `Tu hora: ${label(st.slot)}` : 'Aún no has elegido una hora.';
    }

    async function loadTaken() {
        try {
            if (!window.sb) throw new Error('Supabase no está configurado.');
            const { data, error } = await window.sb.rpc('horas_ocupadas');
            if (error) throw error;
            st.taken = new Set((data || []).map(({ fecha, hora }) => keyOf(fecha, hora)));
            st.online = true;
            showMsg('');
        } catch (error) {
            st.online = false;
            showMsg(`No se pudieron consultar las citas: ${error.message || 'revisa la conexión con Supabase.'}`);
        }
        if (st.slot && st.taken.has(st.slot)) st.slot = null;
        renderSlots();
    }

    /* Reduce la imagen en el navegador para que la subida sea rápida */
    function compress(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                const s = Math.min(1, C.maxSide / Math.max(img.width, img.height));
                const c = document.createElement('canvas');
                c.width = Math.round(img.width * s);
                c.height = Math.round(img.height * s);
                const x = c.getContext('2d');
                x.fillStyle = '#fff';
                x.fillRect(0, 0, c.width, c.height);
                x.drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL('image/jpeg', 0.82));
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`No pude leer "${file.name}". Usa JPG, PNG o WEBP.`)); };
            img.src = url;
        });
    }

    function showMsg(text) { msg.textContent = text; msg.hidden = !text; }

    function renderPreview() {
        preview.innerHTML = '';
        st.designs.forEach((src, i) => {
            const li = document.createElement('li');
            li.className = 'design-item';
            li.innerHTML = `<img src="${src}" alt="Diseño ${i + 1}"><button type="button" class="design-remove" aria-label="Quitar diseño ${i + 1}"><i class="fas fa-times" aria-hidden="true"></i></button>`;
            li.querySelector('button').addEventListener('click', () => { st.designs.splice(i, 1); renderPreview(); });
            preview.appendChild(li);
        });
    }

    async function addFiles(fileList) {
        showMsg('');
        const files = [...fileList];
        for (const f of files) {
            if (st.designs.length >= C.maxDesigns) { showMsg(`Máximo ${C.maxDesigns} diseños.`); break; }
            if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { showMsg(`"${f.name}" no es JPG, PNG ni WEBP.`); continue; }
            try { st.designs.push(await compress(f)); } catch (e) { showMsg(e.message); }
        }
        renderPreview();
    }

    function validate() {
        const name = $('bkName').value.trim();
        const phone = $('bkPhone').value.replace(/\D/g, '');
        if (!st.slot)                    return ['Elige una hora para tu cita.', slotGrid];
        if (name.length < 2)             return ['Escribe tu nombre completo.', $('bkName')];
        if (phone.length < 10)           return ['Escribe un WhatsApp válido, con código de área.', $('bkPhone')];
        if (!$('bkZone').value.trim())   return ['Cuéntanos dónde y de qué tamaño lo quieres.', $('bkZone')];
        if (!st.designs.length)          return ['Sube al menos un diseño para que Morla lo evalúe.', $('bkFiles')];
        if (!$('bkTerms').checked)       return ['Confirma que entiendes que la cita queda pendiente de aprobación.', $('bkTerms')];
        return null;
    }

    function waLink(text) { return `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`; }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[char]));
    }

    function downloadProof({ code, name, slot, zone }) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            showMsg('No se pudo crear el comprobante. Toma una captura de esta pantalla y guarda tu código.');
            return;
        }

        const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        background.addColorStop(0, '#160006');
        background.addColorStop(0.55, '#050505');
        background.addColorStop(1, '#26000a');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#dc143c';
        ctx.lineWidth = 4;
        ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);

        const logo = document.querySelector('.brand-logo');
        if (logo?.complete && logo.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(540, 175, 74, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logo, 466, 101, 148, 148);
            ctx.restore();
        } else {
            ctx.fillStyle = '#dc143c';
            ctx.beginPath();
            ctx.arc(540, 175, 68, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 58px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('M', 540, 196);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 54px Georgia';
        ctx.fillText('MORLA TATTOO', 540, 300);
        ctx.fillStyle = '#ff4766';
        ctx.font = '600 25px Arial';
        ctx.fillText('COMPROBANTE DE SOLICITUD DE CITA', 540, 355);

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(100, 420, 880, 255);
        ctx.strokeStyle = 'rgba(220,20,60,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(100, 420, 880, 255);
        ctx.fillStyle = '#d4d4d4';
        ctx.font = '600 24px Arial';
        ctx.fillText('CÓDIGO DE RESERVA', 540, 480);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 82px Arial';
        ctx.fillText(code, 540, 585);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ff4766';
        ctx.font = '600 23px Arial';
        ctx.fillText('CLIENTE', 120, 755);
        ctx.fillText('FECHA Y HORA', 120, 875);
        ctx.fillText('ZONA / TAMAÑO', 120, 995);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 35px Arial';
        ctx.fillText(name.slice(0, 38), 120, 805);
        ctx.fillText(label(slot), 120, 925);
        ctx.fillText(zone.slice(0, 42), 120, 1045);

        ctx.fillStyle = 'rgba(220,20,60,0.18)';
        ctx.fillRect(100, 1100, 880, 105);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 26px Arial';
        ctx.fillText('ESTADO: PENDIENTE DE APROBACIÓN', 540, 1145);
        ctx.fillStyle = '#d4d4d4';
        ctx.font = '22px Arial';
        ctx.fillText('Presenta este comprobante y tu código al llegar al estudio.', 540, 1185);
        ctx.fillText('La cita se confirma cuando Morla te escriba por WhatsApp.', 540, 1230);

        const link = document.createElement('a');
        link.download = `Morla-Tattoo-${code}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    function showDone({ code, uploadIssue = false }) {
        const name = $('bkName').value.trim();
        const when = label(st.slot);
        const text = uploadIssue
            ? `Hola Morla, soy ${name}. Mi solicitud ${code} para el ${when} quedó registrada, pero la web no pudo adjuntar mis diseños. Te los envío por aquí.`
            : `Hola Morla, soy ${name}. Solicité la cita ${code} para el ${when}. Quedo pendiente de la aprobación de mi diseño.`;
        done.innerHTML = `<h3>${uploadIssue ? 'Solicitud registrada' : 'Solicitud recibida'}, ${escapeHtml(name.split(' ')[0])}</h3>
            <p class="done-when">${when}</p>
            <p>Código de tu cita: <strong class="done-code">${escapeHtml(code)}</strong></p>
            <p>${uploadIssue
                ? 'Tu hora quedó apartada, pero no pudimos guardar los diseños. Escríbele a Morla por WhatsApp y envíaselos manualmente.'
                : 'Tu hora ya está apartada. Morla revisará tu diseño y te confirmará por WhatsApp. Si necesita cambios, te escribirá.'}</p>`;
        const downloadButton = document.createElement('button');
        downloadButton.id = 'downloadBookingProof';
        downloadButton.type = 'button';
        downloadButton.className = 'btn-secondary';
        downloadButton.textContent = 'Descargar comprobante';
        downloadButton.addEventListener('click', () => downloadProof({
            code,
            name,
            slot: st.slot,
            zone: $('bkZone').value.trim(),
        }));
        done.appendChild(downloadButton);
        done.insertAdjacentHTML('beforeend',
            `<a class="btn-primary" href="${waLink(text)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp" aria-hidden="true"></i> Escribir a Morla</a>`);
        form.hidden = true;
        done.hidden = false;
        done.focus();
        done.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (st.busy) return;
        const problem = validate();
        if (problem) { showMsg(problem[0]); problem[1].focus?.(); return; }
        if (!st.online || !window.sb) {
            showMsg('No se puede reservar ahora porque no hay conexión con el sistema de citas. Inténtalo de nuevo más tarde.');
            return;
        }
        showMsg('');
        const btn = $('bookingSubmit');
        st.busy = true; btn.disabled = true; btn.textContent = 'Enviando…';
        let appointment;
        try {
            const date = st.slot.slice(0, 10);
            const hour = st.slot.slice(11);
            const { data, error } = await window.sb.rpc('crear_cita', {
                p_fecha: date,
                p_hora: Number(hour),
                p_nombre: $('bkName').value.trim(),
                p_telefono: $('bkPhone').value.trim(),
                p_zona: $('bkZone').value.trim(),
                p_notas: $('bkNotes').value.trim() || null,
                p_hp: $('bkHp').value,
            });
            if (error) {
                if (error.message.includes('HORA_OCUPADA')) {
                    st.slot = null;
                    await loadTaken();
                    showMsg('Esa hora acaba de ser tomada. Elige otra; tus datos y diseños siguen aquí.');
                    slotGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (error.message.includes('HORA_CERRADA')) {
                    st.slot = null;
                    renderSlots();
                    showMsg('Esa hora cerró porque faltan menos de 48 horas. Elige otra.');
                } else if (error.message.includes('PROMO_CERRADA')) {
                    showMsg('La promoción ya está cerrada y no acepta nuevas citas.');
                } else if (error.message.includes('LIMITE_TELEFONO')) {
                    showMsg('Ese número ya alcanzó el límite de citas para esta promoción.');
                } else {
                    showMsg(`No se pudo guardar la cita: ${error.message}`);
                }
                return;
            }
            appointment = data;
            if (!appointment?.codigo) {
                showMsg('Supabase no devolvió el código de la cita. No se pudo confirmar el registro.');
                return;
            }
            if (appointment.codigo === 'MT-00000') {
                showDone({ code: appointment.codigo });
                return;
            }

            if (!appointment.id) {
                showMsg('La cita se creó sin devolver su identificador. Contacta a Morla antes de volver a intentarlo.');
                return;
            }

            try {
                const paths = [];
                for (let i = 0; i < st.designs.length; i++) {
                    const image = await fetch(st.designs[i]).then(response => response.blob());
                    const path = `${appointment.id}/${i + 1}.jpg`;
                    const { error: uploadError } = await window.sb.storage
                        .from('disenos')
                        .upload(path, image, { contentType: 'image/jpeg', upsert: false });
                    if (uploadError) throw uploadError;
                    paths.push(path);
                }
                const { error: attachError } = await window.sb.rpc('adjuntar_disenos', {
                    p_id: appointment.id,
                    p_paths: paths,
                });
                if (attachError) throw attachError;
                st.taken.add(st.slot);
                renderSlots();
                showDone({ code: appointment.codigo });
            } catch (uploadError) {
                st.taken.add(st.slot);
                renderSlots();
                showDone({ code: appointment.codigo, uploadIssue: true });
                console.error('La cita se guardó, pero no se pudieron adjuntar los diseños.', uploadError);
            }
        } catch (error) {
            showMsg(`No se pudo enviar la cita a Supabase: ${error.message || 'revisa tu conexión e inténtalo de nuevo.'}`);
        } finally {
            st.busy = false; btn.disabled = false; btn.textContent = 'Solicitar mi cita';
        }
    }

    function init() {
        form = $('bookingForm');
        if (!form) return;
        dayTabs = $('dayTabs'); slotGrid = $('slotGrid'); summary = $('slotSummary');
        msg = $('bookingMsg'); preview = $('designPreview'); done = $('bookingDone');

        // Si ya pasó la fecha de la promo, se muestra el primer día disponible
        renderDays(); renderSlots(); loadTaken();

        $('bkFiles').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
        const dz = $('dropzone');
        ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
        ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
        dz.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
        form.addEventListener('submit', onSubmit);
    }
    return { init };
})();

/* ============================================================
   MÓDULO: AÑO EN FOOTER
   ============================================================ */
function setFooterYear() {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    setFooterYear();
    Header.init();
    SmoothScroll.init();
    RevealObserver.init();
    StatsCounter.init();
    Gallery.init();
    Modal.init();
    Booking.init();
    ScrollTop.init();
});