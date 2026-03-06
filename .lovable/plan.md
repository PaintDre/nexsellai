

# Auditoría UX/UI Completa — Nexsell

## Resumen Ejecutivo

Nexsell tiene una base sólida: la landing page pública está bien estructurada como embudo de conversión, la autenticación es clara, y el sistema de diseño (Tailwind + shadcn/ui) proporciona consistencia base. Sin embargo, hay varias oportunidades para elevar la percepción de profesionalismo y mejorar flujos clave.

**Score general: 6.5/10** — Funcional y correcto, pero con oportunidades claras para pasar de "app funcional" a "SaaS profesional y confiable".

---

## 1. Jerarquía Visual

**Lo que funciona:**
- Landing page tiene buena jerarquía con H1 prominente, badge contextual, y subtítulo claro
- Uso consistente de `font-display` (Space Grotesk) para headings vs `font-sans` (Inter) para body

**Problemas:**
- **Dashboard**: Las 4 stat cards tienen el mismo peso visual. No hay diferenciación entre métricas primarias (landings usadas) y secundarias (plan actual)
- **Páginas internas**: Todas las páginas comienzan con H1 + contenido plano. No hay breadcrumbs ni contexto de navegación
- **Landings list**: Las landing cards tienen demasiada información comprimida — 2 badges + fecha + 5 botones en un espacio reducido. La jerarquía de acciones se pierde

---

## 2. Espaciado y Layout

**Lo que funciona:**
- Padding responsivo consistente (`p-4 md:p-6 lg:p-8`)
- Grids adaptativos correctos

**Problemas:**
- **ProductForm**: `max-w-2xl` sin centrar (`mx-auto` ausente). El formulario queda pegado a la izquierda en pantallas grandes
- **GenerateLanding**: Mismo problema, `max-w-2xl` sin centrar
- **SettingsPage**: Mismo problema
- **Dashboard**: Las secciones "Landings Recientes" y "Actividad Reciente" están al mismo nivel visual. Falta separación jerárquica
- **Landing page pública**: El formulario demo tiene mucho padding interno pero las secciones previas son más compactas, generando inconsistencia rítmica

---

## 3. Claridad de Navegación

**Lo que funciona:**
- Sidebar con iconos + labels claros
- Mobile sheet sidebar funcional
- Tablet collapsed mode

**Problemas:**
- **No hay breadcrumbs**: En flujos profundos (Producto → Generar Landing → Editor), el usuario pierde contexto. Solo hay un botón "Volver" genérico con `navigate(-1)` que puede llevar a rutas inesperadas
- **Sidebar no indica submódulos**: Admin y Sistema aparecen al mismo nivel que Productos y Landings
- **No hay header en páginas internas**: No hay título persistente que confirme dónde está el usuario
- **ProductDetail page**: No está visible en el código proporcionado, pero es una ruta existente que conecta productos con sus landings y banners

---

## 4. Consistencia entre Componentes

**Problemas encontrados:**
- **Categorías sin traducir**: En ProductForm y el formulario demo, las categorías se muestran como `home`, `fitness`, `beauty`, `gadget`, `pets` (inglés) mientras que en Onboarding se usan labels traducidos (`Hogar`, `Fitness`, `Belleza`, `Gadgets`, `Mascotas`). Inconsistencia directa
- **Botones de acción**: En Products, los botones son `sm` con `min-h-[44px]`. En Landings, también `sm` con `min-h-[44px]` pero con textos más largos. El resultado visual es inconsistente
- **Cards de landing**: Usan preview con gradiente e imagen, mientras que cards de producto usan `aspect-video` con imagen completa. Estilos diferentes para conceptos similares
- **Toast vs Sonner**: El proyecto importa ambos sistemas de notificación. Login usa `useToast`, Pricing usa `toast` de sonner. Duplicación innecesaria

---

## 5. Experiencia del Usuario en Flujos Clave

### Flujo: Registro → Onboarding → Primera Landing
- **Bien**: El onboarding es claro, con stepper visual y loading state animado
- **Problema**: El onboarding solo permite 1 imagen. El formulario normal permite 4. Inconsistencia que confunde

### Flujo: Crear Producto → Generar Landing
- **Problema**: Después de crear un producto, el usuario va a ProductDetail. Desde ahí debe encontrar el botón "Generar Landing". No hay sugerencia automática ni CTA prominente post-creación
- **Problema**: GenerateLanding tiene demasiadas opciones para un usuario nuevo (plantilla, intensidad, oferta, tema, imágenes IA, garantía). Falta una opción "Generar rápido" con defaults

### Flujo: Gestión de Banners
- **Bien**: Filtros, selección múltiple, vista por producto
- **Problema**: Para generar un nuevo banner hay que seleccionar un producto del diálogo, ir a otra página, configurar, generar. Es un flujo de 4 pasos para algo que debería ser más directo

---

## 6. Diseño de Formularios

**Lo que funciona:**
- Labels claros, placeholders descriptivos
- Touch targets de 44px mínimo
- Indicadores de campos obligatorios con `*`

**Problemas:**
- **Sin validación en tiempo real**: Los formularios solo validan al submit. No hay feedback mientras el usuario escribe (longitud de contraseña, formato de email, etc.)
- **Sin password strength indicator**: En registro, el usuario no sabe si su contraseña es segura
- **Input de precio**: No tiene formato automático (puntos de miles). El usuario ve `19990` en vez de `19.990`

---

## 7. Dashboard y Organización de Módulos

**Problemas:**
- **Dashboard es solo lectura**: Muestra stats y listas pero no ofrece acciones rápidas contextuales. Las landing cards solo tienen "Ver", no "Editar" o "Exportar"
- **La sección "Actividad Reciente" es poco útil**: Solo muestra versiones de landings con números. No comunica valor (ej: "Editaste el hero de X" sería más útil)
- **No hay onboarding progress**: Si el usuario tiene 0 banners, el dashboard no lo guía a crear uno
- **Las 4 stat cards ocupan la franja más premium** pero 2 de ellas (Banners Usados, Plan Actual) son secundarias para la mayoría de usuarios

---

## 8. Estados Vacíos, Errores y Loading

**Lo que funciona:**
- Todos los listados tienen empty states con CTA
- Loading spinners en acciones asíncronas
- Progress bars en generación

**Problemas:**
- **Suspense fallback es `null`**: Cuando las páginas cargan lazy, el usuario ve una pantalla en blanco. Debería haber un skeleton o spinner global
- **NotFound es genérico**: Un simple "404" centrado sin la marca ni navegación. Se siente como un error del sistema, no una página diseñada
- **No hay skeleton loading**: Las listas de productos, landings y banners van de vacío a lleno sin transición
- **Errores de toast desaparecen rápido**: Los mensajes de error se muestran como toasts temporales. Para errores críticos (fallo de generación, error de pago) debería haber feedback más persistente

---

## 9. Uso de Color, Contraste y Tipografía

**Lo que funciona:**
- Paleta coherente: verde primario (`152 60% 36%`) con neutros fríos
- Dark mode definido pero aparentemente no habilitado/toggle visible
- Sidebar oscura con buen contraste

**Problemas:**
- **Logo `logo-ns.png` es 512x512 pero se muestra a 32x32**: Lighthouse lo flagea como recurso oversized (39KB desperdiciados). Necesita una versión optimizada
- **El accent color (`165 82% 51%`) es muy cercano al primary**: No genera contraste suficiente para diferenciar elementos accent vs primary
- **Badge "Más popular"** en pricing usa el mismo verde primary que los CTAs. Se pierde en la jerarquía visual
- **No hay dark mode toggle visible**: Las variables CSS dark existen pero no hay forma de activarlo

---

## 10. Sensación de Producto: Profesional vs Amateur

**Indicadores de profesionalismo:**
- Landing page bien estructurada con social proof (galería de banners)
- Onboarding con animaciones y progress
- Exportación funcional
- Flujo de pago con MercadoPago integrado

**Indicadores de amateurismo:**
- No hay favicon personalizado visible en la barra del navegador (existe pero podría no estar configurado correctamente)
- Footer de la landing es muy simple (solo 3 links). Falta: términos, privacidad, social media
- No hay testimonios reales ni métricas de uso
- La sección de soporte en Settings solo tiene un `mailto:`. No hay centro de ayuda, documentación, ni chat
- No hay animaciones de transición entre páginas

---

## Plan de Mejoras Propuesto

### Prioridad Alta (Impacto inmediato en percepción)

1. **Centrar formularios internos** — Agregar `mx-auto` a ProductForm, GenerateLanding, SettingsPage
2. **Unificar categorías** — Usar labels traducidos en todos los formularios
3. **Unificar sistema de notificaciones** — Elegir uno entre toast y sonner, eliminar el otro
4. **Agregar Suspense fallback global** — Skeleton/spinner en vez de pantalla blanca
5. **Optimizar logo** — Crear versión de 64x64 para uso en UI

### Prioridad Media (Mejora de flujos)

6. **Agregar breadcrumbs** en páginas internas con contexto de navegación
7. **Simplificar GenerateLanding** — Agregar modo "Generación rápida" con 1 clic usando defaults
8. **Mejorar Dashboard** — Reordenar stat cards por relevancia, agregar acciones rápidas a las landing cards, y agregar guía contextual cuando hay 0 items
9. **Skeleton loading** para listados de productos, landings y banners
10. **Mejorar NotFound** — Agregar branding, sidebar/nav, y sugerencias de navegación

### Prioridad Baja (Polish profesional)

11. **Agregar dark mode toggle** en sidebar o settings
12. **Mejorar footer** de landing con links legales y redes sociales
13. **Formato de precios** con puntos de miles en inputs
14. **Animaciones de transición** entre páginas (fade-in suave)
15. **Password strength indicator** en registro

