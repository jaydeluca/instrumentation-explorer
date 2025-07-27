# Theme Switcher Feature

## Feature Overview

This feature will allow users to switch between different visual themes for the application. Initially, it will support two themes: the original default theme (from the `updates` branch) and the newly implemented Grafana-inspired theme. A dropdown selector will be provided at the top of the page for users to select their preferred theme, and this preference will be persisted across sessions.

## Themes

### 1. Default Theme (Original)

The original theme, as it exists on the `updates` branch, will serve as the default. This theme primarily uses lighter backgrounds and standard blue/grey accents.

**Implementation:**
*   Identify all CSS rules contributing to the original theme.
*   Encapsulate these styles, potentially by prefixing them with a theme-specific class (e.g., `.theme-default`) or by placing them in a dedicated CSS file.

### 2. Grafana Theme

The currently implemented Grafana-inspired dark theme will be the alternative option.

**Implementation:**
*   All existing Grafana-inspired styles (currently in `App.css`, `index.css`, `LibraryDetail.css`, `TelemetryDiff.css`, `TruncatedDescription.css`) will be extracted and encapsulated.
*   These styles will be applied when the Grafana theme is active, likely through a theme-specific class (e.g., `.theme-grafana`) added to the `body` or root element.

## Implementation Strategy

### A. CSS Management

We will manage themes by applying a specific class to the `body` element (e.g., `<body class="theme-default">` or `<body class="theme-grafana">`). All theme-specific CSS rules will then be nested under these classes.

**Steps:**
1.  **Create `themes/` directory:** Create a new directory `frontend/src/themes/`.
2.  **`default.css`:** Move all original theme styles into `frontend/src/themes/default.css`.
3.  **`grafana.css`:** Move all Grafana-inspired styles into `frontend/src/themes/grafana.css`.
4.  **Update existing CSS files:** Remove theme-specific rules from `App.css`, `index.css`, `LibraryDetail.css`, `TelemetryDiff.css`, `TruncatedDescription.css`, and instead import the new theme files.
5.  **Apply theme classes:** Ensure all theme-specific rules in `default.css` and `grafana.css` are prefixed with their respective theme classes (e.g., `.theme-default .library-card`, `.theme-grafana .library-card`).

### B. React Context for Theme State

A React Context will be used to manage the current active theme and provide a way to switch between themes across the application.

**Steps:**
1.  **Create `ThemeContext.tsx`:** Define a context (`ThemeContext`) that holds the current theme state (`'default'` or `'grafana'`) and a function to update it.
2.  **`App.tsx` Integration:**
    *   Wrap the entire application with `ThemeContext.Provider`.
    *   Manage the active theme state within `App.tsx`.
    *   Apply the active theme class to the `body` element based on the state.
3.  **Theme Switcher Component:**
    *   Create a new React component (e.g., `ThemeSwitcher.tsx`) that consumes `ThemeContext`.
    *   This component will render a dropdown (`<select>`) with "Default" and "Grafana" options.
    *   On change, it will call the context's theme update function.

### C. Persistence

The user's selected theme will be saved to `localStorage` so that their preference is remembered when they revisit the application.

**Steps:**
1.  **Save to `localStorage`:** When the theme is changed, update `localStorage` with the new theme name.
2.  **Load from `localStorage`:** On application load, check `localStorage` for a saved theme preference and apply it. If no preference is found, default to the original theme.

## Implementation Plan (High-Level Steps)

1.  **Create Theme Files:** Extract and organize CSS into `default.css` and `grafana.css` within `frontend/src/themes/`.
2.  **Refactor Existing CSS:** Update `App.css`, `index.css`, etc., to remove theme-specific styles and import the new theme files.
3.  **Implement Theme Context:** Create `ThemeContext.tsx` and integrate it into `App.tsx`.
4.  **Develop Theme Switcher UI:** Create `ThemeSwitcher.tsx` with the dropdown and integrate it into `App.tsx`.
5.  **Add Persistence:** Implement `localStorage` integration for saving and loading theme preferences.
6.  **Verification:** Test theme switching and persistence thoroughly.
