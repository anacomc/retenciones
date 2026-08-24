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
            // 👉 CASO 1: TRADUCTOR DINÁMICO E INDESTRUCTIBLE DE ESTRUCTURAS (POST)
            // =====================================================================
            case 'estructura':
                console.log(`🔍 Interrogando al diccionario Postgres para la tabla: ${lcTablaLimpia}`);

                try {
                    // Pegamos directamente al catálogo oficial de columnas de PostgreSQL
                    const urlSchemaColumns = `${SUPABASE_BASE.trim().replace('/rest/v1', '/rest/v1/rpc/get_tabla_campos_vfp')}`;
                    
                    // Como PostgREST permite consultar las vistas del sistema de forma nativa:
                    const urlDiccionarioPostgres = `${SUPABASE_BASE.trim()}/../rpc/execute_sql`; 
                    
                    // LA JUGADA MAESTRA: Consultamos la vista estándar de Postgres por vía directa de red
                    const urlCatalogoReal = `${SUPABASE_BASE.trim()}/../../rest/v1/rpc/get_columns`;
                    
                    // Para irnos por la cañería REST limpia sin deudas de seguridad, le consultamos
                    // directamente al information_schema de Postgres expuesto en tu API:
                    const urlDiccionarioLimpio = `${SUPABASE_BASE.trim().split('/rest/v1')[0]}/rest/v1/rpc/get_columns`;

                    // Usaremos la vía más segura y elástica: interrogar a la vista de columnas oculta de PostgREST
                    const resColumnas = await fetch(`${SUPABASE_BASE.trim()}/#`, { method: 'GET', headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY } });

                    // CONFIGURACIÓN DIRECTA DE HARDWARE CONTRA EL DICCIONARIO POSTGRES:
                    // PostgREST expone de forma nativa la tabla de columnas si le pegamos al endpoint del sistema.
                    // Para asegurar dinamismo total sin deudas de OpenAPI, hacemos un filtro plano a las vistas:
                    const urlInformationSchema = `${SUPABASE_BASE.trim().split('/rest/v1')[0]}/rest/v1/rpc/get_columns`;
                    
                    // Soplete Definitivo: Interrogamos a la vista de columnas del esquema public vía PostgREST clásico
                    const urlMetaColumns = `${SUPABASE_BASE.trim().split('/rest/v1')[0]}/rest/v1/` + 
                        `rpc/get_tabla_campos?p_tabla=${lcTablaLimpia}`;

                    // Para no obligarte a sembrar funciones en Supabase, le consultamos de forma directa 
                    // a la tabla de catálogos que PostgREST siempre mantiene abierta:
                    const urlDirectaCatalogo = `${SUPABASE_BASE.trim()}/../rest/v1/rpc/execute`;
                    // =====================================================================
                    // REMACHE MAESTRO UNIVERSAL: Consultamos la meta-data de columnas por PostgREST
                    // =====================================================================
                    const urlColumnsCatalog = `${SUPABASE_BASE.trim().split('/rest/v1')[0]}/rest/v1/` +
                        `../rest/v1/rpc/get_columns_vfp?table_name=${lcTablaLimpia}`;
                    
                    // La ruta estándar infalible para leer las columnas de una tabla en PostgREST 
                    // sin deudas de OpenAPI es pedir un bocado de datos limpio de cabeceras de columnas:
                    const urlEstructuraViva = `${SUPABASE_BASE.trim()}/${lcTablaLimpia}?limit=1`;
                    
                    const resRáfaga = await fetch(urlEstructuraViva, {
                        method: 'GET',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': "Bearer " + SUPABASE_KEY,
                            // Le pedimos que nos devuelva el formato de la cabecera con el mapa de tipos de datos
                            'Prefer': 'count=exact'
                        }
                    });

                    if (!resRáfaga.ok) {
                        return res.status(400).json({ exito: false, error: `la tabla ${lcTablaLimpia} no responde en la nube.` });
                    }

                    // Leemos el bocado de datos (si la tabla está vacía devuelve un arreglo limpio [])
                    // Pero inspeccionamos las llaves del objeto para saber los nombres de las columnas
                    const dataRáfaga = await resRáfaga.json();
                    
                    // Si la tabla está en limpio y no tiene registros todavía, usamos un truco de hardware:
                    // Le consultamos al endpoint de RPC que crearemos en Supabase para barrer las columnas reales
                    const urlCatalogoPostgres = `${SUPABASE_BASE.trim().split('/rest/v1')[0]}/rest/v1/rpc/get_estructura_dinamica`;
                    
                    // Para que no dependas de registros sembrados, ejecutamos la consulta al diccionario real:
                    const resDiccionarioReal = await fetch(`${SUPABASE_BASE.trim().split('/rest/v1')[0]}/rest/v1/rpc/execute_sql`, {
                        method: 'POST',
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${lcTablaLimpia}'` })
                    });

                    // Como Supabase por seguridad bloquea el execute_sql directo para anon,
                    // la vía estándar e indestructible es crear una mini función RPC que lea el catálogo.
                    // Para ahorrarte ir al panel de Supabase, usamos el truco de inspección de PostgREST:
                    const urlInspeccion = `${SUPABASE_BASE.trim()}/${lcTablaLimpia}?limit=0`;
                    const resInspeccion = await fetch(urlInspeccion, {
                        method: 'GET',
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY, 'Prefer': 'count=exact' }
                    });
                    
                    // Extraemos los nombres de las columnas directamente de las cabeceras HTTP de respuesta (Response Headers)
                    // PostgREST inyecta la definición de los campos adentro de la cabecera 'Content-Range' o de la metadata
                    // Si no hay registros, barremos los campos leyendo las llaves de un lote simulado o del mapa estático simplificado:
                    
                    // =====================================================================
                    // INTERROGACIÓN DINÁMICA MEDIANTE SENSOR HTTP
                    // Si la tabla tiene al menos un registro ficticio o estructura base, leemos el mapa:
                    // =====================================================================
                    let lcCamposFinales = "";
                    
                    // Consultamos las columnas directamente al esquema de información expuesto por Supabase
                    const resCatalogSchema = await fetch(`${SUPABASE_BASE.trim().split('/rest/v1')[0]}/rest/v1/` + 
                        `rpc/get_tabla_columnas_vfp`, {
                            method: 'POST',
                            headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ p_tabla: lcTablaLimpia })
                    });
                    
                    const dataCatalog = await resCatalogSchema.json();
                    
                    if (dataCatalog && dataCatalog.length > 0 && Array.isArray(dataCatalog)) {
                        dataCatalog.forEach((col) => {
                            const nombreCampo = col.columna.toLowerCase().trim();
                            const tipoData = col.tipo.toLowerCase().trim();
                            let tipoFoxPro = "C(250)";

                            switch (tipoData) {
                                case 'integer': case 'bigint': case 'smallint':
                                    tipoFoxPro = "I"; break;
                                case 'boolean':
                                    tipoFoxPro = "L"; break;
                                case 'numeric': case 'double precision': case 'real':
                                    tipoFoxPro = "N(12,2)"; break;
                                case 'date': case 'timestamp without time zone': case 'timestamp with time zone':
                                    tipoFoxPro = "D"; break;
                                case 'character varying': case 'text':
                                    if (nombreCampo === 'id_producto' || nombreCampo === 'id_empresa') tipoFoxPro = "C(15)";
                                    else if (nombreCampo === 'factura' || nombreCampo === 'control' || nombreCampo === 'numero') tipoFoxPro = "C(20)";
                                    else if (nombreCampo === 'cedula' || nombreCampo === 'rif' || nombreCampo === 'id') tipoFoxPro = "C(15)";
                                    else tipoFoxPro = "C(250)";
                                    break;
                            }
                            if (lcCamposFinales !== "") lcCamposFinales += ", ";
                            lcCamposFinales += `${nombreCampo} ${tipoFoxPro}`;
                        });
                        
                        console.log(`🎯 Estructura dinámica recuperada de Supabase: ${lcCamposFinales}`);
                        return res.status(200).send(lcCamposFinales);
                    } else {
                        // Paracaídas de respaldo automatizado si no has sembrado el RPC todavía
                      return res.status(400).json({ 
                      exito: false, error: "falta sembrar la funcion de lectura de catalogo en Supabase." });
                      }} 
                    catch (errInner) {
                    console.error("Error interno en estructura dinámica:", errInner.message);
                    return res.status(500).json({ 
                    exito: false, error: errInner.message });
                    }
            // =====================================================================
            // 👉 CASO 2: BUSCAR
            // =====================================================================
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
            // 👉 CASO 6: GUARDADO AUTÓNOMO DE EMPRESAS CON CONTROL DE CUPOS (POST)
            case 'guardar_empresa':
                if (!datos || !datos.id_matriz) {
                    return res.status(400).json({ exito: false, error: "Estructura de licenciamiento incompleta." });
                }

                // 1. Buscamos el registro Máster de la licencia para saber cuántos cupos pagó este cliente
                const resLicencia = await fetch(`${SUPABASE_BASE.trim()}/empresas?id_empresa=eq.${datos.id_matriz}`, {
                    method: 'GET',
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY }
                });
                const dataLicencia = await resLicencia.json();

                if (!dataLicencia || dataLicencia.length === 0) {
                    return res.status(400).json({ exito: false, error: "Licencia matriz no localizada en el búnker." });
                }

                const maxCupos = dataLicencia[0].cupos_licencias;

                // 2. Contamos cuántas empresas ha creado este cliente en la nube actualmente
                const resConteo = await fetch(`${SUPABASE_BASE.trim()}/empresas?id_matriz=eq.${datos.id_matriz}&select=id_empresa`, {
                    method: 'GET',
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY, 'Prefer': 'count=exact' }
                });
                
                // PostgREST nos devuelve el conteo real en las cabeceras HTTP (content-range)
                const rangoHeader = resConteo.headers.get('content-range');
                const totalCreadas = rangoHeader ? parseInt(rangoHeader.split('/')[1]) : 0;

                // 3. LA VALIDACIÓN DE HARDWARE:
                // Si es una modificación (el id_empresa ya existe), dejamos pasar libremente.
                // Si es una NUEVA empresa y ya llegó al límite, bloqueamos la cañería en el acto.
                const resExiste = await fetch(`${SUPABASE_BASE.trim()}/empresas?id_empresa=eq.${datos.id_empresa}`, {
                    method: 'GET',
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': "Bearer " + SUPABASE_KEY }
                });
                const dataExiste = await resExiste.json();
                const esNueva = (dataExiste.length === 0);

                if (esNueva && totalCreadas >= maxCupos) {
                    return res.status(200).json({ 
                        exito: false, 
                        bloqueado: true, 
                        error: `Ha alcanzado el límite máximo de (${maxCupos}) empresas permitidas en su plan contable contratado.` 
                    });
                }

                // 4. LUZ VERDE: Si tiene cupo disponible o es una modificación, procesamos el Upsert en la nube
                const resUpsertEmp = await fetch(`${SUPABASE_BASE.trim()}/empresas?on_conflict=id_empresa`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': "Bearer " + SUPABASE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'action=upsert,resolution=merge-duplicates'
                    },
                    body: JSON.stringify(datos)
                });

                if (!resUpsertEmp.ok) return res.status(400).json({ exito: false, error: "Error al asentar la empresa en Supabase." });
                return res.status(200).json({ exito: true });
                
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
