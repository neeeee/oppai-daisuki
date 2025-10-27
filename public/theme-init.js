(function () {
  try {
    var theme = localStorage.getItem("theme") || "system";
    var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    var resolvedTheme = theme === "system" ? systemTheme : theme;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolvedTheme);
  } catch (e) {
    /* fail silently */
  }
})();