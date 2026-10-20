/* Panel privado de citas · Morla Tattoo
   Toda la seguridad real está en Supabase (RLS): sin iniciar sesión con un correo
   de la tabla "admins", la base de datos no devuelve ninguna cita. */
(() => {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const sb = window.sb;
    const ESTADOS = { pendiente: 'Pendiente', aprobada: 'Aprobada', cambios: 'Piden cambios', rechazada: 'Rechazada', completada: 'Completada', cancelada: 'Cancelada', bloqueada: 'Bloqueada' };
    const ACTIVAS = ['pendiente', 'aprobada', 'cambios', 'bloqueada'];
    const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    let citas = [], urls = {}, cfg = { fechas: [], horas: [] }, channel = null, timer = null;

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const hh = (h) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;
    const range = (h) => `${hh(h)} – ${hh(h + 1)}`;
    const dayLabel = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${DIAS[new Date(y, m - 1, d).getDay()]} ${d} de ${MESES[m - 1]}`; };
    const when = (c) => `${dayLabel(c.fecha)}, ${range(c.hora)}`;
    const waNum = (t) => (t.length === 10 ? '1' + t : t);
    const fmtTel = (t) => (t.length === 10 ? `(${t.slice(0, 3)}) ${t.slice(3, 6)}-${t.slice(6)}` : '+' + t);

    function flash(text, isErr) {
        const el = $('adMsg');
        el.textContent = text; el.hidden = !text;
        clearTimeout(timer);
        if (text && !isErr) timer = setTimeout(() => { el.hidden = true; }, 3500);
    }

    function waText(c) {
        const n = c.nombre.split(' ')[0], cuando = when(c);
        switch (c.estado) {
            case 'aprobada':  return `Hola ${n}, soy de Morla Tattoo. Tu diseño fue aprobado ✅ Tu cita (${c.codigo}) queda confirmada para el ${cuando}. ¡Te esperamos!`;
            case 'cambios':   return `Hola ${n}, revisé tu diseño (cita ${c.codigo}) y necesito algunos ajustes antes de aprobarlo. ¿Lo hablamos por aquí?`;
            case 'rechazada': return `Hola ${n}, lamentablemente no podemos realizar el diseño de tu cita ${c.codigo}. Si quieres enviar otra idea, con gusto la revisamos.`;
            default:          return `Hola ${n}, te escribo de Morla Tattoo sobre tu cita ${c.codigo} del ${cuando}.`;
        }
    }

    /* ---------- Acceso ---------- */
    function show(app) { $('loginView').hidden = app; $('appView').hidden = !app; }

    async function enter() {
        const { data: ok } = await sb.rpc('soy_admin');
        if (!ok) { await sb.auth.signOut(); show(false); return false; }
        show(true);
        await load();
        if (!channel) channel = sb.channel('citas-admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => load())
            .subscribe();
        return true;
    }

    async function login(e) {
        e.preventDefault();
        const msg = $('loginMsg'), btn = $('loginBtn');
        msg.hidden = true; btn.disabled = true; btn.textContent = 'Entrando…';
        const { error } = await sb.auth.signInWithPassword({ email: $('adEmail').value.trim(), password: $('adPass').value });
        if (error || !(await enter())) {
            msg.textContent = error ? 'Correo o contraseña incorrectos.' : 'Esta cuenta no tiene acceso al panel.';
            msg.hidden = false;
        }
        btn.disabled = false; btn.textContent = 'Entrar';
    }

    async function logout() {
        if (channel) { sb.removeChannel(channel); channel = null; }
        await sb.auth.signOut(); show(false);
    }

    /* ---------- Datos ---------- */
    async function load() {
        const [{ data, error }, conf] = await Promise.all([
            sb.from('citas').select('*').order('fecha').order('hora'),
            sb.rpc('config_promo'),
        ]);
        if (error) { flash('No se pudieron cargar las citas: ' + error.message, true); return; }
        citas = data;
        if (conf.data) cfg = conf.data;
        const paths = citas.flatMap(c => Array.isArray(c.disenos) ? c.disenos : []);
        urls = {};
        if (paths.length) {
            const { data: signed, error: signedError } = await sb.storage.from('disenos').createSignedUrls(paths, 3600);
            if (signedError) flash('No se pudieron cargar los diseños: ' + signedError.message, true);
            (signed || []).forEach(s => { if (s.signedUrl) urls[s.path] = s.signedUrl; });
        }
        fillFilters(); render();
    }

    function fillFilters() {
        const days = [...new Set([...(cfg.fechas || []), ...citas.map(c => c.fecha)])].sort();
        const cur = $('fDay').value;
        $('fDay').innerHTML = '<option value="todos">Todos los días</option>' + days.map(d => `<option value="${d}">${esc(dayLabel(d))}</option>`).join('');
        if (days.includes(cur)) $('fDay').value = cur;
        if (!$('bDay').options.length) {
            $('bDay').innerHTML = (cfg.fechas || []).map(d => `<option value="${d}">${esc(dayLabel(d))}</option>`).join('');
            $('bHour').innerHTML = (cfg.horas || []).map(h => `<option value="${h}">${range(h)}</option>`).join('');
        }
    }

    function filtered() {
        const d = $('fDay').value, e = $('fEstado').value;
        return citas.filter(c => (d === 'todos' || c.fecha === d) &&
            (e === 'todas' || (e === 'activas' ? ACTIVAS.includes(c.estado) : c.estado === e)));
    }

    /* ---------- Pintar ---------- */
    function card(c) {
        const blocked = c.estado === 'bloqueada';
        const designs = Array.isArray(c.disenos) ? c.disenos : [];
        const thumbs = designs.map((p, i) => urls[p]
            ? `<button class="ad-thumb" type="button" data-view="${esc(urls[p])}" aria-label="Ver diseño ${i + 1}"><img src="${esc(urls[p])}" alt="Diseño ${i + 1}" loading="lazy"></button>` : '').join('');
        const phone = String(c.telefono || '');
        const name = String(c.nombre || 'Cliente sin nombre');
        const wa = `https://wa.me/${waNum(phone)}?text=${encodeURIComponent(waText({ ...c, nombre: name }))}`;
        const btn = (act, text, cls = '') => `<button class="ad-act ${cls}" type="button" data-act="${act}" data-id="${c.id}">${text}</button>`;
        const actions = blocked
            ? btn('cancelada', 'Liberar hora')
            : [c.estado === 'pendiente' ? btn('aprobada', 'Aceptar cita', 'ad-act--ok') : '',
               c.estado === 'pendiente' ? btn('rechazada', 'Denegar cita', 'ad-act--no') : '',
               btn('cambios', 'Pedir cambios'), btn('completada', 'Marcar completada'), btn('cancelada', 'Cancelar cita'),
               `<a class="ad-act ad-act--wa" href="${wa}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp" aria-hidden="true"></i> Avisar</a>`].join('');
        const created = c.created_at
            ? new Date(c.created_at).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })
            : '';
        return `<article class="ad-card" data-estado="${c.estado}">
            <div class="ad-row"><span class="ad-when">${esc(range(Number(c.hora)))}</span><span class="ad-badge">${esc(ESTADOS[c.estado] || c.estado || 'Sin estado')}</span></div>
            ${blocked ? '<p class="ad-meta">Hora bloqueada por Morla.</p>' : `
            <div class="ad-meta">
                <span><strong>Cliente:</strong> ${esc(name)}</span>
                <span><strong>WhatsApp:</strong> <a href="tel:+${esc(waNum(phone))}">${esc(fmtTel(phone))}</a></span>
                <span><strong>Fecha y hora:</strong> ${esc(when(c))}</span>
                <span><strong>Zona y tamaño:</strong> ${esc(c.zona || 'No especificado')}</span>
                ${c.notas ? `<span>“${esc(c.notas)}”</span>` : ''}
                <span><strong>Código:</strong> ${esc(c.codigo || 'No asignado')}</span>
                ${created ? `<span><strong>Solicitud recibida:</strong> ${esc(created)}</span>` : ''}
            </div>
            ${designs.length ? (thumbs ? `<div class="ad-designs">${thumbs}</div>` : '<p class="ad-nodesign">Los diseños están registrados, pero no se pudieron cargar.</p>') : '<p class="ad-nodesign">Sin diseño subido: pídelo por WhatsApp.</p>'}`}
            <div class="ad-actions">${actions}</div>
            ${blocked ? '' : `<textarea class="ad-note" rows="2" placeholder="Nota interna (solo la ves tú)" data-note="${c.id}">${esc(c.nota_interna || '')}</textarea>`}
        </article>`;
    }

    function render() {
        const pend = citas.filter(c => c.estado === 'pendiente').length;
        const apro = citas.filter(c => c.estado === 'aprobada').length;
        const lib = (cfg.fechas?.length || 0) * (cfg.horas?.length || 0) - citas.filter(c => ACTIVAS.includes(c.estado)).length;
        $('stats').innerHTML =
            `<div class="ad-stat ${pend ? 'ad-stat--alert' : ''}"><strong>${pend}</strong><span>Por revisar</span></div>
             <div class="ad-stat"><strong>${apro}</strong><span>Aprobadas</span></div>
             <div class="ad-stat"><strong>${Math.max(lib, 0)}</strong><span>Horas libres</span></div>`;
        const rows = filtered();
        if (!rows.length) { $('list').innerHTML = '<p class="ad-empty">No hay citas con este filtro.</p>'; return; }
        let out = '', last = '';
        rows.forEach(c => {
            if (c.fecha !== last) { last = c.fecha; out += `<h2 class="ad-day">${esc(dayLabel(c.fecha))}</h2>`; }
            out += card(c);
        });
        $('list').innerHTML = out;
    }

    /* ---------- Acciones ---------- */
    async function setEstado(id, estado) {
        const { error } = await sb.from('citas').update({ estado }).eq('id', id);
        if (error) { flash('No se pudo cambiar el estado: ' + error.message, true); return; }
        flash(`Cita marcada como "${ESTADOS[estado].toLowerCase()}".`);
        await load();
    }

    async function blockSlot() {
        const { error } = await sb.from('citas').insert({
            codigo: 'BL-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
            fecha: $('bDay').value, hora: Number($('bHour').value),
            nombre: 'Hora bloqueada', telefono: '0000000000', zona: '-', estado: 'bloqueada',
        });
        if (error) { flash(/duplicate|unique/i.test(error.message) ? 'Esa hora ya está ocupada.' : error.message, true); return; }
        flash('Hora bloqueada.'); await load();
    }

    function copyAgenda() {
        const rows = citas.filter(c => ['pendiente', 'aprobada', 'cambios'].includes(c.estado) && ($('fDay').value === 'todos' || c.fecha === $('fDay').value));
        if (!rows.length) { flash('No hay citas activas para copiar.', true); return; }
        let txt = 'Agenda Morla Tattoo\n', last = '';
        rows.forEach(c => {
            if (c.fecha !== last) { last = c.fecha; txt += `\n${dayLabel(c.fecha).toUpperCase()}\n`; }
            txt += `${range(c.hora)} · ${c.nombre} (${c.codigo}) · ${ESTADOS[c.estado]} · ${c.zona}\n`;
        });
        navigator.clipboard.writeText(txt.trim()).then(() => flash('Agenda copiada. Ya puedes pegarla en WhatsApp.'), () => flash('No se pudo copiar.', true));
    }

    function init() {
        if (!sb) { $('loginMsg').textContent = 'Falta configurar supabase-config.js.'; $('loginMsg').hidden = false; $('loginForm').querySelector('button').disabled = true; return; }
        $('loginForm').addEventListener('submit', login);
        $('logoutBtn').addEventListener('click', logout);
        $('refreshBtn').addEventListener('click', () => load());
        $('copyBtn').addEventListener('click', copyAgenda);
        $('blockBtn').addEventListener('click', blockSlot);
        $('fDay').addEventListener('change', render);
        $('fEstado').addEventListener('change', render);

        $('list').addEventListener('click', (e) => {
            const a = e.target.closest('[data-act]'), v = e.target.closest('[data-view]');
            if (a) setEstado(a.dataset.id, a.dataset.act);
            if (v) { $('viewerImg').src = v.dataset.view; $('viewerDl').href = v.dataset.view; $('viewer').hidden = false; }
        });
        $('list').addEventListener('change', async (e) => {
            const n = e.target.closest('[data-note]');
            if (!n) return;
            const { error } = await sb.from('citas').update({ nota_interna: n.value.trim() || null }).eq('id', n.dataset.note);
            flash(error ? 'No se pudo guardar la nota.' : 'Nota guardada.', !!error);
        });
        const closeViewer = () => { $('viewer').hidden = true; $('viewerImg').src = ''; };
        $('viewerClose').addEventListener('click', closeViewer);
        $('viewer').addEventListener('click', (e) => { if (e.target === $('viewer')) closeViewer(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('viewer').hidden) closeViewer(); });

        sb.auth.getSession().then(({ data }) => { if (data.session) enter(); });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
