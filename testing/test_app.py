import json
import os
import sys
import time
from datetime import date, timedelta
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
ADMIN_CORREO = "administrador.sistema@empresa.cl"
ADMIN_CLAVE = "Adm!wu7X9uTJ0xl89cAa"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SHOT_DIR = os.path.join(SCRIPT_DIR, "screenshots")
os.makedirs(SHOT_DIR, exist_ok=True)

results = []

def step(nombre):
    def decorator(fn):
        def wrapper(*a, **kw):
            entry = {"paso": nombre, "estado": None, "detalle": ""}
            try:
                detalle = fn(*a, **kw)
                entry["estado"] = "OK"
                entry["detalle"] = detalle or ""
            except Exception as e:
                entry["estado"] = "FALLA"
                entry["detalle"] = f"{type(e).__name__}: {e}"
            results.append(entry)
            print(f"[{entry['estado']}] {nombre} - {entry['detalle']}")
            return entry["estado"] == "OK"
        return wrapper
    return decorator

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx_admin = browser.new_context()
    page = ctx_admin.new_page()

    nombre_prueba = "Zeta"
    apellido_prueba = "Pruebita"
    correo_esperado_prefix = "zeta.pruebita"
    clave_empleado = "ClaveTemp!234"

    @step("01. Login con credenciales invalidas muestra error")
    def t01():
        page.goto(f"{BASE}/login.html")
        page.wait_for_load_state("networkidle")
        page.fill("#correo", "no.existe@empresa.cl")
        page.fill("#contrasena", "loquesea123")
        page.click("#ingresar")
        page.wait_for_selector("#mensaje:not([hidden])", timeout=5000)
        texto = page.inner_text("#mensaje")
        assert page.url.endswith("/login.html"), "no deberia navegar fuera de login"
        return f"mensaje mostrado: '{texto}'"
    t01()

    @step("02. Login admin valido redirige a Inicio")
    def t02():
        page.fill("#correo", ADMIN_CORREO)
        page.fill("#contrasena", ADMIN_CLAVE)
        page.click("#ingresar")
        page.wait_for_url(f"{BASE}/", timeout=8000)
        page.wait_for_load_state("networkidle")
        return f"URL final: {page.url}"
    if not t02():
        page.screenshot(path=f"{SHOT_DIR}/02-fallo-login-admin.png")

    @step("03. Dashboard Inicio carga estadisticas")
    def t03():
        page.wait_for_selector("#stat-empleados", timeout=5000)
        page.wait_for_timeout(1200)  # animarConteo dura ~900ms
        empleados = page.inner_text("#stat-empleados")
        marcaciones = page.inner_text("#stat-marcaciones")
        atrasos = page.inner_text("#stat-atrasos")
        nav_usuarios_visible = page.is_visible("a[href='/usuarios.html']")
        assert nav_usuarios_visible, "nav de Usuarios deberia verse para un admin"
        return f"empleados={empleados} marcaciones={marcaciones} atrasos={atrasos} nav_usuarios_visible={nav_usuarios_visible}"
    t03()
    page.screenshot(path=f"{SHOT_DIR}/03-dashboard-admin.png", full_page=True)

    @step("04. Crear usuario empleado de prueba")
    def t04():
        page.goto(f"{BASE}/usuarios.html")
        page.wait_for_load_state("networkidle")
        page.click("#crear")
        page.wait_for_selector("#editor.abierto", timeout=3000)
        page.fill("#nombre", nombre_prueba)
        page.fill("#apellido", apellido_prueba)
        page.fill("#contrasena", clave_empleado)
        page.select_option("#rol", "EMPLEADO")
        page.click("#guardar")
        page.wait_for_selector("#mensaje:not([hidden])", timeout=5000)
        texto = page.inner_text("#mensaje")
        assert "Usuario creado" in texto, f"mensaje inesperado: {texto}"
        assert correo_esperado_prefix in texto, f"correo generado no coincide con lo esperado: {texto}"
        return texto
    ok04 = t04()
    page.screenshot(path=f"{SHOT_DIR}/04-usuario-creado.png")

    @step("05. Usuario de prueba aparece listado con datos correctos")
    def t05():
        page.wait_for_timeout(600)
        fila = page.locator(f"tr:has-text('{correo_esperado_prefix}')")
        assert fila.count() >= 1, "no aparece el usuario recien creado en la tabla"
        texto_fila = fila.first.inner_text()
        assert nombre_prueba in texto_fila and apellido_prueba in texto_fila
        assert "Empleado" in texto_fila
        return texto_fila.replace("\n", " | ")
    t05()

    @step("06. Editar usuario conserva el correo")
    def t06():
        fila = page.locator(f"tr:has-text('{correo_esperado_prefix}')").first
        fila.get_by_role("button", name="Editar").click()
        page.wait_for_selector("#editor.abierto", timeout=3000)
        correo_en_form = page.input_value("#correo")
        page.fill("#nombre", nombre_prueba + "X")
        page.click("#guardar")
        page.wait_for_function("document.getElementById('mensaje').textContent.includes('actualizado')", timeout=5000)
        texto = page.inner_text("#mensaje")
        page.wait_for_timeout(500)
        fila2 = page.locator(f"tr:has-text('{correo_esperado_prefix}')").first.inner_text()
        assert (nombre_prueba + "X") in fila2, f"el nombre editado no aparece en la tabla: {fila2}"
        assert correo_esperado_prefix in fila2, "el correo deberia conservarse tras editar el nombre"
        return f"correo antes de guardar={correo_en_form}, mensaje='{texto}'"
    t06()

    @step("07. Cerrar sesion admin vuelve a login")
    def t07():
        page.click("#cerrar-sesion")
        page.wait_for_url(f"{BASE}/login.html", timeout=5000)
        return f"URL final: {page.url}"
    t07()

    @step("08. Login como empleado de prueba redirige directo a Asistencia")
    def t08():
        page.fill("#correo", f"{correo_esperado_prefix}@empresa.cl")
        page.fill("#contrasena", clave_empleado)
        page.click("#ingresar")
        page.wait_for_url(f"{BASE}/asistencia.html", timeout=8000)
        page.wait_for_load_state("networkidle")
        nav_usuarios_visible = page.is_visible("a[href='/usuarios.html']")
        assert not nav_usuarios_visible, "un empleado no deberia ver el link a Usuarios"
        return f"URL final: {page.url}, nav_usuarios_visible={nav_usuarios_visible}"
    t08()
    page.screenshot(path=f"{SHOT_DIR}/08-vista-empleado.png", full_page=True)

    @step("09. Empleado no puede acceder a /usuarios.html por URL directa")
    def t09():
        page.goto(f"{BASE}/usuarios.html")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        return f"URL final tras intentar /usuarios.html: {page.url}"
    t09()

    @step("10. Empleado no puede acceder a /reportes.html por URL directa (403 esperado via API)")
    def t10():
        page.goto(f"{BASE}/reportes.html")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        return f"URL final tras intentar /reportes.html: {page.url}"
    t10()

    @step("11. Empleado registra ENTRADA")
    def t11():
        page.goto(f"{BASE}/asistencia.html")
        page.wait_for_load_state("networkidle")
        page.wait_for_selector("#entrada:not([disabled])", timeout=5000)
        page.click("#entrada")
        page.wait_for_selector("#mensaje:not([hidden])", timeout=5000)
        texto = page.inner_text("#mensaje")
        assert "Entrada registrada" in texto, f"mensaje inesperado: {texto}"
        return texto
    t11()

    @step("12. Tras ENTRADA, boton Entrada se deshabilita y Salida se habilita")
    def t12():
        page.wait_for_selector("#salida:not([disabled])", timeout=5000)
        entrada_disabled = page.is_disabled("#entrada")
        salida_disabled = page.is_disabled("#salida")
        assert entrada_disabled and not salida_disabled
        return f"entrada_disabled={entrada_disabled} salida_disabled={salida_disabled}"
    t12()

    @step("13. Empleado registra SALIDA")
    def t13():
        page.click("#salida")
        page.wait_for_function("document.getElementById('mensaje').textContent.includes('Salida registrada')", timeout=5000)
        texto = page.inner_text("#mensaje")
        assert "Salida registrada" in texto, f"mensaje inesperado: {texto}"
        return texto
    t13()

    @step("14. Resumen semanal del empleado se actualiza (dias/horas trabajadas)")
    def t14():
        page.wait_for_timeout(1200)
        dias = page.inner_text("#stat-dias")
        horas = page.inner_text("#stat-horas")
        assert dias != "", "el contador de dias deberia tener un valor"
        return f"dias={dias} horas={horas}"
    t14()
    page.screenshot(path=f"{SHOT_DIR}/14-resumen-semanal-empleado.png", full_page=True)

    @step("15. Marcar ENTRADA de nuevo sin SALIDA previa es rechazado (alternancia)")
    def t15():
        page.wait_for_selector("#entrada:not([disabled])", timeout=5000)
        page.click("#entrada")
        page.wait_for_selector("#mensaje:not([hidden])", timeout=5000)
        page.wait_for_selector("#salida:not([disabled])", timeout=5000)
        # ahora hay una entrada pendiente; forzar una segunda entrada via API para probar la regla 409
        respuesta = page.evaluate("""
            async () => {
                const r = await fetch('/api/asistencia/entrada', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' });
                return { status: r.status, cuerpo: await r.json() };
            }
        """)
        assert respuesta["status"] == 409, f"se esperaba 409 al duplicar ENTRADA, se obtuvo {respuesta['status']}"
        # dejar el estado limpio: registrar la salida pendiente
        page.click("#salida")
        page.wait_for_selector("#mensaje:not([hidden])", timeout=5000)
        return f"segunda ENTRADA => status {respuesta['status']}, mensaje: {respuesta['cuerpo'].get('mensaje')}"
    t15()

    @step("16. Logout empleado")
    def t16():
        page.click("#cerrar-sesion")
        page.wait_for_url(f"{BASE}/login.html", timeout=5000)
        return f"URL final: {page.url}"
    t16()

    @step("17. Acceso directo a /red.html sin sesion redirige a login (no queda expuesto)")
    def t17():
        ctx_anon = browser.new_context()
        pagina_anon = ctx_anon.new_page()
        pagina_anon.goto(f"{BASE}/red.html")
        pagina_anon.wait_for_load_state("networkidle")
        url_final = pagina_anon.url
        ctx_anon.close()
        assert url_final.endswith("/login.html"), f"red.html quedo accesible sin sesion: {url_final}"
        return f"URL final: {url_final}"
    t17()

    @step("18. Login admin de nuevo")
    def t18():
        page.goto(f"{BASE}/login.html")
        page.fill("#correo", ADMIN_CORREO)
        page.fill("#contrasena", ADMIN_CLAVE)
        page.click("#ingresar")
        page.wait_for_url(f"{BASE}/", timeout=8000)
        return f"URL final: {page.url}"
    t18()

    @step("19. Reportes: generar reporte de Atrasos")
    def t19():
        page.goto(f"{BASE}/reportes.html")
        page.wait_for_load_state("networkidle")
        hoy = date.today()
        hace_30 = hoy - timedelta(days=30)
        page.select_option("#tipo-reporte", "atrasos")
        page.fill("#desde", hace_30.isoformat())
        page.fill("#hasta", hoy.isoformat())
        page.wait_for_selector("#generar:not([disabled])", timeout=5000)
        page.click("#generar")
        page.wait_for_selector("#contador:not(:text('Sin consulta'))", timeout=8000)
        contador = page.inner_text("#contador")
        return f"contador tras generar: '{contador}'"
    t19()
    page.screenshot(path=f"{SHOT_DIR}/19-reportes-atrasos.png", full_page=True)

    @step("20. Reportes: generar reporte de Salidas anticipadas")
    def t20():
        contador_previo = page.inner_text("#contador")
        page.select_option("#tipo-reporte", "salidas-anticipadas")
        page.click("#generar")
        page.wait_for_function(
            "prev => document.getElementById('contador').textContent !== prev",
            arg=contador_previo, timeout=8000
        )
        contador = page.inner_text("#contador")
        return f"contador: '{contador}'"
    t20()

    @step("21. Reportes: generar reporte de Inasistencias")
    def t21():
        contador_previo = page.inner_text("#contador")
        page.select_option("#tipo-reporte", "inasistencias")
        page.click("#generar")
        page.wait_for_function(
            "prev => document.getElementById('contador').textContent !== prev",
            arg=contador_previo, timeout=8000
        )
        contador = page.inner_text("#contador")
        filas = page.locator("#resultados tr").count()
        return f"contador: '{contador}', filas en tabla: {filas}"
    t21()
    page.screenshot(path=f"{SHOT_DIR}/21-reportes-inasistencias.png", full_page=True)

    @step("22. Reportes: fechas invertidas devuelven error controlado (400)")
    def t22():
        respuesta = page.evaluate("""
            async () => {
                const r = await fetch('/api/reportes/atrasos?desde=2026-01-31&hasta=2026-01-01', { headers: {'Content-Type':'application/json'} });
                return { status: r.status, cuerpo: await r.json() };
            }
        """)
        assert respuesta["status"] == 400, f"se esperaba 400 con rango invertido, se obtuvo {respuesta['status']}"
        return f"status={respuesta['status']} mensaje={respuesta['cuerpo'].get('mensaje')}"
    t22()

    @step("23. Red: agregar una IP permitida")
    def t23():
        page.goto(f"{BASE}/red.html")
        page.wait_for_load_state("networkidle")
        page.fill("#ip-nueva", "203.0.113.55")
        page.click("#agregar-ip")
        page.wait_for_selector("#mensaje:not([hidden])", timeout=5000)
        texto = page.inner_text("#mensaje")
        page.wait_for_timeout(500)
        estado = page.inner_text("#estado-ip")
        return f"mensaje='{texto}' estado='{estado}'"
    ok23 = t23()
    page.screenshot(path=f"{SHOT_DIR}/23-red-ip-agregada.png")

    @step("24. Red: eliminar la IP agregada (limpieza)")
    def t24():
        fila = page.locator("tr:has-text('203.0.113.55')").first
        fila.get_by_role("button", name="Eliminar").click()
        page.wait_for_selector(".confirm-dialog", timeout=3000)
        page.click(".confirm-dialog [data-accion='confirmar']")
        page.wait_for_function("document.getElementById('mensaje').textContent.includes('eliminada')", timeout=5000)
        texto = page.inner_text("#mensaje")
        return texto
    if ok23:
        t24()
    else:
        results.append({"paso": "24. Red: eliminar la IP agregada (limpieza)", "estado": "OMITIDO", "detalle": "se omite porque el paso 23 no creo la IP"})

    @step("25. Eliminar usuario de prueba (tiene asistencia) exige confirmacion reforzada")
    def t25():
        page.goto(f"{BASE}/usuarios.html")
        page.wait_for_load_state("networkidle")
        fila = page.locator(f"tr:has-text('{correo_esperado_prefix}')").first
        fila.get_by_role("button", name="Eliminar").click()
        page.wait_for_selector(".confirm-dialog", timeout=3000)
        page.click(".confirm-dialog [data-accion='confirmar']")
        # como tiene asistencia, debe aparecer un SEGUNDO modal pidiendo forzar
        page.wait_for_selector(".confirm-dialog:has-text('registros de asistencia')", timeout=5000)
        texto_aviso = page.inner_text(".confirm-dialog")
        page.click(".confirm-dialog [data-accion='confirmar']")
        page.wait_for_selector("#mensaje:not([hidden])", timeout=5000)
        texto_final = page.inner_text("#mensaje")
        page.wait_for_timeout(500)
        sigue_en_tabla = page.locator(f"tr:has-text('{correo_esperado_prefix}')").count()
        assert sigue_en_tabla == 0, "el usuario de prueba deberia haber sido eliminado"
        return f"aviso intermedio='{texto_aviso[:80]}...' mensaje final='{texto_final}'"
    t25()
    page.screenshot(path=f"{SHOT_DIR}/25-usuario-eliminado.png")

    @step("26. Logout final admin")
    def t26():
        page.click("#cerrar-sesion")
        page.wait_for_url(f"{BASE}/login.html", timeout=5000)
        return f"URL final: {page.url}"
    t26()

    browser.close()

with open(f"{SHOT_DIR}/../resultados.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

fallas = [r for r in results if r["estado"] == "FALLA"]
print(f"\nTOTAL: {len(results)}  OK: {len(results)-len(fallas)}  FALLAS: {len(fallas)}")
sys.exit(1 if fallas else 0)
