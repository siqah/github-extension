document.getElementById("searchBtn").addEventListener("click", function() {
    const query = document.getElementById("searchInput").value;
    chrome.tabs.create({ url: `https://github.com/search?q=${encodeURIComponent(query)}` });
});
