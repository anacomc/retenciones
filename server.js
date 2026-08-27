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
    // const { tabla, accion, clave, datos, id_empresa } = req.body;
    const { tabla, accion, clave, datos, id_empresa, campo_clave } = req.body;


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
            // 👉 CASO 1: TRADUCTOR DINÁMICO E INDESTRUCTIBLE DE ESTRUCTURAS (POST)
            // =====================================================================
            case 'estructura':
                console.log(`🔍 Interrogando al diccionario Postgres para la tabla: ${lcTablaLimpia}`);

                try {
                    // 1. Conexión limpia y directa al RPC que compilaste con Success en Supabase
                    const urlCatalogSchema = `${SUPABASE_BASE.trim()}/rpc/get_tabla_columnas_vfp`;
                    
                    const resCatalogSchema = await fetch(urlCatalogSchema, {
                        method: 'POST',
                        headers: { 
                            'apikey': SUPABASE_KEY, 
                            'Authorization': "Bearer " + SUPABASE_KEY, 
                            'Content-Type': 'application/json' 
                        },
                        body: JSON.stringify({ p_tabla: lcTablaLimpia }) // Le inyectamos el nombre de la tabla
                    });
                    
                    // Si el servidor HTTP de Supabase rebota, capturamos el bit de inmediato
                    if (!resCatalogSchema.ok) {
                        const txtErr = await resCatalogSchema.text();
                        console.error("❌ Supabase rechazó la lectura del catálogo:", txtErr);
                        return res.status(400).json({ exito: false, error: `La tabla ${lcTablaLimpia} no responde en el catálogo.` });
                    }
                    
                    const dataCatalog = await resCatalogSchema.json();
                    
                    // 2. Si la función devolvió las columnas en su arreglo, ejecutamos la traducción
                    if (dataCatalog && dataCatalog.length > 0 && Array.isArray(dataCatalog)) {
                        let lcCamposFinales = "";
                        
                        dataCatalog.forEach((col) => {
                            const nombreCampo = col.columna.toLowerCase().trim();
                            const tipoData = col.tipo.toLowerCase().trim();
                            let tipoFoxPro = "C(250)"; // Máscara por defecto segura para textos planos

                            // =============================================================
                            // TRADUCTOR DE TIPOS DE HARDWARE EN MINÚSCULAS: POSTGRES -> VFP
                            // =============================================================
                            switch (tipoData) {
                                case 'integer': case 'bigint': case 'smallint':
                                    tipoFoxPro = "I"; 
                                    break;
                                    
                                case 'boolean':
                                    tipoFoxPro = "L"; 
                                    break;
                                    
                                case 'numeric': case 'double precision': case 'real':
                                    tipoFoxPro = "N(12,2)"; // Tus campos monetarios y alícuotas contables
                                    break;
                                    
                                case 'date': case 'timestamp without time zone': case 'timestamp with time zone':
                                    tipoFoxPro = "D"; 
                                    break;
                                    
                                case 'character varying': case 'text':
                                    // Mapeo selectivo de anclas según tu estructura física real
                                    if (nombreCampo === 'id_producto' || nombreCampo === 'id_empresa') {
                                        tipoFoxPro = "C(15)";
                                    } else if (nombreCampo === 'factura' || nombreCampo === 'control' || nombreCampo === 'numero') {
                                        tipoFoxPro = "C(20)";
                                    } else if (nombreCampo === 'cedula' || nombreCampo === 'rif' || nombreCampo === 'id') {
                                        tipoFoxPro = "C(15)";
                                    } else if (nombreCampo === 'id_interno') {
                                        tipoFoxPro = "I";
                                    } else {
                                        tipoFoxPro = "C(250)";
                                    }
                                    break;
                            }
                            
                            if (lcCamposFinales !== "") lcCamposFinales += ", ";
                            lcCamposFinales += `${nombreCampo} ${tipoFoxPro}`;
                        });
                        
                        console.log(`🎯 Estructura dinámica despachada a FoxPro: ${lcCamposFinales}`);
                        // Le escupimos a FoxPro el string crudo que necesita tu comando & dinámico
                        return res.status(200).send(lcCamposFinales);
                    } else {
                        console.error(`⚠️ La tabla [${lcTablaLimpia}] no arrojó columnas en el information_schema.`);
                        return res.status(400).json({ exito: false, error: `La tabla ${lcTablaLimpia} no tiene columnas creadas en la nube.` });
                    }

                } catch (errInner) {
                    console.error("❌ Fallo crítico en el mapeador dinámico de estructuras:", errInner.message);
                    return res.status(500).json({ exito: false, error: errInner.message });
                }
            // =====================================================================
            // 👉 CASO 2: BUSCAR REGISTRO 100% DINÁMICO UNIVERSAL (AGNÓSTICO A 20 TABLAS)
            // =====================================================================
            case 'buscar':
                if (!clave || !id_empresa || !campo_clave) {
                    return res.status(400).json({ encontrado: false, error: "Faltan variables en la ráfaga dinámica." });
                }

                // La URL se arma por hardware limpio sin importar si la tabla es empresas, retmaster o nómina
                const urlBuscarDinamica = `${SUPABASE_BASE.trim()}/${tabla.trim().toLowerCase()}?id_empresa=ilike.${id_empresa.trim()}&${campo_clave.trim().toLowerCase()}=ilike.${encodeURIComponent(clave.trim())}`;
                
                console.log("📡 Pasarela universal disparando GET a: " + urlBuscarDinamica);

                const resBuscarDinamica = await fetch(urlBuscarDinamica, {
                    method: 'GET',
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY }
                });
                
                const dataBuscarDinamica = await resBuscarDinamica.json();

                if (dataBuscarDinamica && dataBuscarDinamica.length > 0 && Array.isArray(dataBuscarDinamica)) {
                    return res.status(200).json({ encontrado: true, registro: dataBuscarDinamica });
                } else {
                    return res.status(200).json({ encontrado: false });
                }


            // 👉 CASO 3: GUARDAR REGISTRO (MÉTODO POST - REGLA UPSERT CON CONFLICTO)
            case 'guardar':
                if (!datos) return res.status(400).json({ exito: false, error: "falta el objeto de datos." });

                // Determinamos cuál es el candado único según la estructura relacional sembrada
                const campoConflicto = (lcTablaLimpia === 'clientes') ? 'id_empresa,cedula' : 'id_empresa,rif';
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
                if (!clave || !id_empresa || !campo_clave) {
                    return res.status(400).json({ encontrado: false, error: "Faltan variables en la ráfaga dinámica." });
                }

                // La URL se arma por hardware limpio sin importar si la tabla es empresas, retmaster o nómina
                const urlAnular = `${SUPABASE_BASE.trim()}/${tabla.trim().toLowerCase()}?id_empresa=ilike.${id_empresa.trim()}&${campo_clave.trim().toLowerCase()}=ilike.${encodeURIComponent(clave.trim())}`;
                
                console.log("📡 Pasarela universal disparando ANULAR a: " + urlAnular);                
                
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
                
            // 👉 CASO 5: PROCESAR RETENCIÓN MAESTRO/DETALLE SIN SALTOS (POST)
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
            // =====================================================================
            // 👉 CASO 6: GUARDADO AUTÓNOMO DE EMPRESAS CON CONTROL DE CUPOS (POST)
            // =====================================================================
            case 'guardar_empresa':
                // Validación estricta del sobre y del contenido de la bolsa 'datos'
                if (!datos || !datos.id_matriz || !id_empresa) {
                    return res.status(400).json({ exito: false, error: "Estructura de licenciamiento incompleta en el payload." });
                }

                try {
                    // Limpiamos los IDs de control que viajan strictly en MAYÚSCULAS desde FoxPro
                    const lcIdMatriz  = datos.id_matriz.trim();
                    const lcIdEmpresa = id_empresa.trim();

                    // 1. Buscamos el registro Máster de la licencia en tu Supabase para auditar cupos
                    const urlLicencia = `${SUPABASE_BASE.trim()}/empresas?id_empresa=eq.${lcIdMatriz}`;
                    const resLicencia = await fetch(urlLicencia, {
                        method: 'GET',
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY }
                    });
                    const dataLicencia = await resLicencia.json();

                    if (!dataLicencia || dataLicencia.length === 0) {
                        return res.status(400).json({ exito: false, error: "Licencia matriz no localizada en el búnker." });
                    }

                    // Extraemos el límite de empresas que te pagó este cliente de forma matemática
                    const maxCupos = parseInt(dataLicencia[0].cupos_licencias || 1);

                    // 2. Contamos de forma síncrona cuántas sub-empresas tiene creadas este cliente actualmente
                    const urlConteo = `${SUPABASE_BASE.trim()}/empresas?id_matriz=eq.${lcIdMatriz}&select=id_empresa`;
                    const resConteo = await fetch(urlConteo, {
                        method: 'GET',
                        headers: { 
                            'apikey': SUPABASE_KEY, 
                            'Authorization': "Bearer " + SUPABASE_KEY,
                            'Prefer': 'count=exact' // Le exige a PostgREST calcular el total exacto por hardware
                        }
                    });
                    
                    const rangoHeader = resConteo.headers.get('content-range');
                    let totalCreadas = 0;
                    if (rangoHeader && rangoHeader.includes('/')) {
                        totalCreadas = parseInt(rangoHeader.split('/')[1]) || 0;
                    }

                    // 3. VALIDACIÓN DE HARDWARE: Verificamos si la empresa ya existe en el disco real
                    const urlExiste = `${SUPABASE_BASE.trim()}/empresas?id_empresa=eq.${lcIdEmpresa}`;
                    const resExiste = await fetch(urlExiste, {
                        method: 'GET',
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY }
                    });
                    const dataExiste = await resExiste.json();
                    const esNueva = (dataExiste.length === 0);

                    // EL CANDADO COMERCIAL: Si es un registro NUEVO y ya consumió sus cupos, cerramos el grifo
                    if (esNueva && totalCreadas >= maxCupos) {
                        console.log(`⚠️ Bloqueo de cupos para matriz ${lcIdMatriz}. Creadas: ${totalCreadas}, Máximo: ${maxCupos}`);
                        return res.status(200).json({ 
                            exito: false, 
                            bloqueado: true, 
                            error: `Ha alcanzado el límite máximo de (${maxCupos}) empresas permitidas en su plan contable contratado.` 
                        });
                    }

                    // 4. LUZ VERDE EN CASCADA: Si tiene cupo o es una modificación, ejecutamos el Upsert
                    // Pasamos la bolsa de 'datos' cruda, autónoma e inmutable directo a la tabla de Supabase
                    const urlUpsertEmp = `${SUPABASE_BASE.trim()}/${lcTablaLimpia}?on_conflict=id_empresa`;
                    
                    console.log(`💾 Ejecutando Upsert directo de empresas en: ${urlUpsertEmp}`);

                    const resUpsertEmp = await fetch(urlUpsertEmp, {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': "Bearer " + SUPABASE_KEY,
                            'Content-Type': 'application/json',
                            'Prefer': 'action=upsert,resolution=merge-duplicates' // Regla Upsert reglamentaria de Supabase
                        },
                        body: JSON.stringify(datos) // Grabamos el clon exacto de tu cursor de trabajo local de FoxPro
                    });

                    if (!resUpsertEmp.ok) {
                        const txtErrU = await resUpsertEmp.text();
                        console.error("❌ Error de asimiento en Supabase:", txtErrU);
                        return res.status(400).json({ exito: false, error: "Error al asentar la empresa en la base de datos." });
                    }

                    console.log(`✅ Empresa ${lcIdEmpresa} asentada con éxito de forma autónoma. Matriz: ${lcIdMatriz}`);
                    return res.status(200).json({ exito: true });

                } catch (errEmpresa) {
                    console.error("❌ Fallo crítico en el microservicio guardar_empresa:", errEmpresa.message);
                    return res.status(500).json({ exito: false, error: errEmpresa.message });
                }


        //**********************************************************************************************************************************         
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
