using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;
namespace captchaSolver {
	public partial class Form1: Form {
		private WebBrowser ? webBrowserSeniat;
		private readonly string urlRealBase = "http://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp";
		// VARIABLE DE ESTADO CLAVE: Controla si la recarga fue solicitada por tu botón
		private bool esRefrescoManual = false;
		public Form1() {
			try {
				string nombreProceso = AppDomain.CurrentDomain.FriendlyName;
				using(var clave = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@ "Software\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_BROWSER_EMULATION", true)) {
					clave?.SetValue(nombreProceso, 11001, Microsoft.Win32.RegistryValueKind.DWord);
				}
			} catch {
				// Resguardo silencioso por restricciones de políticas
			}
			InitializeComponent();
			// Cargamos el CAPTCHA una única vez al inicializar la pantalla de facturación
			_ = CargarInterfazSeniat();
		}
		private void Form1_Load(object sender, EventArgs e) {
			// Se mantiene vacío para cumplir con tu flujo y evitar dobles peticiones de red
		}
		// =====================================================================
		// CARGA INICIAL Y REENCUADRE AUTOMÁTICO (TU DISEÑO CON EL PANEL)
		// =====================================================================
		private async Task CargarInterfazSeniat() {
			txtRif.Enabled = false;
			txtCaptcha.Enabled = false;
			CmdConsultar.Enabled = false;
			if(webBrowserSeniat == null) {
				webBrowserSeniat = new WebBrowser {
					ScrollBarsEnabled = false,
						ScriptErrorsSuppressed = true
				};
				// Tu panelCaptcha de 165x65 recibe el control
				panelCaptcha.Controls.Add(webBrowserSeniat);
			}
			webBrowserSeniat.Navigate(urlRealBase);
			int tiempoEspera = 0;
			while(webBrowserSeniat.ReadyState != WebBrowserReadyState.Complete && tiempoEspera < 30) {
				await Task.Delay(500);
				tiempoEspera++;
			}
			if(webBrowserSeniat.ReadyState != WebBrowserReadyState.Complete || webBrowserSeniat.Document == null) {
				MessageBox.Show("El servidor fiscal no respondió en el tiempo de tolerancia.", "Timeout", MessageBoxButtons.OK, MessageBoxIcon.Error);
				return;
			}
			AlinearContenedorGrafico();
		}
		// Función interna encargada de clavar la pantalla en tus coordenadas exactas
		private void AlinearContenedorGrafico() {
			if(webBrowserSeniat == null || webBrowserSeniat.Document == null) return;
			try {
				HtmlDocument doc = webBrowserSeniat.Document;
				if(doc.Body != null) {
					doc.Body.Style = "overflow:hidden; margin:0px; padding:0px; background-image:none; background-color:#FFFFFF;";
					doc.Body.SetAttribute("scroll", "no");
				}
				// TUS COORDENADAS CALIBRADAS EXACTAS DE FOXPRO
				webBrowserSeniat.Width = 600;
				webBrowserSeniat.Height = 600;
				webBrowserSeniat.Left = -70;
				webBrowserSeniat.Top = -190;
				txtRif.Enabled = true;
				txtCaptcha.Enabled = true;
				CmdConsultar.Enabled = true;
				txtCaptcha.Clear();
				txtRif.Focus();
			} catch (Exception ex) {
				MessageBox.Show("Fallo en la manipulación mecánica de la interfaz: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
			}
		}
		// =====================================================================
		// BOTÓN CONSULTAR: PERMITE CONSULTAS MÚLTIPLES CON EL MISMO CAPTCHA
		// =====================================================================
		private async void CmdConsultar_Click(object sender, EventArgs e) {
			string rif = txtRif.Text.Trim().ToUpper();
			string captchaTexto = txtCaptcha.Text.Trim();
			if(string.IsNullOrEmpty(rif) || string.IsNullOrEmpty(captchaTexto)) {
				MessageBox.Show("Debe ingresar el RIF y el código Captcha obligatoriamente.", "Campos Vacíos", MessageBoxButtons.OK, MessageBoxIcon.Warning);
				return;
			}
			if(webBrowserSeniat == null || webBrowserSeniat.Document == null) {
				MessageBox.Show("La sesión de red no está inicializada.", "Aviso", MessageBoxButtons.OK, MessageBoxIcon.Warning);
				return;
			}
			this.Cursor = Cursors.WaitCursor;
			txtRif.Enabled = false;
			txtCaptcha.Enabled = false;
			CmdConsultar.Enabled = false;
			try {
				// Extraemos la Cookie viva para consumirla por el canal oculto de fondo
				string cookieViva = webBrowserSeniat.Document.Cookie ?? "";
				var handler = new HttpClientHandler {
					AutomaticDecompression = DecompressionMethods.All
				};
				if(!string.IsNullOrEmpty(cookieViva)) {
					handler.CookieContainer.SetCookies(new Uri(urlRealBase), cookieViva);
				}
				using(var clienteInvisible = new HttpClient(handler)) {
					clienteInvisible.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
					clienteInvisible.DefaultRequestHeaders.Add("Referer", urlRealBase);
					clienteInvisible.Timeout = TimeSpan.FromSeconds(15);
					var camposFormulario = new Dictionary < string,
						string > {
							{
								"p_rif",
								rif
							},
							{
								"p_cedula",
								""
							},
							{
								"codigo",
								captchaTexto
							},
							{
								"busca",
								" Buscar "
							}
						};
					var content = new FormUrlEncodedContent(camposFormulario);
					var response = await clienteInvisible.PostAsync(urlRealBase, content);
					var htmlBytes = await response.Content.ReadAsByteArrayAsync();
					System.Text.Encoding win1252 = System.Text.Encoding.GetEncoding("windows-1252");
					string htmlRespuesta = win1252.GetString(htmlBytes);
					string pathLog = Path.Combine(Path.GetTempPath(), "respuesta_seniat.html");
					File.WriteAllText(pathLog, htmlRespuesta);
					// EVALUAR RESPUESTAS
					if(htmlRespuesta.Contains("Valide el codigo") || htmlRespuesta.Contains("Código incorrecto") || htmlRespuesta.Contains("Introduzca el codigo")) {
						MessageBox.Show("El código captcha ingresado es incorrecto. Se solicitará uno nuevo de forma automática.", "Validación Fallida", MessageBoxButtons.OK, MessageBoxIcon.Warning);
						this.Cursor = Cursors.Default;
						// Si el usuario se equivocó, disparamos el refresco controlado automáticamente
						cmdrecaptcha_Click(sender, e);
						return;
					}
					if(htmlRespuesta.Contains("El RIF consultado no existe") || htmlRespuesta.Contains("No existe el contribuyente")) {
						MessageBox.Show("El número de RIF ingresado no se encuentra registrado en el SENIAT.", "No Registrado", MessageBoxButtons.OK, MessageBoxIcon.Information);
						// LIBERACIÓN: El CAPTCHA sigue vivo e intacto para intentar con otro cliente
						this.Cursor = Cursors.Default;
						txtRif.Enabled = true;
						txtCaptcha.Enabled = true;
						CmdConsultar.Enabled = true;
						txtRif.Focus();
						return;
					}
					// --- PARSEO DE DATOS FISCALES ---
					string razonSocial = ExtraerTexto(htmlRespuesta, "face=Verdana size=2>", "</B></FONT>");
					if(string.IsNullOrEmpty(razonSocial)) razonSocial = ExtraerTexto(htmlRespuesta, "face=\"Verdana\" size=\"2\">", "</b></font>");
					if(string.IsNullOrEmpty(razonSocial)) razonSocial = ExtraerTexto(htmlRespuesta, "SIZE=2 face=Verdana>", "</B></FONT>");
					if(string.IsNullOrEmpty(razonSocial)) razonSocial = ExtraerTexto(htmlRespuesta, "size=2 face=Verdana>", "</B></FONT>");
					if(razonSocial.Contains("&nbsp;")) {
						razonSocial = razonSocial.Substring(razonSocial.IndexOf("&nbsp;") + 6).Trim();
					}
					string actividad = ExtraerTexto(htmlRespuesta, "Actividad Económica:", "<");
					string condicion = ExtraerTexto(htmlRespuesta, "Condición:", "La condición de este");
					string retencion = ExtraerTexto(htmlRespuesta, "retención del ", " del impuesto");
					if(!string.IsNullOrEmpty(razonSocial)) {
						if(razonSocial.Contains('(')) {
							razonSocial = razonSocial.Substring(0, razonSocial.IndexOf('(')).Trim();
						}
						razonSocial = Regex.Replace(razonSocial, "<.?>", "").Replace(" ", " ").Trim();
						actividad = Regex.Replace(actividad, "<.?>", "").Replace(" ", " ").Trim();
						condicion = Regex.Replace(condicion, "<.*?>", "").Replace(" ", " ").Replace("\n", " ").Replace("\r", "").Trim();
						retencion = retencion.Replace(" ", " ").Trim();
						if(string.IsNullOrEmpty(retencion)) retencion = "75%";
						this.Cursor = Cursors.Default;
						txtRif.Enabled = true;
						txtCaptcha.Enabled = true;
						CmdConsultar.Enabled = true;
						txtRif.Clear();
						txtRif.Focus();
						string mensajeVisual = $ "CONTRIBUYENTE ENCONTRADO EN EL SENIAT:\n\n" + $ "Razón Social: {razonSocial}\n" + $ "Actividad Económica: {actividad}\n" + $ "Condición Fiscal: {condicion}\n" + $ "Porcentaje Retención IVA: {retencion}";
						MessageBox.Show(mensajeVisual, "Consulta Exitosa", MessageBoxButtons.OK, MessageBoxIcon.Information);
					} else {
						this.Cursor = Cursors.Default;
						txtRif.Enabled = true;
						txtCaptcha.Enabled = true;
						CmdConsultar.Enabled = true;
						MessageBox.Show($ "No se pudo procesar el formato de la Razón Social. Revisa el log en:\n{pathLog}", "Estructura no reconocida", MessageBoxButtons.OK, MessageBoxIcon.Warning);
					}
				}
			} catch (Exception ex) {
				this.Cursor = Cursors.Default;
				txtRif.Enabled = true;
				txtCaptcha.Enabled = true;
				CmdConsultar.Enabled = true;
				MessageBox.Show("Ocurrió un error al procesar el envío de datos: " + ex.Message, "Error de Ejecución", MessageBoxButtons.OK, MessageBoxIcon.Error);
			}
		}
		private string ExtraerTexto(string textoCompleto, string delimitadorIzquierdo, string delimitadorDerecho) {
			int inicio = textoCompleto.IndexOf(delimitadorIzquierdo);
			if(inicio == -1) return "";
			inicio += delimitadorIzquierdo.Length;
			int fin = textoCompleto.IndexOf(delimitadorDerecho, inicio);
			if(fin == -1) return "";
			return textoCompleto.Substring(inicio, fin - inicio).Trim();
		}
		// =====================================================================
		// BOTÓN REFRESCAR CAPTCHA (SOLUCIÓN AL COMPORTAMIENTO DESALINEADO)
		// =====================================================================
		private async void cmdrecaptcha_Click(object sender, EventArgs e) {
			if(webBrowserSeniat == null) return;
			txtRif.Enabled = false;
			txtCaptcha.Enabled = false;
			CmdConsultar.Enabled = false;
			try {
				// Marcamos que la recarga es intencional del botón para activar el seguro
				esRefrescoManual = true;
				// Comando nativo de refresco de Windows Forms (Evita el bloqueo de red y respeta cookies)
				webBrowserSeniat.Refresh();
				// Esperamos de forma asíncrona a que termine el refresco gráfico
				int tiempoEspera = 0;
				while(webBrowserSeniat.ReadyState != WebBrowserReadyState.Complete && tiempoEspera < 30) {
					await Task.Delay(500);
					tiempoEspera++;
				}
				// Volvemos a clavar la imagen en tus coordenadas -70 y -190 de forma obligatoria
				AlinearContenedorGrafico();
				esRefrescoManual = false;
			} catch {
				// Si ocurre un desajuste mayor de memoria, usamos el restaurador limpio
				esRefrescoManual = false;
				await CargarInterfazSeniat();
			}
		}
	}
}
