

## Plan: Add Discord social link across the app

The Discord invite link (`https://discord.gg/qg5AYq3BE`) needs to be added alongside the existing Instagram and X (Twitter) social links in two places:

### Changes

**1. `src/components/AppSidebar.tsx`** — Sidebar social links section (~line 127-133)
- Add a Discord icon link after the X (Twitter) link, using the standard Discord SVG icon
- Same styling pattern as existing social links (`h-7 w-7 rounded-md...`)

**2. `src/pages/Index.tsx`** — Footer social links section (~line 544-552)
- Add a Discord icon link after the X (Twitter) link in the public landing footer
- Same styling pattern (`h-9 w-9 rounded-lg bg-muted...`)

Both will use a simple Discord SVG icon (the gamepad/controller logo) and open the link in a new tab.

