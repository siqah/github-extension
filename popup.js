
const GITHUB_TOKEN = "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";
const API_URL = "https://api.github.com/graphql";

document.getElementById("searchButton").addEventListener("click", async () => {
  const queryText = document.getElementById("searchInput").value.trim();
  if (!queryText) return alert("Please enter a search term!");

  const query = `
    query {
      search(query: "${queryText}", type: REPOSITORY, first: 5) {
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

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GITHUB_TOKEN}`
    },
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  displayResults(data.data.search.nodes);
});

function displayResults(repos) {
  const resultsList = document.getElementById("results");
  resultsList.innerHTML = "";

  repos.forEach(repo => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${repo.url}" target="_blank">${repo.name} by ${repo.owner.login} ⭐ ${repo.stargazerCount}</a>`;
    resultsList.appendChild(li);
  });
}

