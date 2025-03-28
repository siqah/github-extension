const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
    chrome.runtime.sendMessage({ action: "oauthCallback", code: code });
} else {
    console.error("No code received from GitHub.");
}