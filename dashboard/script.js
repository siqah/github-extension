// script.js
document.addEventListener("DOMContentLoaded", () => {
    const openPrs = document.getElementById("open-prs");
    const assignedIssues = document.getElementById("assigned-issues");
    const pendingReviews = document.getElementById("pending-reviews");
    const repoStats = document.getElementById("repo-stats");
    const notificationsList = document.getElementById("notifications-list");
    const connectGitHubButton = document.getElementById("connect-github-button");

    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    let GITHUB_TOKEN;

    // Check for existing token in storage
    chrome.storage.local.get("githubToken", (data) => {
        if (data.githubToken) {
            GITHUB_TOKEN = data.githubToken;
            fetchGitHubData();
            fetchNotifications();
        }
    });

    connectGitHubButton.addEventListener("click", () => {
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,notifications`;
        chrome.tabs.create({ url: authUrl });
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "oauthCallback") {
            const code = request.code;
            exchangeCodeForToken(code);
        }
    });

    async function exchangeCodeForToken(code) {
        try {
            const response = await fetch("https://github.com/login/oauth/access_token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    code: code
                })
            });

            const data = await response.json();
            const accessToken = data.access_token;

            if (accessToken) {
                chrome.storage.local.set({ githubToken: accessToken }, () => {
                    GITHUB_TOKEN = accessToken;
                    fetchGitHubData();
                    fetchNotifications();
                });
            } else {
                console.error("Failed to get access token:", data);
            }
        } catch (error) {
            console.error("Error exchanging code for token:", error);
        }
    }

    async function fetchGitHubData() {
        if (!GITHUB_TOKEN) return; // Exit if no token

        try {
            const response = await fetch(`https://api.github.com/user/events`, { // Get events of the authenticated user.
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`
                }
            });
            const data = await response.json();

            openPrs.textContent = data.filter(event => event.type === "PullRequestEvent").length;
            assignedIssues.textContent = data.filter(event => event.type === "IssuesEvent").length;
            pendingReviews.textContent = data.filter(event => event.type === "PullRequestReviewEvent").length;

            repoStats.innerHTML = data.slice(0, 5).map(event => `<li>${event.repo.name}</li>`).join('');

        } catch (error) {
            console.error("Error fetching GitHub data", error);
        }
    }

    async function fetchNotifications() {
        if (!GITHUB_TOKEN) return; // Exit if no token
        try {
            const response = await fetch("https://api.github.com/notifications", {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`
                }
            });
            const data = await response.json();
            notificationsList.innerHTML = data.map(n => `<li>${n.subject.title}</li>`).join('');
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    }
});