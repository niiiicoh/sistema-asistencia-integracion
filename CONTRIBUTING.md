# Guía de contribución

## Identidad de git

Cada colaborador debe configurar su propio nombre y correo **local a este repo** (no global), para que los commits queden atribuidos a su propia cuenta de GitHub:

```bash
git config user.name "Tu Nombre"
git config user.email "tu-correo-de-github@ejemplo.com"
```

## Formato de los commits

Todos los commits siguen esta estructura:

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

Se puede omitir una sección solo si genuinamente no aplica (por ejemplo, "Cómo probarlo" en un cambio que no es verificable en ejecución).

### Tipos permitidos (Conventional Commits)

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un error |
| `refactor` | Cambio de código sin alterar comportamiento |
| `docs` | Cambios solo de documentación |
| `test` | Agregar o modificar pruebas |
| `chore` | Tareas de mantenimiento (dependencias, configuración, etc.) |

El `<alcance>` es el módulo o área tocada (ej. `readme`, `auth`, `reportes`, `usuarios`).

### Ejemplo

```
fix(readme): corregir codificacion del README

Resumen
El README tenia lineas finales en una codificacion distinta al resto
del archivo, lo que rompia su renderizado en GitHub.

Cambios clave
- README.md: eliminadas las lineas problematicas y reconvertido el
  archivo completo a UTF-8.

Como probarlo
- Ver el archivo en GitHub: debe renderizar como Markdown normal.

Notas para el reviewer
- Ninguna.
```

## Uso de Claude Code (opcional)

Si usas Claude Code, este repo incluye el skill `/commit` (`.claude/skills/commit/`), que arma el mensaje en este formato a partir de los cambios reales y confirma contigo antes de crear el commit.

