chrome.commands.onCommand.addListener((command) => {
    if (command === "open-search") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: openSearchBox
            });
        });
    }
});

function openSearchBox() {
    document.querySelector("input[placeholder='Search GitHub...']").focus();
}
