# V12 - Rotating hero success stories

The homepage's right-hand hero panel now rotates through Legacy Dental Pasadena, AVA Dental, and Oceanic Dental. The left hero copy, the homepage's lower Legacy / AVA / OCPAO story row, all story pages, and the assessment remain unchanged.

## Interaction
- Automatic rotation every eight seconds, in the order Legacy, AVA, Oceanic, then Legacy.
- Named selector buttons, previous/next arrows, an explicit pause/play button, and a per-story progress indicator.
- Automatic rotation pauses on hover and keyboard focus, while the card is offscreen, and while the browser tab is hidden.
- Selecting a story manually pauses automatic rotation until Play is chosen.
- Swipe left/right on the story content on touch devices. Arrow keys and Home/End work in the carousel controls.
- Reduced-motion settings disable automatic rotation and animated transitions, while manual controls remain available.
- Content, milestone badge, source note, and story link update together. Grid-stacked slides keep the card height stable.
- A meaningful Legacy card is visible without JavaScript.

## Content
All figures are taken from the existing V11 stories, not independent new measurements.
AVA's headline remains $109K in monthly collections within the first 90 days after grand opening. It is not monthly production, an average, or a cumulative 90-day total.
Oceanic uses its supplied review-momentum story: 35 positive reviews in two weeks, a reported 4.8 rating, and two aligned locations. Its calendar illustration represents a reporting window, not daily review counts. No fictional time-series data was added.

## Files
- index.html: compiled slide content and markup.
- assets/hero-carousel-v12.css: styles scoped to the hero carousel.
- assets/hero-carousel-v12.js: independent carousel controller.
- assets/hero-carousel-v12.json: source-reference notes; not a live data feed.
- assets/hero-media/legacy-portrait.webp: small portrait crop from the user's supplied hero screenshot; the existing online portrait remains an optional enhancement.
- tools/build_preview.py: includes the new assets and destroys/reinitializes the controller when navigating between pages inside the preview.

The eight-second interval is editable through data-interval="8000" on the homepage carousel container. The JavaScript enforces a minimum four-second interval.
