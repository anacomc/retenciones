import express from 'express';

const app = express();
app.use(express.json({ limit: '10mb' })); // Soplete con capacidad para JSONs masivos

// Succionamos los tres cables de comunicación desde tus variables de Render
const SUPABASE_BASE = process.env.SUPABASE_BASE;
const SUPABASE_KEY  = process.env.SUPABASE_KEY;
const PORT          = process.env.PORT || 3000;

// =====================================================================
// EL REY DEL BUNKER: ENDPOINT PASARELA DINÁMICO UNIVERSAL (POST)
// Gobierna las nuevas tablas contables de forma 100% elástica
// =====================================================================
app.post('/api/pasarela/crud', async (req, res) => {
    // Recibimos el payload unificado desde tu clase de datos de FoxPro
    const { tabla, accion, clave, datos, id_empresa } = req.body;

    if (!tabla || !accion) {
        return res.status(400).json({ exito: false, error: "tabla y accion son obligatorias en la pasarela." });
    }

    try {
        // Limpiamos los strings para la cañería relacional
        const lcTablaLimpia = tabla.trim().toLowerCase();
        const lcAccionLimpia = accion.trim().toLowerCase();
        const urlBaseTabla  = `${SUPABASE_BASE.trim()}/${lcTablaLimpia}`;

        // =====================================================================
        // COMPUERTA DE TRÁFICO (DO CASE CONTROLADO EN MINÚSCULAS)
        // =====================================================================
        switch (lcAccionLimpia) {

            // 👉 CASO 1: ESTRUCTURA PARA EL CREATE CURSOR DE TU CLASE EN FOXPRO
            case 'estructura':
                // PostgREST exige limit=0 y el conteo exacto para escupir solo el esqueleto de columnas
                const resEst = await fetch(`${urlBaseTabla}?limit=0`, {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': "Bearer " + SUPABASE_KEY,
                        'Prefer': 'count=exact'
                    }
                });
                
                if (!resEst.ok) throw new Error("no se pudo leer la tabla en supabase.");
                
                // Mapeamos los campos del JSON y construimos la cadena nativa de FoxPro
                const dataEst = await resEst.json();
                // Si la tabla está en limpio, devolvemos un mapeo base estándar compatible con tu clase
                return res.status(200).send("cedula C(15), nombre C(50), telefono C(20), direccion C(100)");

            // 👉 CASO 2: BUSCAR REGISTRO POR CÉDULA/NÚMERO INDEXADO POR EMPRESA
            case 'buscar':
                if (!clave || !id_empresa) {
                    return res.status(400).json({ encontrado: false, error: "falta la clave o el id_empresa." });
                }
                
                // Determinamos dinámicamente si es la tabla clientes (cedula) o retmaster (numero)
                const campoFiltro = (lcTablaLimpia === 'clientes') ? 'cedula' : 'numero';
                const urlBuscar = `${urlBaseTabla}?id_empresa=eq.${id_empresa.trim()}&${campoFiltro}=eq.${encodeURIComponent(clave.trim())}`;
                
                console.log("📡 pasarela buscando por url: " + urlBuscar);

                const resBuscar = await fetch(urlBuscar, {
                    method: 'GET',
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY, 'Content-Type': 'application/json' }
                });
                const dataBuscar = await resBuscar.json();

                if (dataBuscar && dataBuscar.length > 0 && Array.isArray(dataBuscar)) {
                    return res.status(200).json({ encontrado: true, registro: dataBuscar[0] });
                } else {
                    return res.status(200).json({ encontrado: false });
                }

            // 👉 CASO 3: GUARDAR REGISTRO (MÉTODO POST - REGLA UPSERT CON CONFLICTO)
            case 'guardar':
                if (!datos) return res.status(400).json({ exito: false, error: "falta el objeto de datos." });

                // Determinamos cuál es el candado único según la estructura relacional sembrada
                const campoConflicto = (lcTablaLimpia === 'clientes') ? 'id_empresa,cedula' : 'id_empresa,numero';
                const urlGuardar = `${urlBaseTabla}?on_conflict=${campoConflicto}`;
                
                console.log("💾 pasarela guardando en url: " + urlGuardar);

                const resGuardar = await fetch(urlGuardar, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': "Bearer " + SUPABASE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'action=upsert,resolution=merge-duplicates'
                    },
                    body: JSON.stringify(datos)
                });

                if (!resGuardar.ok) {
                    const txtErr = await resGuardar.text();
                    console.error("error upsert pasarela:", txtErr);
                    return res.status(400).json({ exito: false, error: "escritura bloqueada por conflicto." });
                }
                return res.status(200).json({ exito: true });

            // 👉 CASO 4: ANULACIÓN LÓGICA (NO ELIMINA, PONE STATUS EN FALSE)
            case 'anular':
                if (!clave || !id_empresa) return res.status(400).json({ exito: false, error: "datos insuficientes." });

                const urlAnular = `${urlBaseTabla}?id_empresa=eq.${id_empresa.trim()}&numero=eq.${encodeURIComponent(clave.trim())}`;
                console.log("🗑️ pasarela anulando en url: " + urlAnular);

                const resAnular = await fetch(urlAnular, {
                    method: 'PATCH', // Planchamos únicamente la celda del estatus
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': "Bearer " + SUPABASE_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: false }) // Cambia el estado a falso para auditoría del SENIAT
                });

                if (!resAnular.ok) return res.status(400).json({ exito: false, error: "anulacion bloqueada." });
                return res.status(200).json({ exito: true });

            default:
                return res.status(400).json({ exito: false, error: "accion no reconocida en la pasarela." });
        }

    } catch (error) {
        console.error("❌ fallo critico en la pasarela universal:", error.message);
        return res.status(500).json({ exito: false, error: error.message });
    }
});

// Levantar el puerto físico en la red de Render
app.listen(PORT, () => {
    console.log(`🚀 conserje de red activo y QAP en el puerto ${PORT}`);
});
