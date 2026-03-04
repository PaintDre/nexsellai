

# Nexsell — SaaS de Landings para Dropshipping (Chile)

## Visión General
Plataforma donde dropshippers crean productos, generan landing pages optimizadas con IA (OpenAI), las editan por bloques y las exportan como HTML listo para Shopify u hosting propio. Monetización con 3 planes y pagos via Mercado Pago.

---

## 1. Autenticación y Onboarding
- Registro/login con email y contraseña via Supabase Auth
- Tabla de perfiles con plan actual (free por defecto)
- Pantalla de bienvenida breve al primer login

## 2. Dashboard Principal
- Vista de productos creados (cards con imagen, nombre, categoría)
- Contador de landings usadas vs. límite del plan
- Acceso rápido a crear producto o ver landings generadas

## 3. Crear/Editar Producto
- Formulario: nombre, categoría (Home/Fitness/Beauty/Gadget), precio en CLP (prefijo $), público objetivo, descripción opcional
- Upload de 1 a 4 imágenes (mínimo 1 requerida) usando Supabase Storage
- Edición posterior del producto

## 4. Generación de Landing con IA
- Seleccionar producto → configurar: modo (AIDA / Standard), intensidad (soft/medium/hard), oferta (sí/no), garantía editable
- **Plan Free**: genera 1 solo ángulo, 1 hook, sin bloques de objeciones/urgencia/bundles/upsell
- **Starter**: 3 hooks, objeciones básicas, urgencia editable, FAQs
- **Pro**: múltiples ángulos psicológicos, hooks para ads, variantes CTA, bundles, comparativa, microcopys checkout, versión corta
- Edge function llama OpenAI (API key del usuario guardada como secret) y retorna JSON de bloques estructurados
- Landing guardada en tabla `landings` con historial por usuario

## 5. Editor de Landing
- Vista de bloques apilados (hero, beneficios, testimonios, CTA, etc.)
- Click en bloque → editar texto inline
- Drag & drop para reordenar bloques
- Preview en vivo de la landing

## 6. Exportación
- **Landing completa**: descarga ZIP con `index.html`, `styles.css`, carpeta `/images` — sin JavaScript
- **Bloque individual**: descarga `bloque.html` + `bloque.css` con CSS namespaced para insertar en cualquier página

## 7. Planes y Pagos (Mercado Pago)
| Plan | Precio | Landings | Features |
|------|--------|----------|----------|
| **Free** | $0 | 1 total | 1 ángulo, 1 hook, export HTML básico |
| **Starter** | $7.990/mes | 10/mes | 3 hooks, objeciones, urgencia, FAQs |
| **Pro** | $14.990/mes | Ilimitadas | Todo: múltiples ángulos, bundles, comparativa, microcopys |

- Página de pricing con los 3 planes
- Integración Mercado Pago checkout para suscripciones mensuales
- Edge function para webhook de Mercado Pago que actualiza el plan del usuario
- Bloqueo de funcionalidades según plan (enforced en backend)

## 8. Páginas y Navegación
- `/login` y `/register` — autenticación
- `/dashboard` — productos y landings
- `/products/new` y `/products/:id/edit` — CRUD producto
- `/products/:id/generate` — configurar y generar landing
- `/landings/:id/edit` — editor de bloques
- `/pricing` — planes y checkout
- `/settings` — API key de OpenAI, datos de cuenta

