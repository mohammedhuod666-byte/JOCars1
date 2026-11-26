---
name: premium-ui-interactions
description: Modern UI/UX interaction patterns and reusable Tailwind + Framer Motion templates (Sliding Glassmorphic Nav Pill, Glowing Hover Box, Tactile Micro-Animations) inspired by Linear, Vercel, and Aceternity UI.
---

# Premium UI Interactions & Design Templates (JO Cars)

Use these production-tested templates whenever building or upgrading navigation bars, tab bars, and interactive cards in Next.js + Tailwind CSS + Framer Motion.

## 1. Sliding Glassmorphic Hover Box (`layoutId` Navbar Pill)

Creates a smooth spring-animated glowing box that glides behind whichever navigation item the user hovers over (`السيارات`, `قطع الغيار`, `الورش والصيانة`, `المنتدى`, `المزيد`).

```tsx
const [hoveredNav, setHoveredNav] = useState<string | null>(null);

<nav
  onMouseLeave={() => setHoveredNav(null)}
  className="relative hidden lg:flex items-center gap-1 bg-[#121622]/70 border border-white/[0.07] rounded-2xl p-1.5 backdrop-blur-xl"
>
  {links.map((link) => {
    const isHovered = hoveredNav === link.href;
    const isActive = pathname === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        onMouseEnter={() => setHoveredNav(link.href)}
        className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold z-10 transition-colors duration-200"
      >
        {isHovered && (
          <motion.span
            layoutId="nav-hover-box"
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.10] to-white/[0.04] border border-amber-400/35 shadow-[0_0_18px_rgba(245,158,11,0.16),inset_0_1px_0_rgba(255,255,255,0.14)] -z-10"
          />
        )}
        {isActive && (
          <motion.span
            layoutId="nav-active-box"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="absolute inset-0 rounded-xl bg-[#1e2538] border border-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.18)] -z-20"
          />
        )}
        <span>{link.label}</span>
      </Link>
    );
  })}
</nav>
```

## 2. Design Principles
- **Spring Physics:** `stiffness: 420, damping: 32` prevents sluggish lag and avoids harsh snapping.
- **Layering (`z-index`):** Keep link text/icons at `z-10`, hover box at `-z-10`, and active box at `-z-20` so text stays razor-sharp.
- **Luxury Contrast (Dark Obsidian + Amber):** Combine `border-amber-400/35` with `inset_0_1px_0_rgba(255,255,255,0.14)` for a subtle 3D glass edge.
