<div align="center">
  <h1 align="center">tetr-zen</h1>
  <h3>ZEN statsistics for TETR.IO.</h3>
</div>

<br/>

<div align="center">
  <a href="https://github.com/orn8/tetr-zen/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/orn8/tetr-zen?style=for-the-badge"></a>
  <a href="https://github.com/orn8/tetr-zen/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-AGPLv3-purple?style=for-the-badge"></a>
</div>

<br/>

tetr-zen is a node.js program to log and summarise your ZEN progression on TETR.IO.

> [!NOTE]
> This is a work in progress. Please report issues and feel free to request new features.

## Current Features:

- **Simple usage:** Just 2 commands away from your stats.
- **Variety of statistics:** View your total logs, current level and score, how much has been earned in the past day, and more!
- **Personal bests:** Review your best and quickest improvements with ease.

> [!IMPORTANT]
> tetr-zen uses *your* ZEN score logs to view your stats, it does not store a history of ZEN scores for other users.

## Upcoming Features

- [ ] Timezone support
- [ ] Time travel system (view your stats from a specific point in time from your logs)
- [ ] Chart system (display progression through a chart)
 
## Installation

1) [Download](https://github.com/orn8/tetr-zen/archive/refs/heads/main.zip) and extract the source code.
2) Install [node.js](https://nodejs.org/en).
3) In the console, `dir` (or `cd`) into the extracted `tetr-zen` directory.
4) Run `npm install`
5) Open `fetchZen.mjs` and change the `username` constant at the bottom of the file to your TETR.IO username (`zen` by default).

## Usage

1) To log your current ZEN score, run `npm run fetchZen`.
2) To view your ZEN statistics, run `npm run zenStats`.

<br/>
<br/>
<br/>

<blockquote>

### Inspiration

* [TETRIOStatTools](https://github.com/AbyssPortal/TETRIOStatTools) by AbyssPortal

</blockquote>
