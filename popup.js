
const API_URL = "https://api.github.com/graphql";
GITHUB_CLIENT_ID = "Ov23liVnyeY4KbkZaT4a";

// Function to check login status and update UI
function updateUIForLoginStatus() {
  const token = localStorage.getItem("githubToken");
  const loginButton = document.getElementById("loginButton");
  const giteaseButton = document.getElementById("giteasebutton");
  const searchButton = document.getElementById("searchButton");

  if (token) {
      loginButton.style.display = "none";
      giteaseButton.style.display = "inline-block";
      searchButton.disabled = false;
  } else {
      loginButton.style.display = "inline-block";
      giteaseButton.style.display = "none";
      searchButton.disabled = true;
  }
}

// Function to handle GitHub login
function handleGitHubLogin() {
  chrome.identity.launchWebAuthFlow(
        {
            url: `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo`,
            interactive: true,
        },
        (redirectUrl) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }

            const url = new URL(redirectUrl);
            const code = url.searchParams.get("code");

            if (code) {
                fetch(`/.netlify/functions/github-token?code=${code}`)
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.access_token) {
                            localStorage.setItem("githubToken", data.access_token);
                            updateUIForLoginStatus();
                        } else {
                            console.error("Token exchange failed:", data);
                            alert("Login failed.");
                        }
                    })
                    .catch((error) => {
                        console.error("Error getting access token:", error);
                        alert("Login failed. Check console.");
                    });
            }
        }
    );
}

async function fetchGitHubData(gqlQuery, token) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: gqlQuery }),
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.errors) {
            throw new Error(`GitHub GraphQL errors: ${JSON.stringify(data.errors)}`);
        }
        return data.data.search.nodes;
    } catch (error) {
        console.error("Error fetching GitHub data:", error);
        alert(`Failed to fetch GitHub data: ${error.message}`);
        return null;
    }
}

function buildGraphQLQuery(queryText, searchType, language, minStars, sortOption) {
    let searchQuery = `${queryText}`;
    let sortQuery = "";

    if (language && searchType === "repository") searchQuery += ` language:${language}`;
    if (minStars && searchType === "repository") searchQuery += ` stars:>${minStars}`;

    if (sortOption === "stars-desc") sortQuery = "sort:stars-desc";
    else if (sortOption === "stars-asc") sortQuery = "sort:stars-asc";

    let gqlQuery = "";

    switch (searchType) {
        case "repository":
            gqlQuery = `
                query {
                    search(query: "${searchQuery} ${sortQuery}", type: REPOSITORY, first: 5) {
                        nodes {
                            ... on Repository {
                                name
                                url
                                stargazerCount
                                owner {
                                    login
                                }
                            }
                        }
                    }
                }
            `;
            break;
        case "issue":
            gqlQuery = `
                query {
                    search(query: "${searchQuery}", type: ISSUE, first: 5) {
                        nodes {
                            ... on Issue {
                                title
                                url
                                repository {
                                    nameWithOwner
                                }
                            }
                        }
                    }
                }
            `;
            break;
        case "pr":
            gqlQuery = `
                query {
                    search(query: "${searchQuery}", type: ISSUE, first: 5) {
                        nodes {
                            ... on PullRequest {
                                title
                                url
                                repository {
                                    nameWithOwner
                                }
                            }
                        }
                    }
                }
            `;
            break;
        default:
            return null;
    }
    return gqlQuery;
}

// --- Search Functionality ---

document.getElementById("searchButton").addEventListener("click", async () => {
    const queryText = document.getElementById("searchInput").value.trim();
    const searchType = document.getElementById("searchType").value;
    const language = document.getElementById("languageSelect").value;
    const minStars = document.getElementById("minStars").value;
    const sortOption = document.getElementById("sortSelect").value;
    const GITHUB_TOKEN = localStorage.getItem("githubToken");

    if (!queryText) return alert("Please enter a search term!");
    if (!GITHUB_TOKEN) return alert("Please log in with GitHub.");

    const gqlQuery = buildGraphQLQuery(queryText, searchType, language, minStars, sortOption);
    if (!gqlQuery) return alert("Invalid search type.");

    const results = await fetchGitHubData(gqlQuery, GITHUB_TOKEN);
    if (results) {
        displayResults(results, searchType);
    }
});

function displayResults(items, type) {
    const resultsList = document.getElementById("results");
    resultsList.innerHTML = "";

    items.forEach((item) => {
        const li = document.createElement("li");
        if (type === "repository") {
            li.innerHTML = `<a href="${item.url}" target="_blank">${item.name} by ${item.owner.login} ⭐ ${item.stargazerCount}</a>
                <button class="bookmark-btn" data-url="${item.url}" data-name="${item.name}">⭐ Bookmark</button>`;
        } else {
            li.innerHTML = `<a href="${item.url}" target="_blank">${item.title} (${item.repository.nameWithOwner})</a>`;
        }
        resultsList.appendChild(li);
    });

    document.querySelectorAll(".bookmark-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const repo = {
                name: btn.getAttribute("data-name"),
                url: btn.getAttribute("data-url"),
            };
            saveBookmark(repo);
        });
    });
}

// --- Bookmark Functionality ---

function saveBookmark(repo) {
    let bookmarks = JSON.parse(localStorage.getItem("githubBookmarks")) || [];
    if (!bookmarks.some((b) => b.url === repo.url)) {
        bookmarks.push(repo);
        localStorage.setItem("githubBookmarks", JSON.stringify(bookmarks));
        loadBookmarks();
    }
}

function loadBookmarks() {
    const bookmarksList = document.getElementById("bookmarks");
    bookmarksList.innerHTML = "";
    let bookmarks = JSON.parse(localStorage.getItem("githubBookmarks")) || [];

    bookmarks.forEach((repo) => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${repo.url}" target="_blank">${repo.name}</a>
            <button class="remove-bookmark" data-url="${repo.url}">❌</button>`;
        bookmarksList.appendChild(li);
    });

    document.querySelectorAll(".remove-bookmark").forEach((btn) => {
        btn.addEventListener("click", () => {
            removeBookmark(btn.getAttribute("data-url"));
        });
    });
}

function removeBookmark(url) {
    let bookmarks = JSON.parse(localStorage.getItem("githubBookmarks")) || [];
    bookmarks = bookmarks.filter((repo) => repo.url !== url);
    localStorage.setItem("githubBookmarks", JSON.stringify(bookmarks));
    loadBookmarks();
}

// --- Template Functionality ---

function loadTemplates() {
    const templateList = document.getElementById("templateList");
    templateList.innerHTML = "";
    const templates = JSON.parse(localStorage.getItem("prTemplates")) || [];

    templates.forEach((template, index) => {
        const li = document.createElement("li");
        li.textContent = template;
        li.style.cursor = "pointer";
        li.onclick = () => selectTemplate(template);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.style.marginLeft = "10px";
        deleteButton.onclick = (event) => {
            event.stopPropagation();
            deleteTemplate(index);
        };

        li.appendChild(deleteButton);
        templateList.appendChild(li);
    });
}

function addTemplate() {
    const newTemplate = document.getElementById("newTemplate").value.trim();
    if (!newTemplate) return;

    const templates = JSON.parse(localStorage.getItem("prTemplates")) || [];
    templates.push(newTemplate);
    localStorage.setItem("prTemplates", JSON.stringify(templates));
    document.getElementById("newTemplate").value = "";
    loadTemplates();
}

function deleteTemplate(index) {
    const templates = JSON.parse(localStorage.getItem("prTemplates")) || [];
    templates.splice(index, 1);
    localStorage.setItem("prTemplates", JSON.stringify(templates));
    loadTemplates();
}

function selectTemplate(template) {
    chrome.storage.sync.set({ selectedPRTemplate: template }, () => {
        alert("Template selected! It will be used in PRs.");
    });
}

// --- Initialization ---

document.addEventListener("DOMContentLoaded", () => {
    loadBookmarks();
    loadTemplates();

    document.getElementById("addTemplate").addEventListener("click", addTemplate);
    document.getElementById("giteasebutton").addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/Dashboard.html") });
    });
});