/* Morla Tattoo – API de citas (Vercel Serverless + Vercel Blob)
   GET  /api/citas              → { taken: ["2026-10-29-08", ...] }  (horas ocupadas)
   POST /api/citas              → reserva una hora y guarda el diseño
   GET  /api/citas?key=ADMIN_KEY → lista de solicitudes para Morla */
const { put, list } = require('@vercel/blob');

const DAYS  = ['2026-10-29', '2026-10-30', '2026-10-31'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 16, 17, 18];
const MIN_HOURS = 48;
const MAX_IMG_CHARS = 3_000_000;                      // ~2.2 MB por imagen ya comprimida
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
        if (req.method === 'GET') {
            if (req.query.key) {
                if (!process.env.ADMIN_KEY || req.query.key !== process.env.ADMIN_KEY)
                    return res.status(401).json({ error: 'No autorizado' });
                const { blobs } = await list({ prefix: 'registro/' });
                const rows = await Promise.all(blobs.map(b => fetch(b.url).then(r => r.json())));
                return res.status(200).json({ citas: rows.sort((a, b) => a.slot.localeCompare(b.slot)) });
            }
            const { blobs } = await list({ prefix: 'citas/' });
            return res.status(200).json({ taken: blobs.map(b => b.pathname.slice(6, -5)) });
        }
        if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

        const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        if (b.hp) return res.status(200).json({ code: 'MT-0000' });            // trampa anti-bots

        const m = /^(\d{4}-\d{2}-\d{2})-(\d{2})$/.exec(b.slot || '');
        if (!m || !DAYS.includes(m[1]) || !HOURS.includes(Number(m[2])))
            return res.status(400).json({ error: 'Hora no válida.' });
        const [y, mo, d] = m[1].split('-').map(Number);
        // Hora dominicana = UTC-4
        const startUtc = Date.UTC(y, mo - 1, d, Number(m[2]) + 4);
        if (startUtc - Date.now() < MIN_HOURS * 36e5)
            return res.status(400).json({ error: 'Esa hora ya cerró. Las citas cierran 48 horas antes.' });

        const name = clean(b.name, 80), phone = clean(b.phone, 20), zone = clean(b.zone, 120);
        if (name.length < 2 || phone.replace(/\D/g, '').length < 10 || !zone)
            return res.status(400).json({ error: 'Revisa tus datos.' });
        const designs = Array.isArray(b.designs) ? b.designs.slice(0, 2) : [];
        if (!designs.length || designs.some(s => !/^data:image\/(jpeg|png|webp);base64,/.test(s) || s.length > MAX_IMG_CHARS))
            return res.status(400).json({ error: 'Sube al menos un diseño válido (JPG, PNG o WEBP).' });

        const code = 'MT-' + Math.random().toString(36).slice(2, 7).toUpperCase();

        // 1) Apartar la hora (falla si ya existe → nadie puede reservar la misma hora dos veces)
        try {
            await put(`citas/${b.slot}.json`, JSON.stringify({ code }), {
                access: 'public', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json',
            });
        } catch (e) {
            if (/already exists/i.test(e.message || '')) return res.status(409).json({ error: 'Hora ocupada.' });
            throw e;
        }

        // 2) Guardar diseños y datos del cliente (URLs con sufijo aleatorio, no adivinables)
        const urls = [];
        for (let i = 0; i < designs.length; i++) {
            const buf = Buffer.from(designs[i].split(',')[1], 'base64');
            const img = await put(`disenos/${code}-${i + 1}.jpg`, buf, { access: 'public', contentType: 'image/jpeg' });
            urls.push(img.url);
        }
        await put(`registro/${code}.json`, JSON.stringify({
            code, slot: b.slot, name, phone, zone, notes: clean(b.notes, 500),
            designs: urls, status: 'pendiente', createdAt: new Date().toISOString(),
        }), { access: 'public', contentType: 'application/json' });

        return res.status(200).json({ code });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'No pudimos guardar tu cita. Intenta de nuevo.' });
    }
};
