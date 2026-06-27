# Plan: Cambiar de enlace mágico a código alfanumérico

## Flujo actual

1. Usuario ingresa email en `/login`
2. Backend genera token hex de 64 caracteres, lo hashea con SHA-256, guarda el hash
3. Email enviado con un enlace: `{origin}/api/auth/verify?token=...`
4. Frontend muestra "Revisa tu correo" (no hay más interacción)
5. Usuario hace clic en el enlace → GET `/api/auth/verify?token=...`
6. Backend verifica, firma cookie de sesión, redirige a `/`

## Nuevo flujo

1. Usuario ingresa email en `/login`
2. Backend genera código alfanumérico de 8 caracteres, lo hashea con SHA-256, guarda el hash
3. Email enviado con el código (sin enlace)
4. Frontend muestra formulario para pegar el código
5. Usuario copia/pega el código y hace clic en "Verificar"
6. Frontend hace POST `/api/auth/verify` con `{ "code": "..." }`
7. Backend verifica, firma cookie de sesión, devuelve JSON con usuario
8. Frontend redirige a `/`

---

## Cambios en backend (4 archivos)

### 1. `domain/user/types.go` — Nuevo tipo de request

Agregar `VerifyCodeRequest`:

```go
type VerifyCodeRequest struct {
    Code string `json:"code" binding:"required"`
}
```

### 2. `domain/user/service.go` — Generar código legible + nuevo body de email

**`RequestLogin`:**
- Cambiar generación de token: usar `crypto/rand.Int` con charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excluye 0/O/1/I/L para evitar confusiones al leer/escribir).
- 8 caracteres de largo → ~40 bits de entropía. Con rate-limit de 2 min por email es suficiente.
- Normalizar con `strings.ToUpper()`.
- Hash SHA-256 se mantiene igual (el store no cambia).
- Cambiar subject de email a `"Tu código de acceso para My Garden"`.
- Body del email con el código en vez del enlace.
- Opcional: eliminar campo `Link` de `SendLinkResult`.

### 3. `domain/user/controller.go` — Verify via POST, no GET

- Cambiar `Verify`: de `c.Query("token")` a `c.ShouldBindJSON(&req)` usando `VerifyCodeRequest`.
- En vez de `c.Redirect(...)`, devolver `c.JSON(http.StatusOK, result.User)`.
- El frontend maneja la redirección.

### 4. `internal/server/router.go` — Actualizar ruta

- `api.GET("/auth/verify", ...)` → `api.POST("/auth/verify", ...)`

---

## Cambios en frontend (2 archivos)

### 5. `frontend/src/auth/AuthContext.tsx` — Nueva función `verifyCode`

Agregar al contexto:
- `verifyCode: (code: string) => Promise<void>`
- Hace `POST /api/auth/verify` con `{ code }`.
- En éxito, llama a `setUser(data)`.

### 6. `frontend/src/ui/pages/Login.tsx` — Formulario de verificación de código

Cuando `sent === true`, en vez de solo texto, mostrar:
1. "Te hemos enviado un código a **{email}**"
2. Input de texto (autofocus, transform a uppercase automáticamente, placeholder "Ej: A3K9M2X7")
3. Botón "Verificar código"
4. Estado de error (código inválido/expirado)
5. Link "Volver" para cambiar email

Al verificar exitosamente, navegar a `/` con `useNavigate()`.

---

## Archivos que NO cambian

| Archivo | Razón |
|---|---|
| `domain/user/store.go` | El hash SHA-256 sigue igual, consultas no cambian |
| `internal/email/sender.go` | Interfaz `Mailer` no cambia; `ConsoleMailer` printa el código en stdout (útil en dev) |
| Schema DB (`auth_tokens`) | Sigue almacenando `token_hash`, no necesita migración |
| `frontend/src/router/routes.ts` | No se agregan rutas nuevas; sigue siendo `/login` |

---

## Consideraciones

- **Seguridad**: 8 caracteres × charset de 32 = ~40 bits. Con rate-limit y expiración de 15 min, es adecuado para este sistema.
- **Dev UX**: `ConsoleMailer` imprime el código en stdout (antes imprimía el link). El API ya no devuelve el código en la respuesta.
- **Sin backward compatibility**: La ruta `/api/auth/verify` cambia de GET a POST. No hay clientes externos.
