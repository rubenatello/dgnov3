# 📁 Logo & Favicon Placement Guide

## Where to Place Your Assets

### Favicon (Browser Tab Icon)

**File**: `favicon.png`  
**Location**: `app/public/favicon.png`  
**Recommended Size**: 32x32 or 64x64 pixels (square)  
**Format**: PNG with transparency

```
app/
└── public/
    └── favicon.png  ← Place your favicon here
```

Already configured in `index.html`:
```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

### Logo (For Header/Site Branding)

**File**: `logo.png`  
**Location**: `app/public/logo.png`  
**Recommended Size**: 
- Width: 120-200px (for header)
- Height: proportional (typically 40-60px)
- Or use SVG for best quality at any size

```
app/
└── public/
    ├── favicon.png  ← Favicon
    └── logo.png     ← Site logo
```

### Usage in Your Components

Once placed in `public/`, reference them like this:

#### In Header Component
```tsx
// app/src/components/Header.tsx
<a href="/" className="flex items-center">
  <img src="/logo.png" alt="DGNO" className="h-10" />
</a>
```

#### In Footer or Other Components
```tsx
<img src="/logo.png" alt="DGNO Logo" className="h-8" />
```

## 🎨 Additional Assets

### Other Images You Might Add

```
app/public/
├── favicon.png          ← Browser tab icon
├── logo.png             ← Main logo (color)
├── logo-white.png       ← White version (for dark backgrounds)
├── apple-touch-icon.png ← iOS home screen icon (180x180)
└── og-image.png         ← Social media preview (1200x630)
```

### For Article Images

**Don't put in public/** - Use Firebase Storage instead!

Upload through your admin interface and store URLs in Firestore:
```typescript
// This is handled by your media upload feature
await uploadToStorage(file, 'images/article-123.png')
```

## 📐 Recommended Sizes

| Asset | Size | Purpose |
|-------|------|---------|
| `favicon.png` | 32x32 or 64x64 | Browser tab icon |
| `logo.png` | ~200x50 | Header logo |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `og-image.png` | 1200x630 | Social media preview |

## 🔄 After Adding Files

1. Place files in `app/public/`
2. They'll be automatically available at root URL
3. No need to import or restart server
4. Access as: `/filename.png`

## ✅ Current Setup

- ✅ Favicon configured in `index.html`
- ✅ Logo ready to use in components
- ✅ Just drop PNG files in `public/` folder

## Example: Update Header with Logo

```tsx
// app/src/components/Header.tsx
export default function Header() {
  return (
    <header className="bg-paper border-b border-stone sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="DGNO" className="h-10" />
              <span className="text-2xl font-bold font-heading text-ink">
                DGNO
              </span>
            </a>
          </div>
          {/* Rest of header... */}
        </div>
      </div>
    </header>
  );
}
```

---

**Quick Steps:**
1. Drop `favicon.png` in `app/public/`
2. Drop `logo.png` in `app/public/`
3. Update Header component to use logo
4. Refresh browser - done! ✨
