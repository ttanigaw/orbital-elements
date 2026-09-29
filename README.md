# Orbital Elements 3D

An interactive Three.js visualizer for the six classical orbital elements.

## Features

- Adjust semi-major axis `a`, eccentricity `e`, inclination `i`,
  longitude of ascending node `Ω`, argument of periapsis `ω`,
  and true anomaly `ν`.
- Rotate, zoom, and pan the 3D view with the mouse.
- Toggle the reference plane, orbital plane, nodes, apsides,
  position vector, and XYZ axes.
- Display the current Cartesian position and orbital distances.
- Retro-futuristic spacecraft navigation-console visual design.
- Responsive layout for desktop and smaller screens.

The inertial position is generated from the perifocal-plane position using

```text
r = a(1 - e²) / (1 + e cos ν)

r_inertial = Rz(Ω) Rx(i) Rz(ω) (r cos ν, r sin ν, 0)
```

## Development

Requires Node.js 22 or a recent compatible release.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## GitHub Pages

The Vite base path is configured for this repository:

```text
/orbital-elements/
```

A GitHub Actions workflow builds and deploys `dist/` after changes are
merged to `main`.

If Pages has not yet been enabled for this repository, set:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

The public URL will then be:

<https://ttanigaw.github.io/orbital-elements/>
