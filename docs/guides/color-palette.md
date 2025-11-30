# Color Palette

Twiggle uses a carefully curated color palette based on the Coolors palette system.

## Palette Colors

The main color palette consists of 5 colors:

- **Red/Pink** (`#ef476f`) - Primary accent color, used for CTAs and important actions
- **Yellow** (`#ffd166`) - Warning states and secondary accents
- **Green/Teal** (`#06d6a0`) - Success states and positive indicators
- **Blue** (`#118ab2`) - Primary brand color, navigation, and main UI elements
- **Light Gray** (`#eeeeee`) - Backgrounds and neutral areas

## Usage

### Importing Colors

```typescript
import { colors, colorPalette, getColorByIndex, colorUtils } from '@/lib/colors'

// Use specific colors
const primaryButton = colors.primary  // #118ab2
const accentButton = colors.secondary // #ef476f

// Get color by index (useful for cycling)
const cardColor = getColorByIndex(cardIndex)

// Use color utilities
const lightBackground = colorUtils.lighten(colors.blue, 0.2) // rgba with 20% opacity
```

### Color Roles

- **Primary** (`colors.primary` / `colors.blue`): Main brand color
  - Navigation bars
  - Primary buttons
  - Links and interactive elements
  - Active states

- **Secondary** (`colors.secondary` / `colors.red`): Accent color
  - Call-to-action buttons
  - Important actions (Create, Save, etc.)
  - Error states (with opacity)

- **Success** (`colors.success` / `colors.green`): Positive states
  - Success messages
  - Completed states
  - Storage indicators (low usage)

- **Warning** (`colors.warning` / `colors.yellow`): Warning states
  - Warning messages
  - Unsaved changes indicators
  - Storage indicators (medium usage)

- **Background** (`colors.background` / `colors.gray`): Neutral backgrounds
  - Page backgrounds
  - Canvas backgrounds
  - Neutral areas

## Color Variations

Dark variations are available for hover states:

- `colors.redDark` - `#d63d5f`
- `colors.blueDark` - `#0f7a9a`
- `colors.greenDark` - `#05b88a`
- `colors.yellowDark` - `#e6bc4d`

## Best Practices

1. **Consistency**: Always import colors from `@/lib/colors` rather than hardcoding hex values
2. **Semantic Usage**: Use semantic color names (`primary`, `success`, etc.) when possible
3. **Accessibility**: Ensure sufficient contrast ratios when using colors for text
4. **Opacity**: Use `colorUtils.lighten()` for background variations instead of hardcoding opacity values

## Example Usage

```typescript
// ✅ Good - Using centralized colors
import { colors } from '@/lib/colors'
<button className={`bg-[${colors.primary}] text-white`}>

// ❌ Bad - Hardcoded colors
<button className="bg-[#118ab2] text-white">
```

