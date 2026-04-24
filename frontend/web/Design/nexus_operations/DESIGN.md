# Design System Document: The Command Center Aesthetic

## 1. Overview & Creative North Star: "The Digital Architect"
This design system moves away from the "flat" and often cluttered nature of traditional administrative dashboards. Our Creative North Star is **The Digital Architect**: a philosophy that treats data as structural material. The interface should feel like a high-end physical command center—composed of precision-machined surfaces, intentional voids, and light-based information layers.

We break the "template" look by rejecting the standard 1px border grid. Instead, we use **Tonal Architecture**—layering shades of white and cool grey to define boundaries. The layout should embrace intentional asymmetry; primary telemetry data should breathe in wide expansive containers, while dense operational controls are nested in high-elevation "logic blocks."

## 2. Colors: Tonal Depth & Meaning
The palette is a sophisticated range of blues and greys designed to minimize eye fatigue during long operational shifts while highlighting critical system states.

### Surface Hierarchy & The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off content. Boundaries are created through background shifts.
*   **Base Layer:** Use `surface` (#f8f9fa) for the main canvas.
*   **Sectioning:** Use `surface_container_low` (#f3f4f5) to define large functional regions.
*   **Actionable Areas:** Use `surface_container_lowest` (#ffffff) for cards or modules that require the user's focus.

### The "Glass & Gradient" Rule
To elevate the "Command Center" feel, use **Glassmorphism** for persistent overlays (like side navigation or floating command bars).
*   **Floating Elements:** Use `surface` at 80% opacity with a `backdrop-filter: blur(20px)`.
*   **Signature Gradients:** For primary CTAs and high-level KPI headers, utilize a subtle linear gradient from `primary` (#005bbf) to `primary_container` (#1a73e8). This provides a "glow" that flat colors lack.

### Functional Accents
*   **Primary Logic:** `primary` (#005bbf) is reserved for the current "path" or active state.
*   **Alerts/Warnings:** Use `error` (#ba1a1a) and `tertiary` (#9e4300) sparingly. These should feel like "lit LEDs" against a monochrome background, ensuring immediate cognitive recognition.

## 3. Typography: Editorial Authority
We use **Inter** for its neutral, technical precision. The hierarchy is designed to feel editorial—large, confident headers paired with dense, readable tabular data.

*   **Display & Headlines:** Use `display-md` and `headline-sm` for system-wide status updates. These should be set with tighter letter-spacing (-0.02em) to feel "machined."
*   **The Data Layer:** `body-md` and `label-md` are the workhorses. Use `label-sm` for technical metadata (timestamps, PID numbers) to create a clear distinction between "Human Content" and "Machine Data."
*   **Contrast:** Always use `on_surface_variant` (#414754) for secondary text to maintain a soft visual hierarchy, reserving `on_surface` (#191c1d) for primary headers.

## 4. Elevation & Depth: The Layering Principle
We convey importance through **Tonal Layering** rather than heavy drop shadows.

*   **The Stacking Rule:** To create depth, stack containers:
    1.  Main Background: `surface`
    2.  Page Section: `surface_container_low`
    3.  Data Card: `surface_container_lowest`
*   **Ambient Shadows:** For "Modal" or "Floating" elements, use a highly diffused shadow: `box-shadow: 0 12px 40px rgba(25, 28, 29, 0.06)`. The shadow is a tinted version of the `on_surface` color, making it feel like ambient occlusion rather than a "floating sticker."
*   **Ghost Borders:** If a separator is required for accessibility (e.g., in high-density tables), use the `outline_variant` (#c1c6d6) at **15% opacity**. Never use a 100% opaque border.

## 5. Components: Modern Functionalism

### Buttons & Interaction
*   **Primary:** Solid `primary` with a subtle gradient to `primary_container`. `borderRadius: md` (0.375rem).
*   **Secondary:** No background. Use `outline` for the label color. On hover, apply a `surface_container_high` background.
*   **Tertiary (Ghost):** Used for low-priority dashboard actions. Only visible as text until hovered.

### Cards & Modules
*   **Forbid Dividers:** Do not use `<hr>` tags or border-bottoms. Use `24px` or `32px` of vertical whitespace to separate content groups within a card.
*   **Header Blocks:** Card titles should be set in `title-sm` with a `surface_container_highest` accent bar (2px width) to the left of the text to denote "Active Logic."

### Input Fields
*   **Style:** Use the "Filled" Material style but with `surface_container_high` as the background. Remove the bottom line. Rely on the `md` corner radius to define the shape.
*   **Focus State:** Transition the background to `surface_container_lowest` and add a 2px `primary` "Ghost Border" (20% opacity).

### Specialized "Command Center" Components
*   **The Telemetry Strip:** A thin, full-width element using `inverse_surface` with `on_primary_fixed` text for real-time system heartbeats.
*   **Status Orbs:** Small 8px circles using `error` or `tertiary` for status, featuring a 4px "blur glow" of the same color to simulate hardware lights.

## 6. Do’s and Don’ts

### Do:
*   **Do** use whitespace as a functional tool. If two data points are related, group them closely; if not, use a `32px` gap.
*   **Do** use `surface_tint` at 5% opacity over images or heavy data visualizations to "brand" the content into the system's cool-blue atmosphere.
*   **Do** ensure all interactive icons have a minimum 40px hit target, even if the icon itself is `18px`.

### Don’t:
*   **Don’t** use pure black (#000000) for shadows or text. It breaks the "Digital Architect" atmospheric depth.
*   **Don’t** use 100% opaque borders to separate list items. Use a 1px `surface_container_high` background shift instead.
*   **Don’t** use rounded-full corners for buttons or cards (unless it's a FAB). Stick to `md` (0.375rem) to maintain a professional, architectural rigor.