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
            // 👉 CASO 1: TRADUCTOR DINÁMICO DE ESTRUCTURAS POSTGRES A VISUAL FOXPRO
            // =====================================================================
            case 'estructura':
                console.log(`🔍 Generando diccionario de campos FoxPro para la tabla: ${lcTablaLimpia}`);

                try {
                    // REMACHE MAESTRO: Le pegamos a la raíz pura de la API REST para jalar el esquema OpenAPI global
                    const resSchema = await fetch(`${SUPABASE_BASE.trim()}/`, {
                        method: 'GET',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': "Bearer " + SUPABASE_KEY,
                            'Accept': 'application/openapi+json' // Exigimos la radiografía estructural de todo el proyecto
                        }
                    });

                    if (!resSchema.ok) {
                        const txtErrS = await resSchema.text();
                        console.error("Fallo al leer especificaciones de Supabase:", txtErrS);
                        return res.status(400).json({ exito: false, error: "no se pudo leer el esquema de la base de datos." });
                    }

                    const schemaData = await resSchema.json();
                    
                    // Validamos dinámicamente si la ruta de la tabla existe en las definiciones del búnker
                    const rutaTabla = `/${lcTablaLimpia}`;
                    if (!schemaData.paths || !schemaData.paths[rutaTabla]) {
                        console.error(`La tabla ${lcTablaLimpia} no se localizó en las rutas de PostgREST.`);
                        return res.status(400).json({ exito: false, error: `la tabla ${lcTablaLimpia} no existe o no tiene permisos en supabase.` });
                    }

                    // Extraemos los parámetros de las columnas de la definición de filtrado GET
                    const propiedades = schemaData.paths[rutaTabla].get.parameters;
                    let stringFoxPro = "";

                    // Barremos las columnas reales que tiene la tabla en la nube en este microsegundo
                    propiedades.forEach((param) => {
                        // Filtramos solo las propiedades planas de las columnas de la tabla
                        if (param.in === 'query' && !param.name.includes('.')) {
                            const nombreCampo = param.name.toLowerCase().trim();
                            const tipoPostgres = param.type || 'string';
                            const formatoPostgres = param.format || '';
                            
                            let tipoFoxPro = "C(250)"; // Tipo por defecto seguro para resguardar texto

                            // =============================================================
                            // TRADUCTOR DE TIPOS DE HARDWARE: POSTGRES -> VFP
                            // =============================================================
                            switch (tipoPostgres) {
                                case 'integer':
                                    tipoFoxPro = "I";
                                    break;
                                case 'boolean':
                                    tipoFoxPro = "L";
                                    break;
                                case 'number':
                                    tipoFoxPro = "N(12,2)"; // Formato idóneo para tus campos monetarios y alícuotas
                                    break;
                                case 'string':
                                    if (formatoPostgres === 'date' || nombreCampo === 'fecha' || nombreCampo.includes('fecha') || nombreCampo.includes('elaborado')) {
                                        tipoFoxPro = "D";
                                    } else if (nombreCampo === 'id' || nombreCampo === 'id_interno') {
                                        tipoFoxPro = "I"; // Mapeamos los IDs autoincrementales como Enteros locales
                                    } else if (nombreCampo === 'id_producto' || nombreCampo === 'id_empresa') {
                                        tipoFoxPro = "C(15)";
                                    } else if (nombreCampo === 'factura' || nombreCampo === 'control' || nombreCampo === 'numero') {
                                        tipoFoxPro = "C(20)";
                                    } else if (nombreCampo === 'cedula' || nombreCampo === 'rif') {
                                        tipoFoxPro = "C(15)";
                                    } else {
                                        tipoFoxPro = "C(250)";
                                    }
                                    break;
                            }

                            // Concatenamos el campo en el string con el formato rígido de FoxPro
                            if (stringFoxPro !== "") stringFoxPro += ", ";
                            stringFoxPro += `${nombreCampo} ${tipoFoxPro}`;
                        }
                    });

                    console.log(`🎯 Estructura unificada y mapeada para FoxPro: ${stringFoxPro}`);
                    // Le devolvemos el string puro que tu comando & dinámico en VFP necesita para el CREATE CURSOR
                    return res.status(200).send(stringFoxPro);

                } catch (errInner) {
                    console.error("Error interno procesando esquema OpenAPI:", errInner.message);
                    return res.status(500).json({ exito: false, error: errInner.message });
                }


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
