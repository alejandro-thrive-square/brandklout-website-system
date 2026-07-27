(() => {
  "use strict";

  const roots = document.querySelectorAll("[data-ef-docs]");

  roots.forEach((root) => {
    if (root.dataset.efDocsReady === "true") return;
    root.dataset.efDocsReady = "true";

    const status = root.querySelector("[data-download-status]");
    let statusTimer;

    const announce = (message, visibleFor = 2800) => {
      if (!status) return;
      window.clearTimeout(statusTimer);
      status.textContent = message;
      status.classList.add("is-visible");
      statusTimer = window.setTimeout(() => {
        status.classList.remove("is-visible");
      }, visibleFor);
    };

    const saveBlob = (blob, filename) => {
      const objectUrl = URL.createObjectURL(blob);
      const temporaryLink = document.createElement("a");
      temporaryLink.href = objectUrl;
      temporaryLink.download = filename;
      temporaryLink.hidden = true;
      document.body.appendChild(temporaryLink);
      temporaryLink.click();
      temporaryLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    };

    root.addEventListener("click", async (event) => {
      const link = event.target.closest("a[data-direct-download]");
      if (!link || !root.contains(link)) return;
      if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = link.href;
      const filename = link.getAttribute("download") || href.split("/").pop() || "excellent-facets-document.pdf";
      const fileKey = link.dataset.fileKey || filename;
      const language = link.dataset.language || "";

      event.preventDefault();
      link.setAttribute("aria-busy", "true");
      link.classList.add("is-downloading");
      announce("Preparing your download… / Préparation du téléchargement…", 12000);

      try {
        const response = await fetch(href, { credentials: "omit", mode: "cors" });
        if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
        saveBlob(await response.blob(), filename);
        announce("Download started. / Téléchargement démarré.");

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "document_download",
          document_key: fileKey,
          document_language: language,
          document_filename: filename
        });

        root.dispatchEvent(new CustomEvent("ef:document-download", {
          bubbles: true,
          detail: { fileKey, language, filename }
        }));
      } catch (error) {
        console.warn("Direct download fallback:", error);
        announce("Opening the document… / Ouverture du document…");
        window.location.assign(href);
      } finally {
        link.removeAttribute("aria-busy");
        link.classList.remove("is-downloading");
      }
    });

    // ----- Report download dropdown (progressive enhancement over <details>) -----
    // Native <details>/<summary> owns open/close (and the no-JS fallback). JS only
    // adds: one-open-at-a-time, outside-click + Escape to close, arrow-key
    // navigation, and auto-close once a download starts. Visibility is driven by
    // the real [open] attribute (see documents.css / library_embed), never by a
    // transitioned class, so show/hide never gets stuck.
    const dropdowns = root.querySelectorAll("details.ef-dropdown");

    if (dropdowns.length) {
      const syncAria = (dd) => {
        const trigger = dd.querySelector("[data-ef-dropdown-toggle]");
        if (trigger) trigger.setAttribute("aria-expanded", dd.open ? "true" : "false");
      };

      dropdowns.forEach((dd) => {
        dd.addEventListener("toggle", () => {
          syncAria(dd);
          if (dd.open) {
            dropdowns.forEach((other) => { if (other !== dd && other.open) other.open = false; });
          }
        });
      });

      dropdowns.forEach((dd) => {
        const trigger = dd.querySelector("[data-ef-dropdown-toggle]");
        if (trigger) {
          trigger.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            if (!dd.open) dd.open = true;
            const items = dd.querySelectorAll(".ef-dropdown-item");
            if (!items.length) return;
            const target = event.key === "ArrowDown" ? items[0] : items[items.length - 1];
            if (target) target.focus();
          });
        }
        dd.addEventListener("keydown", (event) => {
          if (!event.target.closest(".ef-dropdown-item")) return; // ignore keystrokes from the trigger (handled above)
          const items = Array.from(dd.querySelectorAll(".ef-dropdown-item"));
          if (!items.length) return;
          const index = items.indexOf(document.activeElement);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            items[(index + 1) % items.length].focus();
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            items[(index - 1 + items.length) % items.length].focus();
          }
        });
      });

      root.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const open = Array.from(dropdowns).find((dd) => dd.open);
        if (!open) return;
        event.preventDefault();
        open.open = false;
        const trigger = open.querySelector("[data-ef-dropdown-toggle]");
        if (trigger) trigger.focus();
      });

      root.addEventListener("ef:document-download", () => {
        dropdowns.forEach((dd) => { if (dd.open) dd.open = false; });
      });

      document.addEventListener("click", (event) => {
        dropdowns.forEach((dd) => {
          if (dd.open && !dd.contains(event.target)) dd.open = false;
        });
      });

      // Hover-to-open, but ONLY for a real mouse pointer (pointerType === "mouse").
      // A touch tap fires a synthetic pointerenter/mouseenter BEFORE the click; if
      // that opened the menu, the native <summary> click would toggle it straight
      // back closed — the classic "opens on the second tap" bug. Ignoring non-mouse
      // pointers means a tap always opens on the first tap (via the native toggle),
      // while mouse hover still opens/closes. A short close delay lets the pointer
      // cross the small trigger→menu gap without flickering shut.
      //
      // On desktop the pointer has already opened the menu via hover before the
      // click fires, so we suppress the native <summary> toggle for MOUSE clicks
      // only (armed via pointerdown). Touch taps and keyboard activation keep the
      // native toggle, so they still open on the first interaction.
      dropdowns.forEach((dd) => {
        let leaveTimer;
        let mouseArmed = false;
        dd.addEventListener("pointerenter", (event) => {
          if (event.pointerType !== "mouse") return;
          window.clearTimeout(leaveTimer);
          dd.open = true;
        });
        dd.addEventListener("pointerleave", (event) => {
          if (event.pointerType !== "mouse") return;
          mouseArmed = false;
          leaveTimer = window.setTimeout(() => { dd.open = false; }, 140);
        });
        const trigger = dd.querySelector("[data-ef-dropdown-toggle]");
        if (trigger) {
          trigger.addEventListener("pointerdown", (event) => {
            mouseArmed = event.pointerType === "mouse";
          });
          trigger.addEventListener("click", (event) => {
            if (mouseArmed) event.preventDefault(); // hover owns desktop; don't let native toggle fight it
            mouseArmed = false;
          });
        }
      });
    }
  });
})();
