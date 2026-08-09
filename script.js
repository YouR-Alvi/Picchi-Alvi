/* ================= LOADER ================= */
window.addEventListener("load", function () {
  setTimeout(function () {
    document.getElementById("loader").classList.add("hide");
  }, 350);
});

/* ================= FLOATING PARTICLES ================= */
(function () {
  const wrap = document.getElementById("ambient");

  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduced) return;

  const count = window.innerWidth < 700 ? 14 : 26;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");

    particle.className = "spark-p";

    particle.style.left = Math.random() * 100 + "vw";

    particle.style.setProperty(
      "--drift",
      (Math.random() * 60 - 30) + "px"
    );

    particle.style.animationDuration = (8 + Math.random() * 10) + "s";
    particle.style.animationDelay = (Math.random() * 10) + "s";

    const size = 2 + Math.random() * 3;

    particle.style.width = size + "px";
    particle.style.height = size + "px";

    wrap.appendChild(particle);
  }
})();

/* ================= RANDOM ANIME VIDEO + DOWNLOADER ================= */
(function () {
  const API_URL = "http://de3.spaceify.eu:25335/video/anime";

  const video = document.getElementById("animeVideo");
  const status = document.getElementById("videoStatus");
  const nextBtn = document.getElementById("nextVideoBtn");
  const downloadBtn = document.getElementById("downloadVideoBtn");

  function bust(url) {
    const sep = url.includes("?") ? "&" : "?";
    return url + sep + "_r=" + Date.now();
  }

  function findUrlInObject(obj) {
    const keys = ["url", "video", "video_url", "link", "src", "file"];

    for (const k of keys) {
      if (typeof obj[k] === "string" && obj[k].startsWith("http")) return obj[k];
    }

    for (const k in obj) {
      if (typeof obj[k] === "string" && obj[k].startsWith("http")) return obj[k];
    }

    return null;
  }

  async function loadRandomVideo() {
    status.textContent = "Loading a random clip…";
    nextBtn.disabled = true;
    downloadBtn.disabled = true;

    try {
      const res = await fetch(bust(API_URL), { method: "GET" });

      if (!res.ok) {
        throw new Error("Request failed with status " + res.status);
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        const url = findUrlInObject(data);

        if (!url) {
          throw new Error("No video URL found in API response");
        }

        video.src = url;
      } else {
        // API likely streams the video file directly
        video.src = bust(API_URL);
      }

      video.load();
      await video.play().catch(() => {
        /* autoplay may be blocked, user can hit play manually */
      });

      status.textContent = "";
    } catch (err) {
      console.error("Video load error:", err);
      status.textContent = "Couldn't load a video right now. Tap \u201cNew Video\u201d to retry.";
    } finally {
      nextBtn.disabled = false;
      downloadBtn.disabled = false;
    }
  }

  async function downloadVideo() {
    const url = video.currentSrc || video.src;

    if (!url) {
      status.textContent = "No video loaded yet.";
      return;
    }

    downloadBtn.disabled = true;
    status.textContent = "Preparing download…";

    try {
      // Try to pull the file as a blob so it saves with a proper filename.
      // This only works if the video server allows cross-origin fetch (CORS).
      const res = await fetch(url);

      if (!res.ok) throw new Error("Download fetch failed: " + res.status);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "anime-clip-" + Date.now() + ".mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      status.textContent = "Download started.";
    } catch (err) {
      console.error("Download error:", err);

      // Fallback: open the raw video URL in a new tab so the user can
      // right-click → "Save video as…" manually (happens when CORS blocks fetch).
      window.open(url, "_blank", "noopener");

      status.textContent = "Direct download blocked by the server (CORS) — opened the clip in a new tab, right-click it and choose \u201cSave video as…\u201d";
    } finally {
      downloadBtn.disabled = false;
    }
  }

  nextBtn.addEventListener("click", loadRandomVideo);
  downloadBtn.addEventListener("click", downloadVideo);
  window.addEventListener("load", loadRandomVideo);
})();

/* ================= UNIVERSAL VIDEO DOWNLOADER ================= */
(function () {
  // Facebook, TikTok, Twitter/X, Instagram, YouTube, Pinterest, GDrive, CapCut, Likee, Threads
  const DL_API = "https://nayan-video-downloader.vercel.app/alldown";

  const input = document.getElementById("dlUrlInput");
  const fetchBtn = document.getElementById("dlFetchBtn");
  const status = document.getElementById("dlStatus");

  const result = document.getElementById("dlResult");
  const thumb = document.getElementById("dlThumb");
  const title = document.getElementById("dlTitle");
  const qualityRow = document.getElementById("dlQualityRow");

  function clearResult() {
    result.classList.remove("show");
    thumb.removeAttribute("src");
    title.textContent = "";
    qualityRow.innerHTML = "";
  }

  function makeQualityButton(label, fileUrl) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "video-download-btn";
    btn.textContent = label;

    btn.addEventListener("click", () => downloadFile(fileUrl, label));

    return btn;
  }

  async function downloadFile(fileUrl, label) {
    status.textContent = "Preparing " + label + " download\u2026";

    try {
      const res = await fetch(fileUrl);

      if (!res.ok) throw new Error("Download fetch failed: " + res.status);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "video-" + label.toLowerCase() + "-" + Date.now() + ".mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      status.textContent = "Download started.";
    } catch (err) {
      console.error("File download error:", err);

      // CORS may block direct fetch — fall back to opening the file link
      window.open(fileUrl, "_blank", "noopener");
      status.textContent = "Direct download blocked by the server (CORS) — opened the file in a new tab, right-click it and choose \u201cSave video as…\u201d";
    }
  }

  async function fetchDownloadLinks() {
    const url = input.value.trim();

    if (!url) {
      status.textContent = "Paste a video link first.";
      return;
    }

    clearResult();
    fetchBtn.disabled = true;
    status.textContent = "Fetching download links\u2026";

    try {
      const apiUrl = DL_API + "?url=" + encodeURIComponent(url);
      const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });

      if (!res.ok) {
        throw new Error("Request failed with status " + res.status);
      }

      const data = await res.json();

      if (!data || data.status !== true || !data.media) {
        throw new Error("Couldn't extract a video from that link");
      }

      const media = data.media;

      if (media.thumbnail) {
        thumb.src = media.thumbnail;
        thumb.style.display = "block";
      } else {
        thumb.style.display = "none";
      }

      title.textContent = media.title || "Video";

      qualityRow.innerHTML = "";

      if (media.high) {
        qualityRow.appendChild(makeQualityButton("HD", media.high));
      }

      if (media.low) {
        qualityRow.appendChild(makeQualityButton("Normal", media.low));
      }

      if (!media.high && !media.low) {
        throw new Error("No downloadable file found for that link");
      }

      result.classList.add("show");
      status.textContent = "";
    } catch (err) {
      console.error("Downloader error:", err);
      status.textContent = "Couldn't fetch that video. Double-check the link and try again.";
    } finally {
      fetchBtn.disabled = false;
    }
  }

  fetchBtn.addEventListener("click", fetchDownloadLinks);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchDownloadLinks();
    }
  });
})();

/* ================= RANDOM GF (custom JSON API) ================= */
(function () {
  // ⚠️ REPLACE THIS with your real API endpoint — "demogf.com/gf" is a
  // placeholder domain and will not return real data.
  const GF_API = "https://demogf.com/gf";

  const img = document.getElementById("gfImage");
  const caption = document.getElementById("gfCaption");
  const nameLink = document.getElementById("gfNameLink");
  const status = document.getElementById("gfStatus");
  const nextBtn = document.getElementById("nextGfBtn");

  async function loadRandomGf() {
    status.textContent = "Loading\u2026";
    nextBtn.disabled = true;
    img.classList.remove("loaded");

    try {
      const res = await fetch(GF_API + (GF_API.includes("?") ? "&" : "?") + "_r=" + Date.now());

      if (!res.ok) throw new Error("Request failed with status " + res.status);

      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error("API returned no data");
      }

      const item = json.data;

      if (!item.image) throw new Error("No image URL in response");

      // Preload so we only fade in once it's actually ready
      await new Promise((resolve, reject) => {
        const preload = new Image();
        preload.onload = resolve;
        preload.onerror = reject;
        preload.src = item.image;
      });

      img.src = item.image;
      img.classList.add("loaded");

      caption.textContent = item.title || "";

      if (item.name) {
        nameLink.textContent = "— " + item.name;
        nameLink.href = item.profile || "#";
        nameLink.style.display = item.profile ? "inline" : "none";
      } else {
        nameLink.textContent = "";
        nameLink.style.display = "none";
      }

      status.textContent = "";
    } catch (err) {
      console.error("Random GF error:", err);
      status.textContent = "Couldn't load right now. Tap \u201cNew GF\u201d to retry.";
    } finally {
      nextBtn.disabled = false;
    }
  }

  nextBtn.addEventListener("click", loadRandomGf);
  window.addEventListener("load", loadRandomGf);
})();

/* ================= TATTOO GENERATOR ================= */
(function () {
  const BASE_API = "https://imran-tatto-nine.vercel.app/api/tattoo";

  const nameInput = document.getElementById("tatNameInput");
  const templateInput = document.getElementById("tatTemplateInput");
  const generateBtn = document.getElementById("tatGenerateBtn");
  const downloadBtn = document.getElementById("tatDownloadBtn");
  const img = document.getElementById("tatImage");
  const placeholder = document.getElementById("tatPlaceholder");
  const status = document.getElementById("tatStatus");

  let currentUrl = "";

  function buildUrl() {
    const name = nameInput.value.trim() || "IMRAN";
    const template = templateInput.value.trim() || "7";

    const params = new URLSearchParams({ name, template });
    return BASE_API + "?" + params.toString();
  }

  function generateTattoo() {
    const url = buildUrl();
    currentUrl = url;

    status.textContent = "Generating tattoo\u2026";
    generateBtn.disabled = true;
    downloadBtn.disabled = true;
    img.classList.remove("loaded");
    placeholder.style.display = "block";
    placeholder.textContent = "Generating tattoo\u2026";

    // Cache-bust so re-generating the same name/template still reloads
    const bustUrl = url + "&_r=" + Date.now();

    const preload = new Image();

    preload.onload = () => {
      img.src = bustUrl;
      img.classList.add("loaded");
      placeholder.style.display = "none";
      status.textContent = "";
      generateBtn.disabled = false;
      downloadBtn.disabled = false;
    };

    preload.onerror = () => {
      placeholder.textContent = "Couldn't generate the tattoo. Check the name/template and try again.";
      status.textContent = "";
      generateBtn.disabled = false;
    };

    preload.src = bustUrl;
  }

  async function downloadTattoo() {
    if (!currentUrl) {
      status.textContent = "Generate a tattoo first.";
      return;
    }

    downloadBtn.disabled = true;
    status.textContent = "Preparing download\u2026";

    try {
      const res = await fetch(img.src);

      if (!res.ok) throw new Error("Download fetch failed: " + res.status);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const name = (nameInput.value.trim() || "tattoo").replace(/\s+/g, "-");

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "tattoo-" + name + "-" + Date.now() + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      status.textContent = "Download started.";
    } catch (err) {
      console.error("Tattoo download error:", err);

      window.open(img.src, "_blank", "noopener");
      status.textContent = "Direct download blocked by the server (CORS) — opened the image in a new tab, right-click it and choose \u201cSave image as…\u201d";
    } finally {
      downloadBtn.disabled = false;
    }
  }

  generateBtn.addEventListener("click", generateTattoo);
  downloadBtn.addEventListener("click", downloadTattoo);

  [nameInput, templateInput].forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        generateTattoo();
      }
    });
  });

  // Generate the default preview on load
  generateTattoo();
})();
