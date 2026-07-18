# 🎬 Youtube Comment Markers

### Visualiza los comentarios directamente sobre la línea de tiempo del vídeo. Detecta momentos destacados, debates y reacciones al instante con marcadores de posición.

[![GitHub Stars](https://img.shields.io/github/stars/CheswickDEV/Youtube-Comment-Timeline-Overlay?color=00d4ff&labelColor=16161f)](https://github.com/CheswickDEV/Youtube-Comment-Timeline-Overlay)
[![Last Commit](https://img.shields.io/github/last-commit/CheswickDEV/Youtube-Comment-Timeline-Overlay?color=a855f7&labelColor=16161f)](https://github.com/CheswickDEV/Youtube-Comment-Timeline-Overlay/commits/main)
![Version](https://img.shields.io/badge/version-1.2.2-00d4ff?labelColor=16161f)
![Status](https://img.shields.io/badge/estado-Activo-00d4ff?labelColor=16161f)
![License](https://img.shields.io/badge/licencia-MIT-a855f7?labelColor=16161f)
![Firefox](https://img.shields.io/badge/Firefox-Manifest_v3-a855f7?logo=firefox&logoColor=white&labelColor=16161f)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-00d4ff?logo=javascript&logoColor=white&labelColor=16161f)

---

## 💡 Qué hace

¿Alguna vez has querido saber *dónde* están los momentos interesantes de un vídeo de YouTube, basándote en lo que la gente comenta? Esta extensión para Firefox analiza los comentarios en busca de referencias a marcas de tiempo y coloca marcadores visuales directamente sobre la barra de progreso del vídeo.

Los comentarios se agrupan en los momentos que importan — momentazos, controversias, giros de guión, escenas divertidas — y puedes verlos de un vistazo sin tener que leer cientos de comentarios.

<img src="https://addons.mozilla.org/user-media/previews/thumbs/348/348369.jpg?modified=1768910827">

---

## ⚡ Características

- **📍 Marcadores en la línea de tiempo** — Aparecen marcadores amarillos sobre la barra de progreso de YouTube en cada marca de tiempo mencionada en los comentarios. Los comentarios agrupados generan marcadores más anchos y brillantes para que los momentos clave destaquen de inmediato.

- **💬 Tooltips detallados** — Pasa el ratón por encima de cualquier marcador para ver el autor, su avatar, el texto del comentario, los «me gusta» y las respuestas en una tarjeta emergente. Los grupos se expanden en una lista desplazable con todos los comentarios de esa posición.

- **⏩ Clic para saltar** — Haz clic en cualquier marcador o tooltip para ir directamente a ese momento del vídeo y reproducirlo. Al hacer clic en un comentario concreto de un grupo, también se desplaza la página hasta él.

- **🔄 Carga automática vía API** — La extensión usa la API interna de YouTube (Innertube) para obtener comentarios en segundo plano sin necesidad de desplazar la página manualmente. Carga hasta las páginas configuradas (~20 comentarios por página) de forma silenciosa y eficiente.

- **⚙️ Opciones configurables** — Ajusta el número máximo de páginas a cargar y activa o desactiva el registro de depuración desde el popup o la página de ajustes.

- **🔒 Manipulación segura del DOM** — Toda la manipulación del DOM usa métodos seguros (`textContent`, `DOMParser` para SVGs) — sin inyecciones de `innerHTML`.

---

## 🚀 Instalación

### Requisitos

- Firefox 142+

### Instalación manual (sin tienda)

1. Descarga el archivo en `.xpi`
2. En Firefox → Menú → Complementos y temas
3. Icono de engranaje → «Instalar complemento desde archivo…»
4. Selecciona el archivo `.xpi`

Una vez instalado, **abre cualquier vídeo de YouTube** — los marcadores aparecen automáticamente cuando los comentarios cargan (~3 segundos).

---

## 🔄 Cómo funciona

```
┌──────────────────┐     ┌───────────────────────────┐     ┌──────────────────┐
│  Página de vídeo │     │   Script de contenido      │     │  Overlay línea   │
│  YouTube carga   │────▶│                            │────▶│  de tiempo       │
│                  │     │  1. Obtiene token inicial  │     │                  │
│                  │     │     del DOM de comentarios  │     │  Marcadores en   │
│                  │     │  2. Llama a API Innertube   │     │  la barra de     │
│                  │     │  3. Extrae marcas de tiempo │     │  progreso        │
│                  │     │  4. Agrupa las cercanas     │     │                  │
│                  │     │  5. Construye marcadores    │     │  Hover → Tooltip │
│                  │     │                            │     │  Clic → Saltar   │
└──────────────────┘     └───────────────────────────┘     └──────────────────┘
```

**Agrupación de comentarios:** Los comentarios situados dentro del 0,5 % de la duración del vídeo entre sí se agrupan en un único marcador. Esto evita el desorden visual en vídeos con muchos comentarios con marcas de tiempo en posiciones similares.

**Actualizaciones continuas:** La extensión monitoriza si se cargan nuevos comentarios y reconstruye el overlay cada 2 segundos si el recuento cambia.

---

## 🛠️ Stack tecnológico

![JavaScript](https://img.shields.io/badge/JavaScript-16161f?logo=javascript&logoColor=00d4ff)
![CSS](https://img.shields.io/badge/CSS3-16161f?logo=css3&logoColor=00d4ff)
![Firefox](https://img.shields.io/badge/WebExtensions_API-16161f?logo=firefox&logoColor=a855f7)

```
Youtube-Comment-Timeline-Overlay/
├── manifest.json       # Manifiesto de la extensión (v3)
├── content.js          # Lógica principal: extracción, agrupación, UI
├── styles.css          # Estilos de marcadores y tooltips
├── options.html        # Página de ajustes completa
├── options.js          # Lógica compartida de ajustes (popup + opciones)
├── popup.html          # Popup del icono de la extensión
├── popup.js            # Lógica del popup
└── icons/
    ├── icon-48.png
    └── icon-96.png
```

---

## 📝 Changelog

### v1.2.2 (actual · editada)
- 🌐 Textos de interfaz en alemán traducidos al español

<details>
<summary>v1.2.1</summary>

### v1.2.1
- 🔧 Fix aviso CSP: inline script extraído a `popup.js`

</details>

<details>
<summary>Versiones anteriores</summary>

### v1.2 (editada)
- ✨ Carga de comentarios vía API Innertube de YouTube (sin scroll de página)
- ✨ Soporte para el formato ViewModel de YouTube (mutaciones + formato clásico)
- ✨ Popup configurable con límite de páginas y toggle de depuración
- ✨ Página de ajustes completa (`options.html`)
- ✨ Límite de bucle de carga para evitar bucles infinitos
- ✨ Interfaz traducida al español (España)

### v1.1 (original)
- ✨ Algoritmo de agrupación de comentarios mejorado
- ✨ Tooltips detallados con avatares de autor y métricas de interacción
- ✨ Funcionalidad de salto al momento y desplazamiento al comentario

### v1.0 (original)
- 🚀 Lanzamiento inicial
- ✨ Extracción de marcas de tiempo de comentarios de YouTube
- ✨ Overlay de marcadores en la barra de progreso
- ✨ Carga automática de comentarios mediante scroll en segundo plano
- ✨ Tooltip básico al pasar el ratón

</details>

---

## 🙏 Créditos

Esta extensión está basada en el trabajo original de [cheswick.dev](https://cheswick.dev).  
Repositorio original: [CheswickDEV/Youtube-Comment-Timeline-Overlay](https://github.com/CheswickDEV/Youtube-Comment-Timeline-Overlay)

---

## 📄 Licencia

[MIT](LICENSE) — haz lo que quieras, solo da crédito.

---

<p align="center">
  <a href="https://cheswick.dev">
    <img src="https://img.shields.io/badge/CHESWICK.DEV-00d4ff?logo=firefox&logoColor=0a0a0f&labelColor=a855f7" alt="cheswick.dev" />
  </a>
</p>

<p align="center">
  Hecho con 🖤 por <a href="https://cheswick.dev">cheswick.dev</a>
</p>
