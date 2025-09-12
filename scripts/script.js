document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("sidebar-container");
  if (container) {
    fetch("sidebar.html")
      .then(response => response.text())
      .then(data => {
        container.innerHTML = data;

        // Detect current page from URL
        const currentPath = window.location.pathname.split("/").pop().replace(".html", "");

        // Highlight matching sidebar link
        const links = container.querySelectorAll("a");
        links.forEach(link => {
          const href = link.getAttribute("href").replace("/", "").replace(".html", "");
          if (href === currentPath) {
            link.classList.add("text-white", "border-blue-500");
            link.classList.remove("text-gray-400");
            link.setAttribute("aria-current", "page");
          } else {
            link.classList.remove("text-white", "border-blue-500");
            link.classList.add("text-gray-400");
            link.removeAttribute("aria-current");
          }
        });
      })
      .catch(error => console.error("Sidebar load failed:", error));
  }
});
