// (function() {
//     const searchBox = document.createElement("input");
//     searchBox.type = "text";
//     searchBox.placeholder = "Search GitHub...";
//     searchBox.style = `
//         position: fixed;
//         top: 10px;
//         right: 10px;
//         width: 200px;
//         padding: 5px;
//         z-index: 10000;
//         background: white;
//         border: 1px solid #ddd;
//         border-radius: 5px;
//     `;

//     document.body.appendChild(searchBox);

//     searchBox.addEventListener("keypress", function(e) {
//         if (e.key === "Enter") {
//             window.location.href = `https://github.com/search?q=${encodeURIComponent(searchBox.value)}`;
//         }
//     });
// })();
