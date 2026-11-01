# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro (existing static site, no framework changes requested).

## Users

Twitch stream viewers during a live stream. The page is shown as a desktop browser window captured into the stream; viewers watch on stream, they do not open the page on phones. Desktop-only target (user-confirmed): no mobile/responsive viewport work. Secondary use: the streamer alone, preparing or adjusting lists.

## Product Purpose

An interactive tier-list tool themed around Resident Evil: two boards — characters and games. The streamer drags cards into S–F tier rows during the stream; viewers see the result on stream and react in chat. Success: the board is instantly readable on a compressed stream capture, dragging is smooth, and the RE theme lands without hurting legibility.

## Positioning

A fan-made RE tier list where every entry carries real content — character portraits with roles/abilities, game covers with descriptions and cast — not a bare grid template.

## Operating Context

Used live on stream in a browser window. Russian-language UI. Data lives in JSON (characters.json, games.json); user progress persists in localStorage; a reset button restores defaults.

## Capabilities and Constraints

- Drag & drop cards between tier rows and the bank; insertion by cursor position.
- Six default tiers (S, A, B, C, D, F) with editable, colored labels.
- Search filters cards in place; card click opens a lightbox with portrait/cover, metadata chips, and text blocks (character abilities; game description + cast), with prev/next navigation.
- Characters render at 1:1 (83px), game covers at 3:4; rows scroll horizontally with edge arrows.
- All state in localStorage keyed by content hash; no backend, no accounts.
- Constraint: static Astro build, no runtime dependencies beyond vanilla JS.

## Brand Commitments

Resident Evil theming is binding (user-confirmed). No channel-specific brand colors or logos to respect.

## Evidence on Hand

- 40+ character portrait PNGs in public/avatars; game covers in public/games.
- characters.json: names, games, roles, fandom links, ability lists (Russian).
- games.json: game codes, titles, years, platforms, descriptions, character rosters (Russian).

## Product Principles

1. Legibility under stream compression beats decoration; contrast and size thresholds are hard floors.
2. The theme is an atmosphere layer, never a cost to task clarity.
3. Every control earns its place on the stream capture — no noise in the working area.
4. Real content (abilities, descriptions, rosters) is the product's substance; keep it accessible.
