let repositories = [
    { name: 'intel/torch-xpu-ops', checked: true, valid: true },
    { name: 'pytorch/pytorch', checked: true, valid: true },
    { name: 'pytorch/kineto', checked: true, valid: true },
    { name: 'uxlfoundation/oneDNN', checked: false, valid: true },
    { name: 'vllm-project/vllm-gaudi', checked: false, valid: true }
];

// --- Authentication ---

function getAuthHeaders() {
    const token = localStorage.getItem('githubPAT');
    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    return {};
}

async function connectWithToken() {
    const input = document.getElementById('tokenInput');
    const errorEl = document.getElementById('authErrorMessage');
    const token = input.value.trim();
    errorEl.textContent = '';

    if (!token) {
        errorEl.textContent = '⚠️ Please paste a Classic Personal Access Token (ghp_...)';
        return;
    }

    try {
        const resp = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resp.ok) {
            errorEl.textContent = '❌ Invalid token — GitHub returned ' + resp.status;
            return;
        }

        const user = await resp.json();
        localStorage.setItem('githubPAT', token);
        input.value = '';
        await updateAuthStatus(user);
        // Re-validate repos with new auth
        repositories.forEach(r => { r.valid = undefined; });
        validateAllRepositories();
    } catch (e) {
        errorEl.textContent = '❌ Network error while validating token';
    }
}

function disconnectToken() {
    localStorage.removeItem('githubPAT');
    updateAuthStatus(null);
    // Re-validate repos (some may become inaccessible)
    repositories.forEach(r => { r.valid = undefined; });
    validateAllRepositories();
}

async function updateAuthStatus(user) {
    const statusEl = document.getElementById('authStatus');
    const statusText = document.getElementById('authStatusText');
    const inputWrapper = document.getElementById('authInputWrapper');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const errorEl = document.getElementById('authErrorMessage');
    errorEl.textContent = '';

    const token = localStorage.getItem('githubPAT');

    if (!token) {
        statusEl.className = 'auth-status unauthenticated';
        statusEl.querySelector('.auth-status-icon').innerHTML = '🔒';
        statusText.textContent = 'Access to private repositories requires PAT';
        inputWrapper.style.display = 'flex';
        disconnectBtn.style.display = 'none';
        return;
    }

    // If no user object passed, fetch it
    if (!user) {
        try {
            const resp = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                localStorage.removeItem('githubPAT');
                return await updateAuthStatus(null);
            }
            user = await resp.json();
        } catch (e) {
            localStorage.removeItem('githubPAT');
            return await updateAuthStatus(null);
        }
    }

    statusEl.className = 'auth-status authenticated';
    statusEl.querySelector('.auth-status-icon').innerHTML = '🟢';
    // Build status text safely without using innerHTML
    statusText.textContent = 'Signed in as ';
    const profileLink = document.createElement('a');
    profileLink.href = 'https://www.github.com/' + encodeURIComponent(user.login);
    const strongEl = document.createElement('strong');
    strongEl.textContent = user.login;
    profileLink.appendChild(strongEl);
    statusText.appendChild(profileLink);
    inputWrapper.style.display = 'none';
    disconnectBtn.style.display = 'inline-block';
}

function getPreferredTheme() {
    const savedTheme = localStorage.getItem('githubActivityTheme');
    if (savedTheme) {
        return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
    const stylesheet = document.getElementById('theme-stylesheet');
    const themeIcon = document.querySelector('.theme-icon');
    
    if (theme === 'dark') {
        stylesheet.href = 'style-dark.css';
        themeIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    } else {
        stylesheet.href = 'style-light.css';
        themeIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    }
    
    localStorage.setItem('githubActivityTheme', theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('githubActivityTheme') || getPreferredTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('githubActivityTheme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

function loadRepositoriesFromCache() {
    const cached = localStorage.getItem('githubActivityRepos');
    if (cached) {
        try {
            repositories = JSON.parse(cached);
        } catch (e) {
            console.warn('Failed to load cached repositories');
        }
    }
}

function saveRepositoriesToCache() {
    localStorage.setItem('githubActivityRepos', JSON.stringify(repositories));
}

async function validateRepository(repoName) {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoName}`, {
            method: 'HEAD',
            headers: getAuthHeaders()
        });
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function validateAllRepositories() {
    for (let i = 0; i < repositories.length; i++) {
        if (repositories[i].valid === undefined) {
            repositories[i].valid = await validateRepository(repositories[i].name);
        }
    }
    saveRepositoriesToCache();
    renderRepoList();
}

function renderRepoList() {
    const listElement = document.getElementById('repoList');
    
    let html = '';
    repositories.forEach((repo, index) => {
        const validClass = repo.valid ? '' : 'repo-invalid';
        const disabledAttr = repo.valid ? '' : 'disabled';
        const checkedAttr = (repo.checked && repo.valid) ? 'checked' : '';
        html += `
            <div class="repo-item ${validClass}">
                <div class="repo-checkbox-wrapper">
                    <input type="checkbox" id="repo-${index}" ${checkedAttr} ${disabledAttr} onchange="toggleRepo(${index})">
                    <label for="repo-${index}" class="checkbox-label"></label>
                    <a href="https://github.com/${repo.name}" target="_blank" class="repo-link">${repo.name}</a>
                </div>
                <button class="remove-btn" onclick="removeRepo(${index})">×</button>
            </div>
        `;
    });
    
    listElement.innerHTML = html;
}

function toggleRepo(index) {
    repositories[index].checked = !repositories[index].checked;
    saveRepositoriesToCache();
}

async function addCustomRepo() {
    const customRepoInput = document.getElementById('customRepo');
    const repoValue = customRepoInput.value.trim();
    const repoErrorElement = document.getElementById('repoErrorMessage');

    if (!repoValue || !repoValue.match(/^[\w-]+\/[\w.-]+$/)) {
        repoErrorElement.textContent = '⚠️ Please enter a valid repository format: owner/repo';
        return;
    }

    if (repositories.some(r => r.name === repoValue)) {
        repoErrorElement.textContent = '⚠️ This repository is already added';
        return;
    }

    repoErrorElement.textContent = '';
    const isValid = await validateRepository(repoValue);
    
    repositories.push({ name: repoValue, checked: true, valid: isValid });
    saveRepositoriesToCache();
    renderRepoList();
    customRepoInput.value = '';
    
    if (!isValid) {
        repoErrorElement.textContent = `⚠️ Repository "${repoValue}" does not exist or is not accessible.`;
    }
}

function removeRepo(index) {
    repositories.splice(index, 1);
    saveRepositoriesToCache();
    renderRepoList();
    // Clear error message when repo is removed
    const repoErrorElement = document.getElementById('repoErrorMessage');
    if (repoErrorElement) {
        repoErrorElement.textContent = '';
    }
}

function getSelectedRepos() {
    return repositories.filter(r => r.checked).map(r => r.name);
}

// Convert date from DD-MM-YYYY to YYYY-MM-DD for GitHub API
function convertToAPIFormat(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
    }
    return dateStr;
}

async function loadUserAndPRs() {
    const errorElement = document.getElementById('userErrorMessage');
    const prList = document.getElementById('prList');
    errorElement.textContent = '';
    
    const username = document.getElementById('usernameInput').value.trim();
    const selectedRepos = getSelectedRepos();
    
    if (!username) {
        errorElement.textContent = '⚠️ Please enter a username';
        return;
    }
    
    if (selectedRepos.length === 0) {
        errorElement.textContent = '⚠️ Please select at least one repository';
        return;
    }
    
    try {
        const userResponse = await fetch(`https://api.github.com/users/${username}`, {
            headers: getAuthHeaders()
        });
        
        if (!userResponse.ok) {
            errorElement.textContent = '❌ User not found';
            return;
        }
        
        const userData = await userResponse.json();

        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
        
        document.getElementById('avatar').src = userData.avatar_url;
        const loginLink = document.getElementById('userLogin');
        loginLink.textContent = userData.login;
        loginLink.href = `https://github.com/${userData.login}`;
        prList.innerHTML = '<p style="color: #8b949e;">Loading PRs...</p>';
        
        let allUserPRs = [];
        
        // Get dates and convert from DD-MM-YYYY to YYYY-MM-DD for GitHub API
        const startDateInput = document.getElementById('startDate').value;
        const endDateInput = document.getElementById('endDate').value;
        
        const startDate = startDateInput ? convertToAPIFormat(startDateInput) : '';
        const endDate = endDateInput ? convertToAPIFormat(endDateInput) : '';
        
        for (const repo of selectedRepos) {
            try {
                let searchQuery = `repo:${repo} author:${username} type:pr created:${startDate}..${endDate}`;
                const prResponse = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&per_page=100`, {
                    headers: getAuthHeaders()
                });
                
                if (!prResponse.ok) {
                    console.warn(`Failed to load PRs from ${repo}`);
                    continue;
                }
                
                const searchResults = await prResponse.json();
                
                // Fetch full PR details to get merged status
                for (const issue of searchResults.items) {
                    try {
                        const prDetailUrl = issue.pull_request.url;
                        const prDetailResponse = await fetch(prDetailUrl, {
                            headers: getAuthHeaders()
                        });
                        
                        if (prDetailResponse.ok) {
                            const prDetail = await prDetailResponse.json();
                            allUserPRs.push({...issue, ...prDetail, repoName: repo});
                        } else {
                            allUserPRs.push({...issue, repoName: repo});
                        }
                    } catch (err) {
                        console.warn(`Error loading PR details:`, err);
                        allUserPRs.push({...issue, repoName: repo});
                    }
                }
            } catch (err) {
                console.warn(`Error loading PRs from ${repo}:`, err);
            }
        }
        
        if (allUserPRs.length === 0) {
            prList.innerHTML = '<p style="color: #8b949e;">No PRs found for this user in selected repositories</p>';
            return;
        }
        
        // Store globally for download functionality
        window.allPRs = allUserPRs;
        
        // Sort by creation date (newest first)
        allUserPRs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Calculate stats
        let openCount = 0, mergedCount = 0, closedCount = 0;
        allUserPRs.forEach(pr => {
            if (pr.merged_at || pr.pull_request?.merged_at) {
                mergedCount++;
            } else if (pr.state === 'closed') {
                closedCount++;
            } else if (pr.state === 'open') {
                openCount++;
            }
        });
        
        // Update stats display
        document.getElementById('openCount').textContent = openCount;
        document.getElementById('mergedCount').textContent = mergedCount;
        document.getElementById('closedCount').textContent = closedCount;
        
        // Display PRs
        let html = '';
        allUserPRs.forEach((pr, index) => {
            // Determine actual status (merged, closed, open)
            let status, statusColor, statusIcon;
            if (pr.merged_at || pr.pull_request?.merged_at) {
                status = 'merged';
                statusColor = '#a371f7';
                statusIcon = '<svg class="pr-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.254V3.25v.005a.75.75 0 110-.005v.004zm.45 1.9a2.25 2.25 0 10-1.95.218v5.256a2.25 2.25 0 101.5 0V7.123A5.735 5.735 0 009.25 9h1.378a2.251 2.251 0 100-1.5H9.25a4.25 4.25 0 01-3.8-2.346zM12.75 9a.75.75 0 100-1.5.75.75 0 000 1.5zm-8.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5z"></path></svg>';
            } else if (pr.state === 'closed') {
                status = 'closed';
                statusColor = '#f85149';
                statusIcon = '<svg class="pr-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"/></svg>';
            } else {
                status = 'open';
                statusColor = '#3fb950';
                statusIcon = '<svg class="pr-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/></svg>';
            }
            
            html += `
                <div class="pr-item">
                    <div class="pr-content">
                        <div class="pr-repo-tag">${pr.repoName}</div>
                        <span class="pr-status" style="color: ${statusColor};">
                            ${statusIcon} ${status.toUpperCase()}
                        </span>
                        <a href="${pr.html_url}" target="_blank" class="pr-title">
                            #${pr.number}: ${pr.title}
                        </a>
                        <div class="pr-meta">
                            Created: ${new Date(pr.created_at).toLocaleDateString('pl-PL')}
                            ${pr.merged_at ? ` | Merged: ${new Date(pr.merged_at).toLocaleDateString('pl-PL')}` : ''}
                        </div>
                    </div>
                    <input type="checkbox" id="pr-${index}" class="pr-checkbox" onchange="updateDownloadButton()">
                    <label for="pr-${index}" class="pr-checkbox-label"></label>
                </div>
            `;
        });
        
        prList.innerHTML = html;
        updateDownloadButton();
        
    } catch (err) {
        errorElement.textContent = '❌ Network error. Try again.';
        prList.innerHTML = '';
    }
}

function updateDownloadButton() {
    const checkboxes = document.querySelectorAll('.pr-checkbox:checked');
    const downloadBtn = document.getElementById('downloadBtn');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const selectedCount = document.getElementById('selectedCount');
    const hasPAT = !!localStorage.getItem('githubPAT');
    
    // Update selected visual state for all PR items
    document.querySelectorAll('.pr-item').forEach(item => {
        const checkbox = item.querySelector('.pr-checkbox');
        if (checkbox && checkbox.checked) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    if (checkboxes.length > 0) {
        selectedCount.textContent = `(${checkboxes.length} selected)`;
        downloadBtn.disabled = false;
        summarizeBtn.disabled = !hasPAT;
        summarizeBtn.title = hasPAT ? '' : 'Requires a Classic PAT (ghp_...)';
    } else {
        selectedCount.textContent = '';
        downloadBtn.disabled = true;
        summarizeBtn.disabled = true;
        summarizeBtn.title = 'Requires a Classic PAT (ghp_...)';
    }
}

async function downloadSelectedDiffs() {
    const checkboxes = document.querySelectorAll('.pr-checkbox:checked');
    if (checkboxes.length === 0) return;
    
    const downloadBtn = document.getElementById('downloadBtn');
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Downloading...';
    downloadBtn.disabled = true;
    
    try {
        const zip = new JSZip();
        
        for (const checkbox of checkboxes) {
            const index = parseInt(checkbox.id.split('-')[1]);
            const pr = window.allPRs[index];
            
            try {
                // Fetch the diff using GitHub API
                const response = await fetch(pr.pull_request.url, {
                    headers: {
                        'Accept': 'application/vnd.github.v3.diff',
                        ...getAuthHeaders()
                    }
                });
                
                if (response.ok) {
                    const diffContent = await response.text();
                    const filename = `${pr.repoName.replace('/', '-')}-${pr.number}.diff`;
                    zip.file(filename, diffContent);
                }
            } catch (err) {
                console.warn(`Failed to download diff for PR #${pr.number}:`, err);
            }
        }
        
        // Generate and download the zip file
        const content = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pr-diffs-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (err) {
        console.error('Error creating zip:', err);
        alert('Failed to download diffs. Please try again.');
    } finally {
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }
}

function closeSummary() {
    const summaryEl = document.getElementById('summaryResults');
    summaryEl.style.display = 'none';
    summaryEl.innerHTML = '';
}

async function callModelsAPI(token, messages) {
    const models = ['anthropic/claude-opus-4', 'openai/gpt-4o-mini'];
    for (const model of models) {
        const resp = await fetch('https://models.github.ai/inference/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model, messages, max_tokens: 300 })
        });
        if (resp.ok) {
            const data = await resp.json();
            return { ok: true, model, content: data.choices?.[0]?.message?.content?.trim() || '' };
        }
        // If 401/403/404, try next model; otherwise report error
        if (resp.status !== 401 && resp.status !== 403 && resp.status !== 404) {
            return { ok: false, model, error: resp.status };
        }
    }
    return { ok: false, model: null, error: 'No accessible model' };
}

async function summarizeSelectedPRs() {
    const checkboxes = document.querySelectorAll('.pr-checkbox:checked');
    if (checkboxes.length === 0) return;

    const token = localStorage.getItem('githubPAT');
    if (!token) return;

    const summarizeBtn = document.getElementById('summarizeBtn');
    const summaryEl = document.getElementById('summaryResults');
    const originalText = summarizeBtn.textContent;
    summarizeBtn.textContent = 'Summarizing...';
    summarizeBtn.disabled = true;

    summaryEl.style.display = 'block';
    summaryEl.innerHTML = '<div class="summary-loading">Generating summaries…</div>';

    const selectedPRs = [];
    for (const checkbox of checkboxes) {
        const index = parseInt(checkbox.id.split('-')[1]);
        selectedPRs.push(window.allPRs[index]);
    }

    const summaries = [];
    let usedModel = null;
    for (const pr of selectedPRs) {
        let diffSnippet = '';
        try {
            const diffResp = await fetch(pr.pull_request.url, {
                headers: {
                    'Accept': 'application/vnd.github.v3.diff',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (diffResp.ok) {
                const fullDiff = await diffResp.text();
                diffSnippet = fullDiff.substring(0, 12000);
            }
        } catch (e) {
            // proceed without diff
        }

        const prompt = `Provide a brief, professional summary of this GitHub Pull Request for formal reporting.

Your summary should concisely explain:
1. What does this PR accomplish? (new feature, bug fix, refactor, performance improvement, etc.)
2. Why was it needed? What problem or opportunity does it address?

Guidelines:
- Keep it short and focused (aim for 1-3 sentences, max 1 short paragraph)
- Write in flowing professional prose, not bullet points
- Do NOT repeat the PR title, URL, or link in your description
- Do NOT start with generic phrases like "This PR includes changes to..." or "This pull request enhances "
- Focus on substance: what changed and why it matters
- Use plain text only, no markdown formatting

PR Details:
Title: ${pr.title}
Body: ${(pr.body || '').substring(0, 3000)}

Diff (truncated):
${diffSnippet}`;

        try {
            const messages = [
                { role: 'system', content: 'You are an expert technical analyst specializing in code review and architectural assessment. Your task is to provide clear, insightful summaries of pull requests for formal review by technical and non-technical stakeholders, including government agencies. Focus on context, reasoning, and impact — not just listing changes.' },
                { role: 'user', content: prompt }
            ];
            const result = await callModelsAPI(token, messages);
            if (result.ok) {
                usedModel = result.model;
                summaries.push({ pr, description: result.content || 'Summary unavailable' });
            } else {
                summaries.push({ pr, description: `Summary unavailable (${result.error})` });
            }
        } catch (e) {
            summaries.push({ pr, description: 'Summary unavailable (network error)' });
        }
    }

    // Render summaries
    const modelLabel = usedModel ? usedModel.split('/').pop() : '';
    let html = '<div class="summary-section-header"><span>PR Summaries' + (modelLabel ? ` <small style="opacity:0.5;font-weight:400;">via ${modelLabel}</small>` : '') + '</span><button class="summary-close-btn" onclick="closeSummary()" title="Close">\u00d7</button></div>';
    for (const s of summaries) {
        const safeLink = s.pr.html_url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const safeTitle = (s.pr.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeDesc = (s.description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `<div class="summary-item">
            <div class="summary-item-link"><span class="summary-label">PR link:</span> <a href="${safeLink}" target="_blank">${safeLink}</a></div>
            <div class="summary-item-title"><span class="summary-label">Title:</span> ${safeTitle}</div>
            <div class="summary-item-description"><span class="summary-label">Description:</span> ${safeDesc}</div>
        </div>`;
    }
    summaryEl.innerHTML = html;

    summarizeBtn.textContent = originalText;
    summarizeBtn.disabled = false;
}

function setLast31Days() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 31);
    
    // Use Flatpickr's setDate to properly update the pickers
    if (startDatePicker) {
        startDatePicker.setDate(startDate, true);
    }
    if (endDatePicker) {
        endDatePicker.setDate(endDate, true);
    }
}

function validateDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate && startDate > endDate) {
        // If start date is after end date, adjust end date to match start date
        document.getElementById('endDate').value = startDate;
    }
}

let startDatePicker, endDatePicker;

function initializeDates() {
    // Initialize Flatpickr for start date
    startDatePicker = flatpickr("#startDate", {
        dateFormat: "d-m-Y",
        altInput: true,
        altFormat: "d-m-Y",
        onChange: function(selectedDates, dateStr) {
            // Auto-adjust end date if it's before the new start date
            if (endDatePicker) {
                const endDateValue = document.getElementById('endDate').value;
                if (endDateValue) {
                    const endDateObj = endDatePicker.parseDate(endDateValue, "d-m-Y");
                    const startDateObj = selectedDates[0];
                    if (endDateObj && startDateObj && endDateObj < startDateObj) {
                        endDatePicker.setDate(startDateObj, true);
                    }
                }
            }
        }
    });
    
    // Initialize Flatpickr for end date
    endDatePicker = flatpickr("#endDate", {
        dateFormat: "d-m-Y",
        altInput: true,
        altFormat: "d-m-Y",
        onChange: function(selectedDates, dateStr) {
            // Auto-adjust start date if it's after the new end date
            if (startDatePicker) {
                const startDateValue = document.getElementById('startDate').value;
                if (startDateValue) {
                    const startDateObj = startDatePicker.parseDate(startDateValue, "d-m-Y");
                    const endDateObj = selectedDates[0];
                    if (startDateObj && endDateObj && startDateObj > endDateObj) {
                        startDatePicker.setDate(endDateObj, true);
                    }
                }
            }
        }
    });
    
    setLast31Days();
}

document.addEventListener('DOMContentLoaded', () => {
    setTheme(getPreferredTheme());
    updateAuthStatus(null);
    
    initializeDates();
    loadRepositoriesFromCache();
    renderRepoList();
    validateAllRepositories();
    
    document.getElementById('usernameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadUserAndPRs();
        }
    });
    
    document.getElementById('customRepo').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCustomRepo();
        }
    });
    
    document.getElementById('tokenInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            connectWithToken();
        }
    });
});
