
const GITHUB_TOKEN = "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";
const API_URL = "https://api.github.com/graphql";

document.getElementById("searchButton").addEventListener("click", async () => {
  const queryText = document.getElementById("searchInput").value.trim();
  const searchType = document.getElementById("searchType").value;
  const language = document.getElementById("languageSelect").value;
  const minStars = document.getElementById("minStars").value;
  const sortOption = document.getElementById("sortSelect").value;

  if (!queryText) return alert("Please enter a search term!");

  let searchQuery = `${queryText}`;

  if (language && searchType === "repository") searchQuery += ` language:${language}`;
  if (minStars && searchType === "repository") searchQuery += ` stars:>${minStars}`;

  let sortQuery = "";
  if (sortOption === "stars-desc") sortQuery = "sort:stars-desc";
  else if (sortOption === "stars-asc") sortQuery = "sort:stars-asc";

  let gqlQuery = "";

  if (searchType === "repository") {
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
  } else if (searchType === "issue") {
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
  } else if (searchType === "pr") {
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
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GITHUB_TOKEN}`
      },
      body: JSON.stringify({ query: gqlQuery })
    });

    const data = await response.json();
    displayResults(data.data.search.nodes, searchType);
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    alert("Failed to fetch data. Check your API token.");
  }
});

function displayResults(items, type) {
  const resultsList = document.getElementById("results");
  resultsList.innerHTML = "";

  items.forEach(item => {
    const li = document.createElement("li");
    if (type === "repository") {
      li.innerHTML = `<a href="${item.url}" target="_blank">${item.name} by ${item.owner.login} ⭐ ${item.stargazerCount}</a>
        <button class="bookmark-btn" data-url="${item.url}" data-name="${item.name}">⭐ Bookmark</button>`;
    } else {
      li.innerHTML = `<a href="${item.url}" target="_blank">${item.title} (${item.repository.nameWithOwner})</a>`;
    }
    resultsList.appendChild(li);
  });

  document.querySelectorAll(".bookmark-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const repo = {
        name: btn.getAttribute("data-name"),
        url: btn.getAttribute("data-url")
      };
      saveBookmark(repo);
    });
  });
}

// Save bookmarks to localStorage
function saveBookmark(repo) {
  let bookmarks = JSON.parse(localStorage.getItem("githubBookmarks")) || [];
  if (!bookmarks.some(b => b.url === repo.url)) {
    bookmarks.push(repo);
    localStorage.setItem("githubBookmarks", JSON.stringify(bookmarks));
    loadBookmarks();
  }
}

// Load bookmarks from localStorage
function loadBookmarks() {
  const bookmarksList = document.getElementById("bookmarks");
  bookmarksList.innerHTML = "";
  let bookmarks = JSON.parse(localStorage.getItem("githubBookmarks")) || [];

  bookmarks.forEach(repo => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${repo.url}" target="_blank">${repo.name}</a>
      <button class="remove-bookmark" data-url="${repo.url}">❌</button>`;
    bookmarksList.appendChild(li);
  });

  document.querySelectorAll(".remove-bookmark").forEach(btn => {
    btn.addEventListener("click", () => {
      removeBookmark(btn.getAttribute("data-url"));
    });
  });
}

// Remove bookmark from localStorage
function removeBookmark(url) {
  let bookmarks = JSON.parse(localStorage.getItem("githubBookmarks")) || [];
  bookmarks = bookmarks.filter(repo => repo.url !== url);
  localStorage.setItem("githubBookmarks", JSON.stringify(bookmarks));
  loadBookmarks();
}

// Load bookmarks on popup open
document.addEventListener("DOMContentLoaded", loadBookmarks);


