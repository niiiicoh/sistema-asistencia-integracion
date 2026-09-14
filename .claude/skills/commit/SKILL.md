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

## 4. Confirmar antes de commitear

Muestra el mensaje propuesto al usuario y espera confirmación antes de ejecutar `git commit`, salvo que el usuario ya haya pedido explícitamente "hazlo sin preguntar" en este turno.

## 5. Commitear y subir

Haz `git add` solo de los archivos relevantes (nunca `git add -A` a ciegas), crea el commit y luego haz **siempre** `git push origin main` a continuación (no esperes una confirmación aparte para el push; ya está autorizado como parte de este flujo).

Nunca uses `--force`, `--no-verify`, ni saltes hooks para lograr que el push pase. Si el push es rechazado (rama divergida), no fuerces nada: investiga primero con `git fetch origin` y `git log` (local vs. `origin/main`) para entender qué cambió del lado remoto, y decide con esa información cómo seguir (por ejemplo, `git pull --rebase` o avisar al usuario si hay un conflicto real).

## 6. Responder al usuario

Una vez que el push termine, obtén el hash del commit (`git log -1 --format=%H`) y la URL del remoto con `git remote get-url origin` (no la asumas ni la hardcodees). Si esa URL trae un usuario embebido (`https://usuario@github.com/...`, usado para evitar el selector de cuentas de Git Credential Manager), quítalo antes de mostrarlo — el link final debe verse como `https://github.com/<owner>/<repo>/commit/<hash>`, sin credenciales ni `.git` al final.

También obtén la lista de archivos incluidos en el commit (`git show --stat --format= HEAD` o `git diff-tree --no-commit-id --name-status -r HEAD`) para listarlos en la segunda caja.

Responde usando exactamente este formato, sin texto adicional antes o después:

```
-----------------------------------------------------------
                     Push Hecho
            <URL del commit>
-----------------------------------------------------------
<archivo o carpeta 1>: <agregado/modificado/eliminado>
<archivo o carpeta 2>: <agregado/modificado/eliminado>
-----------------------------------------------------------
```

Si el flujo hizo varios commits en una sola invocación (por ejemplo, se agruparon cambios de temas distintos), repite el bloque completo (las dos cajas) una vez por cada commit, en el orden en que se crearon.
