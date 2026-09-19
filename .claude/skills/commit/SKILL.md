---
name: commit
description: Crea un commit en este repo con el formato estándar del equipo (Tipo de cambio / Resumen / Cambios clave / Cómo probarlo / Notas para el reviewer), usando siempre la identidad xmartinalarx@gmail.com.
---

# Commit con formato estándar

Este repositorio usa un formato fijo de mensaje de commit y una identidad de git fija. Al invocar `/commit [descripción opcional]`, sigue estos pasos:

## 1. Identidad

Confirma (no cambies si ya está bien) que la identidad local del repo sea:

```
git config user.name   # debe ser: Martin Bernabe Alarcon Contreras
git config user.email  # debe ser: xmartinalarx@gmail.com
```

Si no coincide, corrígela con `git config user.name` / `git config user.email` (sin `--global`, solo local a este repo).

## 2. Revisar cambios

Ejecuta `git status` y `git diff` (staged y unstaged) para entender qué cambió realmente. Si el usuario pasó una descripción como argumento, úsala como contexto adicional, pero el mensaje debe reflejar el diff real, nunca contenido inventado o de otro proyecto.

Si entre los archivos modificados o sin trackear hay algo que podría contener secretos (`.env`, credenciales, dumps de base de datos, llaves, tokens, o cualquier archivo con datos que no deberían subirse), avisa al usuario antes de agregarlo — no asumas que hay que commitearlo solo porque aparece en `git status`.

## 3. Redactar el mensaje

Usa exactamente esta estructura (omite una sección solo si genuinamente no aplica, ej. "Cómo probarlo" si no hay nada verificable):

```
<tipo>(<alcance>): <resumen corto en una línea>

Resumen
<qué cambió y por qué, 2-4 líneas>

Cambios clave
- <archivo o módulo>: <qué se hizo>
- <archivo o módulo>: <qué se hizo>

Cómo probarlo
- <pasos o verificación concreta>

Notas para el reviewer
- <aclaraciones, decisiones no obvias, o "Ninguna">
```

`<tipo>` sigue Conventional Commits (`fix`, `feat`, `refactor`, `docs`, `chore`, `test`). `<alcance>` es el módulo o área tocada (ej. `readme`, `auth`, `reportes`).

### Caso especial: commits en la rama `TESTING`

Si la rama activa es `TESTING` (ver `refs/heads/TESTING` — en Windows `git branch --show-current` es más confiable que `git log TESTING` por el choque de nombre con la carpeta `testing/`):

- Antes de commitear, revisa si `main` avanzó desde que `TESTING` se actualizó por última vez (`git log main..TESTING` y `git log TESTING..main`). Si `main` tiene commits nuevos, tráelos a `TESTING` (merge o rebase) **antes** de agregar el commit de testing, para que la única diferencia entre ambas ramas siga siendo la carpeta `testing/`, nunca el código.
- El mensaje agrega una sección `Resultado` (después de "Cambios clave", antes de "Cómo probarlo") con las cifras reales de la corrida, nunca una descripción vaga:

  ```
  Resultado
  - Jest: <X>/<Y> pruebas OK
  - Playwright E2E: <X>/<Y> pasos OK (si hubo fallas: cuáles y si se corrigieron o quedan pendientes)
  ```

  Si algo falló y no se corrigió, se declara igual, no se omite ni se maquilla.
- `TESTING` nunca se mergea de vuelta a `main`.

## 4. Confirmar antes de commitear

Muestra el mensaje propuesto al usuario y espera confirmación antes de ejecutar `git commit`, salvo que el usuario ya haya pedido explícitamente "hazlo sin preguntar" en este turno.

## 5. Commitear y subir

Haz `git add` solo de los archivos relevantes (nunca `git add -A` a ciegas), crea el commit y luego haz **siempre** `git push` de la rama activa a **ambos** remotos configurados (`hostinger` y `origin`) a continuación (no esperes una confirmación aparte para el push; ya está autorizado como parte de este flujo).

Nunca uses `--force`, `--no-verify`, ni saltes hooks para lograr que el push pase. Si el push es rechazado (rama divergida) en cualquiera de los dos remotos, no fuerces nada: investiga primero con `git fetch <remoto>` y `git log` (local vs. `<remoto>/<rama>`) para entender qué cambió del lado remoto, y decide con esa información cómo seguir (por ejemplo, `git pull --rebase` o avisar al usuario si hay un conflicto real).

## 6. Responder al usuario

Una vez que el push termine, obtén el hash del commit (`git log -1 --format=%H`) y la URL de cada remoto al que se subió con `git remote get-url <remoto>` (no la asumas ni la hardcodees). Si esa URL trae un usuario embebido (`https://usuario@github.com/...`, usado para evitar el selector de cuentas de Git Credential Manager), quítalo antes de mostrarlo — el link final debe verse como `https://github.com/<owner>/<repo>/commit/<hash>`, sin credenciales ni `.git` al final. Como el hash es el mismo en ambos repos, muestra los dos links (uno por remoto) dentro de la misma caja de resultado en vez de repetir todo el bloque.

Para la segunda caja no repitas la lista de archivos con su estado (eso ya lo dice git); resume en 1-3 líneas cortas **qué se hizo**, en lenguaje simple — básicamente la sección "Cambios clave" del mensaje de commit pero condensada, no copiada tal cual.

Responde usando exactamente este formato, sin texto adicional antes o después:

```
-----------------------------------------------------------
                     Push Hecho
            <URL del commit>
-----------------------------------------------------------
<resumen corto de qué se hizo, 1-3 líneas>
-----------------------------------------------------------
```

Si el flujo hizo varios commits en una sola invocación (por ejemplo, se agruparon cambios de temas distintos), repite el bloque completo (las dos cajas) una vez por cada commit, en el orden en que se crearon.
