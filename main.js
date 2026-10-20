/* ============================================================
   MORLA TATTOO – main.js
   Módulos: Config → Gallery → Modal → Header → Scroll → Stats → Citas → Init
   ============================================================ */

'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const CONFIG = {
    imagePath:    'Morla tattos/',
    chunkSize:    12,       // imágenes por lote
    rootMargin:   '200px',  // pre-cargar antes de entrar al viewport
    statsSpeed:   1800,     // ms animación contadores
    scrollThresh: 400,      // px para mostrar scroll-top
};

const IMAGE_NAMES = [
    "04905ee6-073c-4cee-acbe-c2337f6a91b2.JPG", "04ab8d7e-a6f7-4ae8-9482-bb3d765a6ce5.JPG",
    "0604c5ff-48c4-466c-bde2-88d591bcec88.JPG", "07b9f1f0-d8df-4c9e-875b-a525df3aaeac.JPG",
    "0d9c18da-d647-4eca-b7e7-8a35e10b5431.JPG", "14951cb4-9c76-42f2-8f63-89ad48254b49.JPG",
    "1749a989-8462-4f27-a66e-c77482582e9a.JPG", "1830908e-f7ba-41e1-bd6f-841c59fcacc1.JPG",
    "1c6d5e70-3579-4c9f-b73c-f8322f2b2ef7.JPG", "23acd2dd-65f4-4b72-9af6-17795ecdb92a.JPG",
    "273acb61-bbb0-45ee-8b13-e187e9e42891.JPG", "29f3131f-71f7-48b1-83b3-071a1420c35e.JPG",
    "2bf89ca5-8824-41d1-a98f-6899b94ad461.JPG", "2c628feb-1e77-4c09-b542-b4d345abdcbd.JPG",
    "317573b0-ce3a-49aa-b215-748347a57d06.JPG", "3362db6f-f045-4f08-9765-6f3ed32bb274.JPG",
    "36b02c67-9932-4975-94e2-3b0d0744aef7.JPG", "3ac6053a-160a-4c09-90d5-42eee84c30f1.JPG",
    "3ae73f89-285a-4008-acd8-8fe096777a64.JPG", "3e7a5903-136e-4afe-a2f2-f1e94670cfaa.JPG",
    "4021533b-7352-4d8d-9468-0c556eee3e7f.JPG", "40521838-e266-4927-af51-f141791d2032.JPG",
    "41d58e02-2e10-4860-b1a6-02c9fad1f51d.JPG", "43ec3056-79b6-42bf-8ec7-322a8ec00684.JPG",
    "44f0bfff-2612-4b00-a7ee-dd1878368b93.JPG", "45aeb585-01b3-4d2c-aaf3-3e964ad6ee8f.JPG",
    "4e17bde9-9805-48e0-a19e-36338e7238d8.JPG", "4edcbd59-c798-4223-bdf4-fd2d1dca3c23.JPG",
    "4f633849-e6b9-4505-9190-a98c4a608ce1.JPG", "54f47916-2dc7-4fc1-a7f9-d3870513f386.JPG",
    "56c613db-2ad2-480a-8428-91d17167b924.JPG", "60344747-9d34-4cfd-a36d-acd86c871f94.JPG",
    "62a9a184-2230-4f03-b793-5e6333c62dab.JPG", "64ae1c0c-8603-450b-b484-b2f733299365.JPG",
    "657edb6f-9634-420c-a7f5-125bce7ffbda.JPG", "6a2f3080-5be1-4488-a250-630b54bd882d.JPG",
    "6b09c6cc-5262-4947-8ac1-7bb9a9acc6e3.JPG", "6e02e969-9388-4501-b95c-2d7ad132e093.JPG",
    "71b24baf-5753-48fc-9b45-a19f4bc0dda2.JPG", "71b4cf37-26cf-4ab4-be9a-3e589dfb3de5.JPG",
    "74d16f5d-ebcd-4160-b3e8-1ad1e68c6a6f.JPG", "75b11fe2-09a8-4219-8309-11ce46fdd812.JPG",
    "7ccb1e35-6834-483f-b823-2e3037c62fb6.JPG", "7e445258-d1e4-4b74-80a8-9902db80f3d3.JPG",
    "82ab2e16-3f3b-42ac-a5dc-f2dc2c3da096.JPG", "8c65652c-34f4-487a-a00a-d907348ecef8.JPG",
    "8e97ed15-4895-4901-b8f3-eda679b2634b.JPG", "8fbfa547-f146-400f-bb7c-18e5a4e938ef.JPG",
    "927c8a50-978d-4dec-baf8-b8c68108ae48.JPG", "92acf84e-586d-4ca9-b2da-0c118b04f82c.JPG",
    "96ddcc93-c722-4979-a5a5-c7870c7aa0c2.JPG", "9b7eae87-0670-4522-9578-fedbcceb3ed4.JPG",
    "9dc994f9-15af-4c01-96e7-fcd6cc1901f1.JPG", "9f620b52-1143-4ac9-8bef-bcb35549ee79.JPG",
    "a01c8d0d-7f13-4f35-a84f-f88fe36863fe.JPG", "a61e33aa-9ffa-4ec7-83f6-7fb29d26ce1e.JPG",
    "a644406f-35b6-4295-a055-63f0a6076745.JPG", "a65bd74e-ae6e-4e4d-9a0f-196399202610.JPG",
    "a77ffcdf-b8ae-45d4-aedc-8c555da9a7e2.JPG", "a7a6af99-4b09-4edd-a02a-4e1908244045.JPG",
    "ad179230-2f41-4a23-8661-b04177784e9d.JPG", "b20c9c2a-1d7a-4cab-827d-9650c415c7e9.JPG",
    "b4ec7a4e-69b5-4551-8222-14b5dfafbcbf.JPG", "b86374e4-91ea-4805-979f-f323bbfc1197.JPG",
    "ba498dcc-7524-4902-9a0f-bdb6b996e582.JPG", "c0efccd7-e3b8-4ff8-b1d9-7491e6ba3978.JPG",
    "c141fdd1-579b-4afa-9319-37d790ce0851.JPG", "c3fd006a-7e40-4fec-8c9e-c28da31a8b94.JPG",
    "c59cf77a-5f0c-4f0c-97a1-14a6ae3f8287.JPG", "c6cc6b2f-f5a5-42cb-901f-e3ef5ad8f745.JPG",
    "c789809d-1206-4941-98a5-f21d386f2409.JPG", "cc98fdab-e812-4643-9f10-c1cd6e9e4985.JPG",
    "cda7837e-740d-4126-af59-fc945bd75fed.JPG", "d36e6dec-e067-43f1-8657-982a02efdd11.JPG",
    "d5c9e530-efc2-4755-b2b6-2e9bfd8edde2.JPG", "d6273c64-fb8f-4231-ba39-b399fc259730.JPG",
    "e29658bd-46e6-4fd5-8831-f69456c5552a.JPG", "e47fbbca-0172-473d-b62e-99277290f61b.JPG",
    "e4814452-09ce-4c51-8e6c-2678d6a8235e.JPG", "e6a4d606-ad0d-4eef-a1f7-214428cba5f1.JPG",
    "e702ea1f-0bbb-4f17-9703-9528f368a961.JPG", "e7ae201c-deeb-48c1-834d-9fac8a9ca928.JPG",
    "efbdd358-d9c9-4bee-a85d-c4a67fd8cc7c.JPG", "f1685c0a-21e2-4c3c-9f80-548f8c4eecf9.JPG",
    "f1eaf719-d82f-4565-9d20-118ff6370085.JPG", "f31160f5-554d-4d21-b367-7565d46102e8.JPG",
    "f5248f13-1a58-462b-b547-5afb7d72f350.JPG", "f9db863f-b703-4ad1-a200-e81380425457.JPG",
    "fa41f4fe-f440-40f3-9c3d-eb8d1bf68f8c.JPG", "ffbafe47-c9b1-4567-bbd0-9afa95882728.JPG"
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
        api:        '/api/citas',   // función serverless (ver api/citas.js)
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
    const st = { day: C.days[0].iso, slot: null, taken: new Set(), designs: [], online: true, busy: false };
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
                (state === 'taken' ? '<small>Ocupada</small>' : state === 'closed' ? '<small>Cerrada</small>' : '');
            b.addEventListener('click', () => { st.slot = key; renderSlots(); });
            slotGrid.appendChild(b);
        });
        summary.textContent = st.slot ? `Tu hora: ${label(st.slot)}` : 'Aún no has elegido una hora.';
    }

    async function loadTaken() {
        try {
            const r = await fetch(C.api, { cache: 'no-store' });
            if (!r.ok) throw new Error();
            st.taken = new Set((await r.json()).taken || []);
            st.online = true;
        } catch { st.online = false; }
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

    function showDone({ code, offline }) {
        const name = $('bkName').value.trim();
        const when = label(st.slot);
        const text = offline
            ? `Hola Morla, quiero reservar la promo 2x1500 el ${when}. Soy ${name}, mi WhatsApp es ${$('bkPhone').value.trim()}. Te envío mis diseños por aquí.`
            : `Hola Morla, soy ${name}. Solicité la cita ${code} para el ${when}. Quedo pendiente de la aprobación de mi diseño.`;
        done.innerHTML = offline
            ? `<h3>Casi listo, ${name.split(' ')[0]}</h3>
               <p>No pudimos guardar tu cita en línea. Envíanos tu solicitud por WhatsApp junto con tus diseños y Morla la confirma por ahí.</p>
               <p class="done-when">${when}</p>`
            : `<h3>Solicitud recibida, ${name.split(' ')[0]}</h3>
               <p class="done-when">${when}</p>
               <p>Código de tu cita: <strong class="done-code">${code}</strong></p>
               <p>Tu hora ya está apartada. Morla revisará tu diseño y te confirmará por WhatsApp. Si necesita cambios, te escribirá.</p>`;
        done.insertAdjacentHTML('beforeend',
            `<a class="btn-primary" href="${waLink(text)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp" aria-hidden="true"></i> ${offline ? 'Enviar por WhatsApp' : 'Escribir a Morla'}</a>`);
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
        showMsg('');
        const btn = $('bookingSubmit');
        st.busy = true; btn.disabled = true; btn.textContent = 'Enviando…';
        try {
            const r = await fetch(C.api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot: st.slot,
                    name: $('bkName').value.trim(),
                    phone: $('bkPhone').value.trim(),
                    zone: $('bkZone').value.trim(),
                    notes: $('bkNotes').value.trim(),
                    designs: st.designs,
                    hp: $('bkHp').value,
                }),
            });
            if (r.status === 409) {
                st.slot = null; await loadTaken();
                showMsg('Esa hora acaba de ser tomada. Elige otra, tus datos y diseños siguen aquí.');
                slotGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (r.ok) {
                showDone({ code: (await r.json()).code });
            } else {
                const err = await r.json().catch(() => ({}));
                showMsg(err.error || 'No pudimos enviar tu solicitud. Intenta de nuevo.');
            }
        } catch {
            showDone({ offline: true });   // sin servidor: se cierra por WhatsApp
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