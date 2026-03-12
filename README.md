# GitHub Activity Summary

A lightweight, browser-based tool for tracking and summarising GitHub pull request activity across multiple repositories.

https://github.com/user-attachments/assets/b4891091-830f-45d5-991d-c3f80f2563f0

## Features

- **Multi-repo PR tracking** – search for a user's pull requests across any number of GitHub repositories at once
- **Date range filtering** – narrow results to a custom date window or jump straight to the last 31 days
- **Status overview** – instant counts of open, merged, and closed PRs
- **Diff downloads** – select any PRs and download all their diffs in a single ZIP archive
- **AI-powered summaries** – generate a professional plain-English summary of selected PRs using GitHub Models (GPT-4o)
- **Dark / light theme** – toggle between themes; preference is remembered across sessions
- **No server required** – runs entirely in the browser with no build step or installation

## Requirements

- A modern web browser (Chrome, Firefox, Edge, Safari)
- A [GitHub Personal Access Token (classic)](https://github.com/settings/tokens/new) *(optional, but required for private repositories and AI summaries)*

## Getting Started

The app is hosted on GitHub Pages — no installation needed.

👉 **[Open the app](https://silv3s.github.io/github-activity-summary/)**

## Tutorial

### 1. (Optional) Connect a GitHub token

A Personal Access Token unlocks:
- Access to **private repositories**
- **Higher API rate limits** (5,000 req/hr instead of 60)
- The **AI summary** feature

Click the **key icon (🔑)** in the top-right corner, paste your token, and press **Connect**.  
To create a token, visit **Settings → Developer settings → Personal access tokens (classic)** and enable the `repo` and `read:user` scopes.  
Your token is stored only in your browser's `localStorage` and is never sent anywhere other than `api.github.com`.

### 2. Enter a GitHub username

Type the GitHub username whose pull request activity you want to review into the **Username** field.

### 3. Choose repositories

The sidebar lists a default set of repositories.  Check or uncheck any of them to include or exclude them from the search.

To track an additional repository, type its full name (e.g. `owner/repo`) into the **Add repository** box and press **Enter** or click **Add**.  The app will validate the repository against the GitHub API and add it to the list if accessible.

### 4. Set a date range

- Use the **date picker** to choose a custom *From – To* window, or
- Click **Last 31 Days** to jump straight to the most recent month.

### 5. Search

Click **Search** (or press Enter in the username field).  
The app queries the GitHub Search API for pull requests that match each selected repository, the given username, and the chosen date range.  Results appear as a table showing the PR title, repository, status, and creation date.

### 6. Download diffs

Check any rows in the results table and click **Download Diffs**.  
All selected PR diffs are fetched and bundled into a ZIP file named `pr_diffs.zip`, with one file per PR named `{owner}-{repo}-{pr-number}.diff`.

### 7. Generate an AI summary

Check the PRs you want summarised and click **Summarize**.  
The app sends each diff to the GitHub Models API (trying `gpt-4o` → `gpt-4-turbo` → `gpt-4o-mini` in order) and displays a concise, professional summary of the work done.  A valid GitHub token is required for this feature.

### 8. Switch themes

Click the **theme toggle** (☀️ / 🌙) in the top-right corner to switch between light and dark modes. Your preference is saved automatically.

## Configuration

All settings are persisted to the browser's `localStorage` — no config files needed.

| Setting | Key | Description |
|---------|-----|-------------|
| GitHub token | `githubPAT` | Classic Personal Access Token |
| Theme | `githubActivityTheme` | `"dark"` or `"light"` |
| Repository list | `githubActivityRepos` | JSON array of `{ name, checked, valid }` objects |

## License

This project is provided as-is. See the repository for any applicable license information.

