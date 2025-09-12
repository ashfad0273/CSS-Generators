document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("sidebar-container");
  if (container) {
    fetch("sidebar.html")
      .then(response => response.text())
      .then(data => {
        container.innerHTML = data;

        const currentPath = window.location.pathname.split("/").pop().replace(".html", "");

        const links = container.querySelectorAll("a");
        links.forEach(link => {
          const href = link.getAttribute("href").replace("/", "").replace(".html", "");
          if (href === currentPath) {
            link.className = "flex items-center px-6 py-3 rounded-lg mx-2 my-1 bg-gray-700 border-l-4 border-blue-500 font-semibold transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white";
            link.setAttribute("aria-current", "page");
          } else {
            link.className = "flex items-center px-6 py-3 rounded-lg mx-2 my-1 bg-gray-800 border-l-4 border-transparent font-semibold transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400";
            link.removeAttribute("aria-current");
          }
        });
      })
      .catch(error => console.error("Sidebar load failed:", error));
  }
});
