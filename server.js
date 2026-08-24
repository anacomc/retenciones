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

            // =====================================================================
            // 👉 CASO 1: DICCIONARIO DINÁMICO DE HARDWARE PARA VISUAL FOXPRO
            // =====================================================================
            case 'estructura':
                console.log(`🔍 Desplegando estructura local fija para la tabla: ${lcTablaLimpia}`);

                let stringFoxPro = "";

                // =============================================================
                // MAPEO EXACTO EN MINÚSCULAS DE TUS COLUMNAS REALES DE SUPABASE
                // =============================================================
                switch (lcTablaLimpia) {
                    case 'empresas':
                        stringFoxPro = "id_empresa C(15), rif C(15), razon_social C(250), cupos_licencias I, status L";
                        break;

                    case 'clientes':
                        stringFoxPro = "id I, id_empresa C(15), cedula C(15), nombre C(250), telefono C(20), direccion C(250)";
                        break;

                    case 'retmaster':
                        stringFoxPro = "id_empresa C(15), numero C(20), fecha D, rif C(15), cliente C(250), total N(12,2), base N(12,2), iva N(12,2), retenido N(12,2), pagado N(12,2), excento N(12,2), porceret N(6,2), impreso L, elaborado D, status L";
                        break;

                    case 'retdal':
                        stringFoxPro = "id_interno I, id_empresa C(15), numero C(20), id C(2), fechafactu D, comprobant N(12,2), factura C(20), control C(20), notad C(20), notacr C(20), tipo C(2), factuafec C(20), tipodoc C(2), totalciva N(12,2), totalsinde N(12,2), base N(12,2), alicuota N(6,2), iva N(12,2), retenido N(12,2), apagar N(12,2)";
                        break;

                    default:
                        console.error(`La tabla ${lcTablaLimpia} no está registrada en el diccionario de la pasarela.`);
                        return res.status(400).json({ exito: false, error: `la tabla ${lcTablaLimpia} no esta mapeada en el servidor.` });
                }

                console.log(`🎯 Estructura despachada con éxito para FoxPro: ${stringFoxPro}`);
                // Le devolvemos el string puro que tu comando & dinámico en VFP necesita para el CREATE CURSOR
                return res.status(200).send(stringFoxPro);



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
                
            // 👉 CASO 4: PROCESAR RETENCIÓN MAESTRO/DETALLE SIN SALTOS (POST)
            // Cambiado dinámicamente de 'facturar' a 'retencion' a tu manera
            case 'retencion':
                if (!datos) return res.status(400).json({ exito: false, error: "falta la estructura del comprobante." });

                // Modificamos la URL base para apuntar al endpoint RPC nativo de tu función en Supabase
                const urlRpcRetencion = SUPABASE_BASE.trim().replace('/rest/v1', '/rpc/procesar_comprobante_retencion');
                console.log("⚡ pasarela ejecutando transaccion rpc en: " + urlRpcRetencion);

                const resRpc = await fetch(urlRpcRetencion, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': "Bearer " + SUPABASE_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datos) // Le inyectamos los datos del maestro y su arreglo 'p_items'
                });

                const dataRpc = await resRpc.json();

                if (!resRpc.ok || dataRpc.exito === false) {
                    console.error("error en la transaccion rpc:", dataRpc.error || "falla de hardware");
                    return res.status(400).json({ exito: false, error: dataRpc.error || "bloqueo de integridad fiscal." });
                }

                // Devolvemos el número de control definitivo (año+mes+secuencia) generado por Postgres
                return res.status(200).json({ 
                    exito: true, 
                    numero_control: dataRpc.numero_control 
                });
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
