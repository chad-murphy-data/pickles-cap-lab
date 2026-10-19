# PICKLES Cap Lab

[Play PICKLES Cap Lab](https://chad-murphy-data.github.io/pickles-cap-lab/)

Build your dream pickleball team or draft against 19 computer teams. Each roster has three women and three men, with $500,000–$1 million in assigned player values.

- **Build a team:** Swap players freely and see a team score out of 100.
- **Draft:** Share a player pool with 19 computer teams, then compare the completed rosters.
- **[FAQ](https://chad-murphy-data.github.io/pickles-cap-lab/faq.html):** Rules, player valuations, and how the model works.

Player ratings and prices use the October 7, 2026 snapshot. This is an unofficial fan project, not affiliated with MLP or any tour. Prices are game values, not salaries. Eligibility, availability, and future contracts are not predicted.

## Hosting and local preview

This is a static website published with GitHub Pages from the root of the `main` branch. No build step or server-side service is required. All game calculations run in the browser; progress is stored on the reader’s device. Google Fonts supplies the typefaces.

To preview locally, serve this directory with any static HTTP server, for example `python3 -m http.server 8000`, then open `http://localhost:8000/`.

This repository contains the playable site, its public player data, and scalar scoring benchmarks. It does not contain private review files or benchmark team solutions.

The game uses [PICKLES](https://github.com/chad-murphy-data/pickleball) player ratings.
