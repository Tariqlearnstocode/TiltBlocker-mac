# TraderBlock - Brand Guidelines & Style Guide

## Brand Overview

TraderBlock is a professional trading discipline tool designed to help traders maintain focus and avoid impulsive decisions. Our brand embodies trust, professionalism, and technological sophistication - mirroring the aesthetic of modern trading platforms like Webull.

---

## Brand Identity

### Brand Personality
- **Professional**: Serious, reliable, trustworthy
- **Modern**: Clean, tech-forward, sophisticated
- **Supportive**: Helpful, encouraging, non-judgmental
- **Disciplined**: Structured, focused, results-oriented

### Brand Voice
- **Tone**: Professional yet approachable, confident but not arrogant
- **Style**: Clear, direct, action-oriented
- **Language**: Trading terminology when appropriate, avoid jargon for general users
- **Messaging**: Focus on discipline, control, and professional trading habits

---

## Logo & Icon Guidelines

### Primary Logo Concept
```
🛡️ TraderBlock
```

### Logo Variations
- **Primary**: Full wordmark with shield icon
- **Icon Only**: Shield with padlock/chart element for small spaces
- **Horizontal**: Icon + wordmark side by side
- **Stacked**: Icon above wordmark for square formats

### Icon Design Principles
- **Shield**: Represents protection and security
- **Lock Element**: Indicates blocking/restriction functionality
- **Clean Lines**: Minimal, scalable design
- **Professional**: Suitable for financial/trading context

---

## Color Palette

### Primary Colors

#### **Tailwind Blue** - Primary Brand Color
- **Hex**: `#3B82F6`
- **RGB**: `59, 130, 246`
- **Usage**: Primary buttons, active states, interactive elements, gradients

#### **Tailwind Blue Dark** - Secondary Blue
- **Hex**: `#2563EB` (hover), `#1D4ED8` (gradient end)
- **RGB**: `37, 99, 235` / `29, 78, 216`
- **Usage**: Hover states, gradient backgrounds, pressed states

#### **Webull Navy** - Header Color
- **Hex**: `#1B1F3B`
- **RGB**: `27, 31, 59`
- **Usage**: Headers, titles, primary text (legacy support)

#### **Success Green** - Positive Actions
- **Hex**: `#00C896`
- **RGB**: `0, 200, 150`
- **Usage**: Success states, positive metrics, confirmations

### Secondary Colors

#### **Warning Orange** - Alerts & Cautions
- **Hex**: `#FF6B35`
- **RGB**: `255, 107, 53`
- **Usage**: Emergency access, warnings, important alerts

#### **Error Red** - Blocking & Restrictions
- **Hex**: `#EF4444`
- **RGB**: `239, 68, 68`
- **Usage**: Delete buttons, error states, blocked indicators

#### **Slate Text** - Modern Text Color
- **Hex**: `#1E293B` (primary), `#64748B` (secondary)
- **RGB**: `30, 41, 59` / `100, 116, 139`
- **Usage**: Primary text, secondary text, descriptions

#### **Border Gray** - Modern Borders
- **Hex**: `#E2E8F0`
- **RGB**: `226, 232, 240`
- **Usage**: Card borders, input borders, dividers

### Background Colors

#### **Pure White**
- **Hex**: `#FFFFFF`
- **Usage**: Main backgrounds, cards, modals

#### **Light Gray**
- **Hex**: `#F8FAFC`
- **RGB**: `248, 250, 252`
- **Usage**: Section backgrounds, card containers, subtle separations

#### **Error Background**
- **Hex**: `#FEF2F2`
- **RGB**: `254, 242, 242`
- **Usage**: Error alert backgrounds

#### **Dark Mode Background**
- **Hex**: `#0F1419`
- **RGB**: `15, 20, 25`
- **Usage**: Dark theme primary background

---

## Typography

### Primary Font Family
**Inter** - Modern, professional, highly readable
- **Usage**: All UI text, headings, body copy
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Font Hierarchy

#### **H1 - Page Headers**
- **Size**: 32px / 2rem
- **Weight**: 700 (Bold)
- **Color**: Webull Navy (#1B1F3B)
- **Usage**: Main page titles, modal headers

#### **H2 - Section Headers**
- **Size**: 24px / 1.5rem
- **Weight**: 600 (SemiBold)
- **Color**: Webull Navy (#1B1F3B)
- **Usage**: Section titles, card headers

#### **H3 - Subsection Headers**
- **Size**: 18px / 1.125rem
- **Weight**: 600 (SemiBold)
- **Color**: Webull Navy (#1B1F3B)
- **Usage**: Form labels, small section titles

#### **Body Text**
- **Size**: 16px / 1rem
- **Weight**: 400 (Regular)
- **Color**: Webull Navy (#1B1F3B)
- **Line Height**: 1.5
- **Usage**: Main content, descriptions

#### **Small Text**
- **Size**: 14px / 0.875rem
- **Weight**: 400 (Regular)
- **Color**: Neutral Gray (#8B8B8B)
- **Usage**: Captions, timestamps, helper text

#### **Button Text**
- **Size**: 16px / 1rem
- **Weight**: 500 (Medium)
- **Usage**: All button labels

---

## UI Components

### Buttons

#### **Primary Button**
```css
background: #3B82F6 (Tailwind Blue)
color: #FFFFFF
border-radius: 12px
padding: 12px 24px
font-weight: 500
border: none
text-transform: none
transition: all 0.2s ease

&:hover {
  background: #2563EB
  transform: translateY(-1px)
}
```

#### **Secondary Button**
```css
background: #FFFFFF
color: #1E293B (Slate Text)
border: 2px solid #E2E8F0 (Border Gray)
border-radius: 12px
padding: 12px 24px
font-weight: 500
text-transform: none
transition: all 0.2s ease

&:hover {
  border-color: #3B82F6
  background: rgba(59, 130, 246, 0.05)
}
```

#### **Danger Button** (Emergency Access)
```css
background: #FFF3CD (Light Warning)
color: #856404 (Dark Warning)
border: 2px solid #FF6B35 (Warning Orange)
border-radius: 12px
padding: 12px 24px
font-weight: 500
```

#### **Success Button**
```css
background: #00C896 (Success Green)
color: #FFFFFF
border-radius: 12px
padding: 12px 24px
font-weight: 500
border: none
```

### Cards & Containers

#### **Interactive Site Card** (New Pattern)
```css
background: #FFFFFF
border: 2px solid #E2E8F0
border-radius: 12px
cursor: pointer
transition: all 0.2s ease
position: relative

&:hover {
  border-color: #3B82F6
  transform: translateY(-2px)
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15)
}

/* Blocked/Selected State */
&.blocked {
  background: linear-gradient(135deg, #3B82F6, #1D4ED8)
  color: #FFFFFF
  border-color: #3B82F6
}

/* Checkmark indicator for selected cards */
&.blocked::after {
  content: "✓"
  position: absolute
  top: 12px
  right: 12px
  background: rgba(255, 255, 255, 0.2)
  width: 20px
  height: 20px
  border-radius: 50%
  display: flex
  align-items: center
  justify-content: center
  font-size: 12px
  font-weight: bold
}
```

#### **Main Card**
```css
background: #FFFFFF
border-radius: 20px
box-shadow: 0 4px 20px rgba(27, 31, 59, 0.1)
padding: 24px
```

#### **Info Card**
```css
background: #F8FAFC (Light Gray)
border-radius: 12px
padding: 16px
border-left: 4px solid #3B82F6 (Tailwind Blue)
```

#### **Warning Card**
```css
background: #FFF3CD
border-radius: 12px
padding: 16px
border-left: 4px solid #FF6B35 (Warning Orange)
```

#### **Error Alert Card**
```css
background: #FEF2F2
border-left: 4px solid #EF4444
border-radius: 12px
padding: 16px
```

#### **Blocklist Container** (New Pattern)
```css
background: #F8FAFC
border-radius: 12px
padding: 20px

/* Individual list items */
.list-item {
  background: #FFFFFF
  border-radius: 8px
  padding: 16px
  margin-bottom: 8px
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
  display: flex
  align-items: center
  justify-content: space-between
}
```

### Form Elements

#### **Input Fields**
```css
background: #FFFFFF
border: 2px solid #E2E8F0
border-radius: 12px
padding: 12px 16px
font-size: 14px
color: #1E293B
transition: all 0.2s ease
```

#### **Input Focus State**
```css
border-color: #3B82F6 (Tailwind Blue)
box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1)
```

#### **Input Hover State**
```css
border-color: #3B82F6
```

#### **Search Input with Icon**
```css
/* Container with search icon */
.search-container {
  position: relative
}

.search-icon {
  position: absolute
  left: 14px
  top: 50%
  transform: translateY(-50%)
  color: #9CA3AF
  font-size: 20px
}

.search-input {
  padding-left: 40px /* Space for icon */
}
```

### Status Indicators

#### **Locked State**
- **Color**: Error Red (#FF4757)
- **Icon**: 🔒 or shield with lock
- **Background**: Light red tint (#FFF1F2)

#### **Active/Selected State**
- **Color**: Tailwind Blue (#3B82F6)
- **Icon**: ✅ or checkmark in circle
- **Background**: Blue gradient (linear-gradient(135deg, #3B82F6, #1D4ED8))
- **Text**: White (#FFFFFF) for contrast

#### **Warning State**
- **Color**: Warning Orange (#FF6B35)
- **Icon**: ⚠️ or warning triangle
- **Background**: Light orange tint (#FFF7ED)

---

## Iconography

### Icon Style
- **Style**: Outline icons (consistent with Webull's approach)
- **Weight**: 2px stroke width
- **Size**: 16px, 20px, 24px standard sizes
- **Color**: Match text color or use accent colors for emphasis

### Common Icons
- **Lock**: 🔒 (blocking/locked states)
- **Shield**: 🛡️ (protection/security)
- **Clock**: 🕐 (time-based features)
- **Warning**: ⚠️ (alerts and cautions)
- **Settings**: ⚙️ (configuration)
- **Stats**: 📊 (analytics and reporting)
- **Emergency**: 🚨 (emergency access)

---

## Spacing & Layout

### Spacing Scale
- **4px**: Micro spacing (icon gaps, fine adjustments)
- **8px**: Small spacing (element padding, tight groupings)
- **12px**: Medium spacing (button padding, form gaps)
- **16px**: Standard spacing (card padding, section gaps)
- **24px**: Large spacing (major sections, card padding)
- **32px**: Extra large spacing (page sections, major gaps)
- **48px**: Maximum spacing (page-level separations)

### Grid System
- **Container**: Max-width 400px for extension popup
- **Margins**: 16px minimum on mobile, 24px on desktop
- **Columns**: Flexible grid based on content needs

---

## Animation & Interactions

### Transition Principles
- **Duration**: 200ms for micro-interactions (`transition: all 0.2s ease`)
- **Easing**: `ease` for smooth, natural feel
- **Purpose**: Provide feedback, guide attention, maintain smoothness

### Hover States
- **Cards**: `transform: translateY(-2px)` with enhanced shadow
- **Buttons**: `transform: translateY(-1px)` with color change
- **Interactive Elements**: Border color change to primary blue
- **Shadow Enhancement**: `box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15)` for cards

### Micro-Interactions
- **Card Grid**: Responsive grid with `minmax(200px, 1fr)` and `gap: 1.5`
- **Icon Buttons**: Scale effect `transform: scale(1.05)` on hover
- **State Changes**: Smooth transitions between selected/unselected states
- **Delete Actions**: Hover grows button size and darkens color

### Loading States
- **Color**: Electric Blue (#4A90FF)
- **Style**: Subtle pulse or spinner
- **Context**: Show progress when possible

---

## Messaging Guidelines

### Voice & Tone Examples

#### **Encouraging**
- "Stay focused! You're building better trading habits."
- "Great discipline! 4 successful lockouts this week."
- "Professional traders control their emotions."

#### **Instructional**
- "Add trading platforms to your block list."
- "Set your emergency password for break-glass access."
- "Choose your lockout duration."

#### **Warning (Non-Judgmental)**
- "Emergency access should be used responsibly."
- "This action cannot be undone without your emergency password."
- "Consider if this access is truly necessary."

### Avoid
- Judgmental language ("You're being impulsive")
- Overly casual tone ("Whoops!" "Ouch!")
- Technical jargon without explanation
- Shame-based messaging

---

## Implementation Guidelines

### CSS Custom Properties
```css
:root {
  /* Colors - Updated to Modern Palette */
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-primary-gradient-end: #1D4ED8;
  --color-text-primary: #1E293B;
  --color-text-secondary: #64748B;
  --color-border: #E2E8F0;
  --color-success: #00C896;
  --color-warning: #FF6B35;
  --color-error: #EF4444;
  --color-background-light: #F8FAFC;
  --color-background-error: #FEF2F2;
  
  /* Typography */
  --font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
}
```

### Accessibility Requirements
- **Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus**: Visible focus indicators for all interactive elements
- **Color**: Never rely on color alone to convey information
- **Text**: Minimum 16px font size for body text

---

## Modern Design Patterns (CommonSitesTab Implementation)

### Grid Layout Pattern
```css
/* Responsive card grid */
.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
```

### Toggle State Cards
- **Unselected**: White background, gray border, dark text
- **Selected**: Blue gradient background, blue border, white text with checkmark
- **Hover**: Blue border, slight lift, enhanced shadow
- **Click**: Toggles between selected/unselected states

### Section Header Pattern
```css
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1E293B;
}

.section-icon {
  color: #3B82F6;
  font-size: 20px;
}
```

### Action Button Patterns
- **Add Button**: Primary blue, white text, hover lifts and darkens
- **Delete Button**: Red background, white emoji icon, hover scales and darkens
- **Toggle Button**: Changes appearance based on state

### List Item Pattern
```css
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-item-content {
  flex: 1;
}

.list-item-title {
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 2px;
}

.list-item-meta {
  font-size: 12px;
  color: #64748B;
}
```

---

## Usage Examples

### Extension Popup
- Clean white background with subtle shadows
- Webull Navy headers with Electric Blue accents
- Clear hierarchy with proper spacing
- Professional button styling

### Blocked Page
- Error Red for lockout messaging
- Success Green for stats and progress
- Warning Orange for emergency access
- Motivational messaging in supportive tone

### Settings Interface
- Organized sections with clear labels
- Form elements following input field guidelines
- Consistent button treatments
- Info cards for explanations and help text

---

This brand system creates a professional, trustworthy appearance that aligns with modern trading platforms while maintaining its own distinct identity focused on discipline and control.