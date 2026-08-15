# Bleach Draft Legacy

Bleach Draft - Complete Website Project

Build a production-quality web application called Bleach Draft.

This should look and feel like a premium Bleach fan experience, not a generic website.

General Requirements

Mobile-first design.

Fully responsive for desktop, tablet and mobile.

Modern UI.

Fast performance.

Clean animations.

TypeScript.

React + Next.js.

Tailwind CSS.

Clean scalable architecture.

Reusable components.

Dark theme.

Languages

Support:

English

Arabic

Requirements:

Instant language switching.

Proper RTL support.

Proper LTR support.

Every page should work perfectly in both languages.

Visual Style

Inspired by:

Soul Society

Thousand-Year Blood War

Reiatsu

Senkaimon

Primary colors:

Black

White

Orange

Light Blue

Avoid:

Generic Bootstrap styling.

Cheap gradients.

Overly colorful UI.

The website should feel premium and elegant.

Homepage

Include:

Bleach Draft logo

Animated background

Reiatsu particles

Large "Start Draft" button

Language switcher

Clean navigation

Gameplay

The player starts a draft.

The player has:

5 empty team slots.

3 skips.

Only ONE character appears at a time.

Each character card displays:

Official image

Character name

Buttons:

Add to Team

Skip

If skipped:

The character never appears again during the same draft.

After 3 skips:

Disable the Skip button.

Once 5 characters are selected:

Show the Result Screen.

Team UI

Always display:

Team

Slot 1

Slot 2

Slot 3

Slot 4

Slot 5

Selected characters immediately fill the slots.

Character Database

Create the project so it supports a scalable database.

Do NOT hardcode characters.

Each character should support:

id

slug

English name

Arabic name

Race

Faction

Division

Rank

Arc

Shikai

Bankai

Official image

Rarity

Attack

Defense

Speed

Reiatsu

Intelligence

Technique

Potential

Overall

Tags

Use temporary mock data for now.

The architecture must easily support over 300 characters later.

Character Rarity

Support weighted appearance.

Rarity levels:

Common

Rare

Epic

Legendary

Ultra Rare

Characters should not all have equal appearance rates.

Result Screen

Display:

Selected team

Animated stat bars

Attack

Defense

Speed

Reiatsu

Intelligence

Technique

Potential

Overall Team Score

Rank:

B

A

A+

S

SS

SS+

Buttons:

Play Again

Share Result

UI Requirements

The UI should feel alive.

Include:

Smooth transitions.

Soft glow effects.

Subtle Reiatsu animations.

Beautiful typography.

Excellent spacing.

Premium card design.

Clean loading states.

Responsive touch interactions.

Avoid excessive animations.

Code Quality

Write production-quality code.

Keep the project modular.

Separate:

Components

Assets

Localization

Styles

Utilities

Data models

Avoid duplicate code.

Use best practices.

Images

Prepare the project to use ONLY official Bleach artwork or official anime images.

Do not generate AI images.

Do not use fan art.

If no verified official image exists, leave the image field empty.

Future Scalability

Design the architecture so future features can be added easily, including:

Accounts

Leaderboards

Ranked mode

Daily challenges

Achievements

Statistics

More Bleach game modes

Even if they are not implemented now, the project structure should already support future expansion.

Final Goal

Build the highest-quality Bleach Draft website possible.

If you believe there is a better UX, better UI, better architecture or better implementation than requested, improve it.

Prioritize:

User experience

Visual quality

Performance

Mobile usability

Clean architecture

Scalability

Maintainability

Take your time and build this like a premium commercial web application, not a prototype.

Important Notes

Do not build the final Bleach character database yet.

Do not populate the game with hundreds of characters at this stage.

Do not scrape or invent character information.

Do not use AI-generated, fan-made, or unofficial images.

Use only a small set of temporary mock characters (around 10–20) to demonstrate that the gameplay works.

Focus entirely on building a polished, production-quality website and game mechanics first.

The complete canon character database and verified official images will be added later in a separate phase after the website is finished.

Write the code in a way that makes adding 100–300+ canon characters later as simple as importing a new dataset, without requiring changes to the game logic.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bleacharena.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c2a6261f-1612-437a-86d4-4dcdacf22919).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
