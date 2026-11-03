# PhysioMotion · Prototipo web

Prototipo funcional de **PhysioMotion**, una plataforma de ejercicios de fisioterapia guiados para adultos mayores, con meditación y seguimiento de progreso.

**Demo en vivo:** `https://TU-USUARIO.github.io/physiomotion/` *(reemplaza TU-USUARIO por tu usuario de GitHub)*

## Pantallas

| # | Pantalla | Qué hace |
|---|----------|----------|
| 1 | Bienvenida | Pide el apodo del usuario para iniciar. |
| 2 | Cuestionario | 5 preguntas, una por pantalla, con barra de progreso. Define el plan, el nivel de dolor y la meta diaria. |
| 3 | Inicio | Muestra el plan personalizado y el camino de 3 niveles (los niveles se desbloquean en orden). |
| 4 | Ejercicio | Contador guiado de repeticiones con pausa, barra de progreso y opción de saltar. |
| 5 | Nivel completado | Celebración y suma de XP (+20 XP, o +10 XP si se salta). |
| 6 | Perfil | Apodo editable, XP, niveles, meta diaria, mis datos y opción para borrar el perfil. |
| 7 | Meditación | Respiración guiada 4-7-8 con círculo animado y escaneo corporal paso a paso. |
| 8 | Progreso | Días de ejercicio y calendario mensual que marca los días entrenados. |

**Accesibilidad:** botón lateral para **texto grande** y botón de **audífonos** que lee la pantalla en voz alta (síntesis de voz del navegador).

Los datos se guardan solo en el navegador (`localStorage`); no hay servidor ni base de datos.

## Tecnologías

HTML, CSS y JavaScript puro. Sin dependencias ni proceso de compilación.

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio nuevo y público en GitHub, por ejemplo `physiomotion`.
2. Sube **el contenido** de esta carpeta (que `index.html` quede en la raíz del repositorio):
   - Desde la web: **Add file → Upload files**, arrastra todos los archivos y la carpeta `assets`, y luego **Commit changes**.
   - O desde la terminal:
     ```bash
     git init
     git add .
     git commit -m "Prototipo PhysioMotion"
     git branch -M main
     git remote add origin https://github.com/TU-USUARIO/physiomotion.git
     git push -u origin main
     ```
3. En el repositorio ve a **Settings → Pages**.
4. En **Build and deployment → Source** elige **Deploy from a branch**, rama **main**, carpeta **/ (root)** y pulsa **Save**.
5. Espera 1–2 minutos y recarga la página: aparecerá el enlace `https://TU-USUARIO.github.io/physiomotion/`.

## Probarlo en tu computador

Abre `index.html` con doble clic en cualquier navegador.

## Estructura

```
physiomotion/
├── index.html      # Estructura de las 8 pantallas
├── styles.css      # Diseño (paleta verde salvia del prototipo)
├── app.js          # Navegación, cuestionario, ejercicios, meditación y progreso
├── assets/         # Ilustraciones e íconos del prototipo
└── .nojekyll       # Indica a GitHub Pages que sirva los archivos tal cual
```

---
Proyecto académico · Entrega 2
