# Notion Design System Reference

> Philosophical guide for generating Notion-inspired prototypes. Not a copy-paste template.

## Version Control

| Field       | Value      |
|-------------|------------|
| Version     | 1.0        |
| Created     | 2026-05-07 |
| Last Updated| 2026-05-07 |

---

## Visual Identity

Notion embodies **warm, flexible, human-centered design**. The interface feels like a well-crafted notebook -- personal yet powerful. It blends digital precision with an almost analog warmth. The design says: "this tool adapts to you, not the other way around."

Key traits:
- Warm and friendly, never sterile or cold
- Paper-like quality with a digital backbone
- Flexible and modular -- the system bends to user needs
- Playful without being childish; illustrations and icons add personality
- Content is the interface; chrome is minimal and context-aware

---

## Color Philosophy

### Signature Palette
- **Primary background**: Warm white (#FFFFFF with warm rendering) or soft off-white (#FBFBFA)
- **Secondary backgrounds**: Very light warm gray (#F7F6F3) for sidebars, hover states
- **Text primary**: Warm near-black (#37352F) -- distinctly not pure black
- **Text secondary**: Warm medium gray (#787774)
- **Accent colors**: Soft pastels used for categories, tags, and highlights:
  - Light red/pink (#FFE2DD)
  - Light orange (#FADEC9)
  - Light yellow (#FDECC8)
  - Light green (#DBEDDB)
  - Light blue (#D3E5EF)
  - Light purple (#E8DEEE)
- **Link/action color**: Understated blue, not vibrant

### Hierarchy Through Color
- Background warmth establishes the emotional tone before the user reads a word
- Pastel accents categorize and organize without competing for attention
- Color blocks are large and soft (full row highlights, not just text color)
- Dark mode inverts warmth carefully -- dark backgrounds retain a warm undertone, never pure black

---

## Typography

### Font Strategy
- **Serif option**: Used for a more literary, personal feel in body text (Georgia, or custom serif)
- **Sans-serif option**: Clean sans for UI elements, headings, and navigation (Inter, system sans)
- **Monospace**: For code blocks and inline code
- The serif/sans pairing creates a unique warmth that distinguishes Notion from typical SaaS products

### Sizing and Rhythm
- Page titles: 40px, bold, often serif
- Headings (H1-H3): Clear size steps (30px, 24px, 20px), with weight differentiation
- Body: 16px, generous line-height (1.6-1.8), optimized for long-form reading
- Captions and metadata: 14px, lighter weight or muted color
- Letter-spacing: normal to slightly loose; nothing feels compressed

---

## Layout Patterns

### Content-Block Architecture
- **Everything is a block**: Text, images, tables, embeds -- all are modular content blocks
- Blocks can be rearranged, nested, and combined freely
- This philosophy should inform layout: think in stackable, interchangeable sections
- Column layouts are created by placing blocks side by side, not by rigid grid definitions

### Page Structure
- **Flexible widths**: Content can be narrow (680px for reading) or full-width, user-controlled
- **Sidebar navigation**: Left sidebar with nested pages/tree structure, collapsible
- **Page header**: Cover image (optional) + icon + title, generous vertical space
- **Breadcrumb navigation**: Path-based, showing page hierarchy

### Spacing
- Generous but not excessive; padding that feels like page margins
- Block spacing: 4-8px between blocks, more between different block types
- Section breaks: extra vertical space or a thin divider, never heavy rules
- The overall rhythm feels like a well-typeset document

---

## Interaction Patterns

### Inline Editing
- Text is always editable in place -- no separate "edit mode"
- Click any text to start typing; the transition is seamless
- Slash commands ("/") to insert new block types
- Drag handles appear on hover to the left of blocks

### Hover Reveals
- Action buttons (delete, duplicate, move) appear only on hover
- Drag handles are hidden until the cursor approaches
- Toolbar appears above selected text for formatting
- The interface is clean by default, rich on interaction

### Drag and Drop
- Blocks can be reordered by dragging
- Visual indicator shows drop target (blue line between blocks)
- Columns created by dragging blocks beside each other
- Smooth, organic-feeling drag with natural momentum

### Toggle and Expand
- Toggle blocks collapse and expand content
- Database views switch between table, board, list, calendar
- Expansion feels gentle, not snappy -- content reveals, it doesn't pop

---

## Component Style

### Cards and Surfaces
- Very soft shadows or no shadows at all; subtle elevation
- Rounded corners: 4-6px, softer than sharp but not pill-shaped
- Light borders: barely visible, warm gray (#E9E9E7)
- Cards feel like paper laid on the surface, not floating above it

### Buttons
- Understated: often ghost or text-style buttons until hover
- Primary actions use modest fill, not bold gradients
- Border-radius: 4-6px
- Small, compact buttons in the UI; larger only for onboarding or landing pages

### Icons and Illustrations
- **Custom emoji-style icons**: Used for page icons, adding personality
- **Line illustrations**: Simple, playful, slightly hand-drawn feel
- **Emoji as UI**: Notion normalizes using emoji as functional interface elements
- Illustrations are warm, minimal-line-count, and inclusive

### Database and Table Components
- Clean table borders (light gray)
- Property types with distinct icons (text, number, select, date, etc.)
- Filter and sort controls inline with the database view
- Alternate row shading (very subtle, 1-2% opacity difference)

---

## Animation Approach

### Principles
- **Gentle**: Animations feel organic and unhurried
- **Spring-like easing**: Slight overshoot and settle, not robotic ease-in-out
- **Contextual**: Animations respond to what the user is doing (dragging, expanding, navigating)
- Nothing feels mechanical; the interface breathes

### Common Patterns
- Page transitions: soft fade (200-300ms)
- Toggle expand: height animation with spring easing (300-400ms)
- Sidebar collapse: smooth slide (250ms)
- Block reorder: smooth translateY with spring physics
- Modal appear: fade + slight scale (200ms)
- Loading: subtle skeleton shimmer with warm gray tones

---

## When to Reference This System

Use Notion's design philosophy when the client brief involves:

- **Knowledge management** or documentation platforms
- **Content platforms** where reading and writing are core activities
- **Collaborative tools** that multiple users interact with
- **Personal brands** or portfolios that want warmth and personality
- **No-code or low-code** tools that need to feel accessible to non-technical users
- **Community platforms** where warmth and inclusivity matter
- **Any product** that values flexibility and user customization

### Blending Notes
- Pair with Stripe's precision for pricing pages or feature comparison sections
- Pair with Apple's large typography for hero sections while keeping Notion's warmth for body content
- Works well alongside Linear's command palette pattern for power-user features
- Avoid mixing with Vercel's stark black/white -- the warmth and coldness clash
