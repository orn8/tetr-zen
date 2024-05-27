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

- **Simple usage:** You only have to run 2 commands on the console to review your stats.
- **Variety of statistics:** Get to see your total logs, current level and score, and how much score you earn in a period of time on average.

## Installation

1) [Download](https://github.com/orn8/tetr-zen/archive/refs/heads/main.zip) and extract the source code.
2) Install [node.js](https://nodejs.org/en).
3) In the console, `dir` (or `cd`) into the extracted `tetr-zen` directory.
4) Run `npm install`
5) Open `fetchZen.mjs` and change the `username` constant at the bottom of the file to your TETR.IO username.

## Usage

1) To log your current ZEN progress, run `npm run fetchZen`.
2) To view your ZEN statistics, run `npm run zenStats`.
