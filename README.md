# GitHub Activity Summary

> ⚠️ **SECURITY DISCLAIMER** ⚠️
>
> This application accepts a **GitHub Personal Access Token (PAT)** which is stored in your browser's `localStorage` and sent directly to `api.github.com` and `models.github.com` on every API request.
>
> **This app was vibe-coded and has NOT undergone a formal security audit.**
> Use it entirely at your own risk. Never enter tokens with write or admin scopes unless you have reviewed the source code and fully understand the implications. The authors accept no responsibility for any loss, data breach, or account compromise that may result from using this software.

A lightweight, browser-based tool for tracking and summarising GitHub pull request activity across multiple repositories.

https://github.com/user-attachments/assets/b4891091-830f-45d5-991d-c3f80f2563f0

## Features

- **Multi-repo PR tracking** – search for a user's pull requests across any number of GitHub repositories at once
- **Date range filtering** – narrow results to a custom date window or jump straight to the last 31 days
- **Status overview** – instant counts of open, merged, and closed PRs
- **Diff downloads** – select any PRs and download all their diffs in a single ZIP archive
- **AI-powered summaries** – generate a professional summary of selected PRs using GitHub Models (e.g. GPT-4o)
- **Dark / light theme** – toggle between themes; preference is remembered across sessions
- **No server required** – runs entirely in the browser with no build step or installation

## Requirements

- A [GitHub Personal Access Token (classic)](https://github.com/settings/tokens/new) *(optional, but required for private repositories and AI summaries)*

## Getting Started

The app is hosted on GitHub Pages — no installation needed.

👉 **[Open the app](https://silv3s.github.io/github-activity-summary/)**

## Tutorial

### 1. (Optional) Connect a GitHub token

A Personal Access Token unlocks:
- Access to **private repositories**
- **Higher API rate limits**
- The **AI summary** feature

Paste your token into the **GitHub Token (optional)** input field at the top of the page and press **Connect**.  
To create a token, visit **Settings → Developer settings → Personal access tokens (classic)** and enable the `repo` and `read:user` scopes.  
Your token is stored only in your browser's `localStorage` and is never sent anywhere other than `api.github.com`.

### 2. Enter a GitHub username

Type the GitHub username whose pull request activity you want to review into the **Username** field.

### 3. Choose repositories

The sidebar lists a default set of repositories.  Check or uncheck any of them to include or exclude them from the search.

To track an additional repository, type its full name (e.g. `owner/repo`) into the **Add repository** box and press **Enter** or click **Add**.  The app will validate the repository against the GitHub API and add it to the list.  Unrecognised repositories are also added but marked as invalid and excluded from further processing.

### 4. Set a date range

- Use the **date picker** to choose a custom *From – To* window, or
- Click **Last 31 Days** to jump straight to the most recent month.

### 5. Load activity

Click the **Load Activity** button.  
The app queries the GitHub Search API for pull requests that match each selected repository, the given username, and the chosen date range.  Results appear as a table showing the PR title, repository, status, and creation date.

### 6. Download diffs

Check any rows in the results table and click **Download Diffs**.  
All selected PR diffs are fetched and bundled into a ZIP file named `pr_diffs.zip`, with one file per PR named `{owner}-{repo}-{pr-number}.diff`.

### 7. Generate an AI summary

Check the PRs you want summarised and click **Summarize**.  
The app sends each diff to the GitHub Models API (trying `gpt-4o` → `gpt-4-turbo` → `gpt-4o-mini` in order) and displays a concise, professional summary of the work done.  Without a GitHub token the app falls back to the free tier model, which may produce lower-quality summaries. Providing a token is strongly recommended for best results.

### 8. Switch themes

Click the **theme toggle** (☀️ / 🌙) in the top-right corner to switch between light and dark modes.

## License

This project is licensed under the [MIT License](LICENSE).

You are free to copy, fork, extend, and redistribute this software. However, please read the **Security Disclaimer** at the top of this file and in the `LICENSE` file carefully before using or deploying the application. This software is provided **as-is, with no warranty of any kind**.

