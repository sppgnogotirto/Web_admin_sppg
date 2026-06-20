// ==========================================================================
// DASHBOARD ADMIN SPPG - APP.JS
// ==========================================================================

let appState = {
  currentTab: "overview",
  apiUrl: localStorage.getItem("sppg_api_url") || "",
  data: {},
  theme: localStorage.getItem("sppg_theme") || "light",
  searchQuery: "",
  selectedDate: getTodayDateString(),
  chartInstance: null,
};

// ==========================================================================
// DOM ELEMENTS
// ==========================================================================
const DOM = {
  sidebar: document.getElementById("sidebar"),
  menuItems: document.querySelectorAll(".menu-item"),
  groupToggles: document.querySelectorAll(".menu-group-toggle"),
  mobileMenuToggle: document.getElementById("mobileMenuToggleBtn"),
  mobileCloseBtn: document.getElementById("mobileCloseBtn"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),

  pageTitle: document.getElementById("mainPageTitle"),
  pageDesc: document.getElementById("mainPageDesc"),
  datePicker: document.getElementById("datePicker"),
  clockText: document.getElementById("clockText"),
  apiStatusBadge: document.getElementById("apiStatusBadge"),
  apiStatusText: document.getElementById("apiStatusText"),
  refreshBtn: document.getElementById("refreshDataBtn"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  demoAlertBanner: document.getElementById("demoAlertBanner"),
  closeAlertBannerBtn: document.getElementById("closeAlertBannerBtn"),

  kpiGrid: document.getElementById("kpiGrid"),
  chartCardTitle: document.getElementById("chartCardTitle"),
  chartTypeIndicator: document.getElementById("chartTypeIndicator"),
  infoCardTitle: document.getElementById("infoCardTitle"),
  statsSummaryList: document.getElementById("statsSummaryList"),

  tableCardTitle: document.getElementById("tableCardTitle"),
  tableSearchInput: document.getElementById("tableSearchInput"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  printReportBtn: document.getElementById("printReportBtn"),
  mainDataTable: document.getElementById("mainDataTable"),
  tableHeaderRow: document.getElementById("tableHeaderRow"),
  tableBody: document.getElementById("tableBody"),
  tableShowingText: document.getElementById("tableShowingText"),

  settingsModal: document.getElementById("settingsModal"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  mobileSettingsBtn: document.getElementById("mobileSettingsBtn"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  cancelSettingsBtn: document.getElementById("cancelSettingsBtn"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  apiUrlInput: document.getElementById("apiUrlInput"),
  testApiBtn: document.getElementById("testApiBtn"),
  testApiResult: document.getElementById("testApiResult"),
  instructionsToggle: document.getElementById("instructionsToggle"),
  instructionsContent: document.getElementById("instructionsContent"),

  imageModal: document.getElementById("imageModal"),
  closeImageModalBtn: document.getElementById("closeImageModalBtn"),
  closeImageModalBtn2: document.getElementById("closeImageModalBtn2"),
  previewImage: document.getElementById("previewImage"),
  previewIframe: document.getElementById("previewIframe"),
  imageLoader: document.getElementById("imageLoader"),
  originalImageLink: document.getElementById("originalImageLink"),
};

// ==========================================================================
// INIT
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initClock();
  initNavigation();
  initSidebarMobile();
  initDataControls();
  initModal();

  if (DOM.datePicker) {
    DOM.datePicker.value = appState.selectedDate;
  }

  fetchData();
});

// ==========================================================================
// HELPERS
// ==========================================================================
function getTodayDateString() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizeDashboardData(data) {
  const d = data || {};

  return {
    aslap_distribusi: Array.isArray(d.aslap_distribusi)
      ? d.aslap_distribusi
      : [],

    aslap_planning: Array.isArray(d.aslap_planning) ? d.aslap_planning : [],

    persiapan_bahan: Array.isArray(d.persiapan_bahan)
      ? d.persiapan_bahan
      : Array.isArray(d.persiapan)
        ? d.persiapan
        : [],

    persiapan_limbah: Array.isArray(d.persiapan_limbah)
      ? d.persiapan_limbah
      : [],

    pengolahan_suhu: Array.isArray(d.pengolahan_suhu)
      ? d.pengolahan_suhu
      : Array.isArray(d.pengolahan)
        ? d.pengolahan
        : [],

    pengolahan_produksi: Array.isArray(d.pengolahan_produksi)
      ? d.pengolahan_produksi
      : [],

    pemorsian_ompreng: Array.isArray(d.pemorsian_ompreng)
      ? d.pemorsian_ompreng
      : [],

    pemorsian_sisa: Array.isArray(d.pemorsian_sisa) ? d.pemorsian_sisa : [],

    distribusi: Array.isArray(d.distribusi) ? d.distribusi : [],

    pencucian_limbah: Array.isArray(d.pencucian_limbah)
      ? d.pencucian_limbah
      : [],

    kebersihan_limbah: Array.isArray(d.kebersihan_limbah)
      ? d.kebersihan_limbah
      : [],
  };
}

function getDataList(key) {
  const list = appState.data?.[key];

  return Array.isArray(list) ? list : [];
}

function getCategoryLabel(key) {
  const labels = {
    persiapan_bahan: "Persiapan Bahan",
    persiapan_limbah: "Limbah Persiapan",
    pengolahan_suhu: "Suhu Pengolahan",
    pengolahan_produksi: "Produksi Pengolahan",
    pemorsian_ompreng: "Pemorsian Ompreng",
    pemorsian_sisa: "Sisa Makanan",
    distribusi: "Distribusi",
    pencucian_limbah: "Limbah Pencucian",
    kebersihan_limbah: "Limbah Kebersihan",
    aslap_distribusi: "Aslap Distribusi",
    aslap_planning: "Aslap Planning",
  };

  return labels[key] || key;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const cleaned = String(value)
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const n = Number(cleaned);

  return Number.isFinite(n) ? n : 0;
}

function safeText(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function escapeHtml(value) {
  return safeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createUrlWithDate(baseUrl, dateValue) {
  const url = new URL(baseUrl);
  url.searchParams.set("tanggal", dateValue);
  return url.toString();
}

function setApiStatus(type, text) {
  if (!DOM.apiStatusBadge || !DOM.apiStatusText) return;

  DOM.apiStatusBadge.className = `api-status-badge ${type}`;
  DOM.apiStatusText.textContent = text;
}

function getGoogleDriveId(url) {
  if (!url) return null;

  const text = String(url);

  let match = text.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  match = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  match = text.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  match = text.match(/drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  return null;
}

function showElement(el) {
  if (el) el.style.display = "";
}

function hideElement(el) {
  if (el) el.style.display = "none";
}

// ==========================================================================
// THEME
// ==========================================================================
function initTheme() {
  document.documentElement.setAttribute("data-theme", appState.theme);

  if (!DOM.themeToggleBtn) return;

  DOM.themeToggleBtn.addEventListener("click", () => {
    appState.theme = appState.theme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", appState.theme);
    localStorage.setItem("sppg_theme", appState.theme);

    if (appState.chartInstance) {
      setTimeout(renderChart, 50);
    }
  });
}

// ==========================================================================
// CLOCK
// ==========================================================================
function initClock() {
  updateClock();

  setInterval(updateClock, 1000);
}

function updateClock() {
  if (!DOM.clockText) return;

  const d = new Date();

  DOM.clockText.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ==========================================================================
// NAVIGATION
// ==========================================================================
function initNavigation() {
  DOM.groupToggles.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const group = btn.parentElement;

      if (!group) return;

      const isOpen = group.classList.toggle("open");

      btn.setAttribute("aria-expanded", String(isOpen));
    });
  });

  DOM.menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      const target = item.getAttribute("data-target");

      if (!target) return;

      DOM.menuItems.forEach((mi) => mi.classList.remove("active"));
      item.classList.add("active");

      appState.currentTab = target;
      appState.searchQuery = "";

      if (DOM.tableSearchInput) {
        DOM.tableSearchInput.value = "";
      }

      closeMobileSidebar();
      renderDashboard();

      const content = document.querySelector(".content-scrollable");

      if (content) {
        content.scrollTop = 0;
      }
    });
  });
}

// ==========================================================================
// SIDEBAR MOBILE
// ==========================================================================
function initSidebarMobile() {
  if (DOM.mobileMenuToggle) {
    DOM.mobileMenuToggle.addEventListener("click", () => {
      DOM.sidebar?.classList.add("open");
      DOM.sidebarOverlay?.classList.add("open");
    });
  }

  if (DOM.mobileCloseBtn) {
    DOM.mobileCloseBtn.addEventListener("click", closeMobileSidebar);
  }

  if (DOM.sidebarOverlay) {
    DOM.sidebarOverlay.addEventListener("click", closeMobileSidebar);
  }
}

function closeMobileSidebar() {
  DOM.sidebar?.classList.remove("open");
  DOM.sidebarOverlay?.classList.remove("open");
}

// ==========================================================================
// DATA CONTROLS
// ==========================================================================
function initDataControls() {
  if (DOM.datePicker) {
    DOM.datePicker.addEventListener("change", (e) => {
      appState.selectedDate = e.target.value || getTodayDateString();
      fetchData();
    });
  }

  if (DOM.refreshBtn) {
    DOM.refreshBtn.addEventListener("click", fetchData);
  }

  if (DOM.tableSearchInput) {
    DOM.tableSearchInput.addEventListener("input", (e) => {
      appState.searchQuery = String(e.target.value || "").toLowerCase();
      renderTable();
    });
  }

  if (DOM.closeAlertBannerBtn) {
    DOM.closeAlertBannerBtn.addEventListener("click", () => {
      hideElement(DOM.demoAlertBanner);
    });
  }

  if (DOM.exportCsvBtn) {
    DOM.exportCsvBtn.addEventListener("click", exportToCsv);
  }

  if (DOM.printReportBtn) {
    DOM.printReportBtn.addEventListener("click", () => window.print());
  }
}

// ==========================================================================
// MODAL
// ==========================================================================
function openSettingsModal() {
  if (DOM.apiUrlInput) {
    DOM.apiUrlInput.value = appState.apiUrl;
  }

  if (DOM.testApiResult) {
    DOM.testApiResult.textContent = "";
    DOM.testApiResult.className = "test-result";
  }

  openModal(DOM.settingsModal);
}

function initModal() {
  if (DOM.openSettingsBtn) {
    DOM.openSettingsBtn.addEventListener("click", openSettingsModal);
  }

  if (DOM.mobileSettingsBtn) {
    DOM.mobileSettingsBtn.addEventListener("click", openSettingsModal);
  }

  if (DOM.closeSettingsBtn) {
    DOM.closeSettingsBtn.addEventListener("click", () =>
      closeModal(DOM.settingsModal),
    );
  }

  if (DOM.cancelSettingsBtn) {
    DOM.cancelSettingsBtn.addEventListener("click", () =>
      closeModal(DOM.settingsModal),
    );
  }

  if (DOM.saveSettingsBtn) {
    DOM.saveSettingsBtn.addEventListener("click", () => {
      appState.apiUrl = DOM.apiUrlInput.value.trim();

      localStorage.setItem("sppg_api_url", appState.apiUrl);

      closeModal(DOM.settingsModal);
      fetchData();
    });
  }

  if (DOM.testApiBtn) {
    DOM.testApiBtn.addEventListener("click", testApiConnection);
  }

  if (DOM.instructionsToggle) {
    DOM.instructionsToggle.addEventListener("click", () => {
      const isActive = DOM.instructionsToggle.classList.toggle("active");

      DOM.instructionsToggle.setAttribute("aria-expanded", String(isActive));

      if (DOM.instructionsContent) {
        DOM.instructionsContent.style.display = isActive ? "block" : "none";
      }
    });
  }

  if (DOM.closeImageModalBtn) {
    DOM.closeImageModalBtn.addEventListener("click", closeImageModal);
  }

  if (DOM.closeImageModalBtn2) {
    DOM.closeImageModalBtn2.addEventListener("click", closeImageModal);
  }

  if (DOM.settingsModal) {
    DOM.settingsModal.addEventListener("click", (e) => {
      if (e.target === DOM.settingsModal) {
        closeModal(DOM.settingsModal);
      }
    });
  }

  if (DOM.imageModal) {
    DOM.imageModal.addEventListener("click", (e) => {
      if (e.target === DOM.imageModal) {
        closeImageModal();
      }
    });
  }
}

function openModal(modal) {
  if (!modal) return;

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

async function testApiConnection() {
  const url = DOM.apiUrlInput.value.trim();

  if (!url) {
    DOM.testApiResult.textContent = "URL kosong.";
    DOM.testApiResult.className = "test-result error";
    return;
  }

  DOM.testApiResult.textContent = "Menguji koneksi...";
  DOM.testApiResult.className = "test-result";

  try {
    const targetUrl = createUrlWithDate(url, appState.selectedDate);
    const res = await fetch(targetUrl);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    if (json.status === "success" || json.success === true) {
      DOM.testApiResult.textContent = "Koneksi sukses.";
      DOM.testApiResult.className = "test-result success";
    } else {
      throw new Error(json.message || "Format API tidak valid.");
    }
  } catch (err) {
    console.error("Test API gagal:", err);

    DOM.testApiResult.textContent = "Gagal terhubung.";
    DOM.testApiResult.className = "test-result error";
  }
}

// ==========================================================================
// IMAGE MODAL
// ==========================================================================
window.openImageModal = function (url) {
  if (!url) return;

  openModal(DOM.imageModal);

  DOM.previewImage.removeAttribute("src");
  DOM.previewIframe.removeAttribute("src");

  DOM.previewImage.style.display = "none";
  DOM.previewIframe.style.display = "none";

  DOM.imageLoader.style.display = "flex";
  DOM.imageLoader.innerHTML =
    '<i class="fa-solid fa-circle-notch fa-spin"></i> Memuat gambar...';

  DOM.originalImageLink.href = url;
  DOM.originalImageLink.target = "_blank";
  DOM.originalImageLink.rel = "noopener noreferrer";

  const driveId = getGoogleDriveId(url);

  if (driveId) {
    const previewUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;

    DOM.previewImage.src = previewUrl;
    DOM.previewImage.style.display = "block";

    DOM.previewImage.onload = () => {
      DOM.imageLoader.style.display = "none";
    };

    DOM.previewImage.onerror = () => {
      DOM.imageLoader.innerHTML =
        '<i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat gambar. Silakan buka di Tab Baru.';
    };

    return;
  }

  DOM.previewImage.src = url;
  DOM.previewImage.style.display = "block";

  DOM.previewImage.onload = () => {
    DOM.imageLoader.style.display = "none";
  };

  DOM.previewImage.onerror = () => {
    DOM.imageLoader.innerHTML =
      '<i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat gambar. Silakan buka di Tab Baru.';
  };
};

function closeImageModal() {
  closeModal(DOM.imageModal);

  if (DOM.previewImage) {
    DOM.previewImage.removeAttribute("src");
    DOM.previewImage.style.display = "none";
  }

  if (DOM.previewIframe) {
    DOM.previewIframe.removeAttribute("src");
    DOM.previewIframe.style.display = "none";
  }

  if (DOM.imageLoader) {
    DOM.imageLoader.style.display = "none";
  }
}

// ==========================================================================
// FETCH DATA
// ==========================================================================
async function fetchData() {
  DOM.refreshBtn?.classList.add("spinning");

  if (!appState.apiUrl) {
    setApiStatus("offline", "Data Simulasi");
    showElement(DOM.demoAlertBanner);

    try {
      const res = await fetch("dummy-data.json");

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      appState.data = normalizeDashboardData(json.data || {});
    } catch (err) {
      console.error("Gagal memuat dummy-data.json:", err);
      appState.data = normalizeDashboardData({});
    }

    DOM.refreshBtn?.classList.remove("spinning");
    renderDashboard();
    return;
  }

  setApiStatus("offline", "Memuat...");

  try {
    const targetUrl = createUrlWithDate(appState.apiUrl, appState.selectedDate);
    const res = await fetch(targetUrl);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    if (json.status === "success" || json.success === true) {
      appState.data = normalizeDashboardData(json.data || {});

      setApiStatus("online", "API Terhubung");
      hideElement(DOM.demoAlertBanner);
    } else {
      throw new Error(json.message || "Format data salah");
    }
  } catch (err) {
    console.error("Fetch API gagal:", err);

    setApiStatus("error", "Error API");
    appState.data = normalizeDashboardData({});
  }

  DOM.refreshBtn?.classList.remove("spinning");

  renderDashboard();
}

// ==========================================================================
// RENDER DASHBOARD
// ==========================================================================
function renderDashboard() {
  updateHeader();
  renderKpiCards();
  renderChart();
  renderSummaryList();
  renderTable();
}

function updateHeader() {
  const titles = {
    overview: {
      t: "Dashboard",
      d: `Ringkasan operasional SPPG untuk tanggal ${appState.selectedDate}`,
    },
    aslap_distribusi: {
      t: "Rekap Distribusi Aslap",
      d: `Rekap distribusi penerima manfaat tanggal ${appState.selectedDate}.`,
    },

    aslap_planning: {
      t: "Planning Penerima Manfaat",
      d: `Planning porsi penerima manfaat tanggal ${appState.selectedDate}.`,
    },
    persiapan_bahan: {
      t: "Pemeriksaan Bahan Baku",
      d: "Data penerimaan dan pengecekan kondisi bahan baku.",
    },
    persiapan_limbah: {
      t: "Limbah Persiapan",
      d: "Berita acara serah terima limbah persiapan.",
    },
    pengolahan_suhu: {
      t: "Pemantauan Suhu Produk",
      d: "Pencatatan suhu makanan hasil pengolahan.",
    },
    pengolahan_produksi: {
      t: "Monitoring Produksi",
      d: "Data resep, bahan baku, dan hasil produksi.",
    },
    pemorsian_ompreng: {
      t: "Pemorsian Ompreng",
      d: "Distribusi ompreng besar dan kecil per rute.",
    },
    pemorsian_sisa: {
      t: "Cek Sisa Makanan",
      d: "Pencatatan sisa makanan dari setiap rute.",
    },
    distribusi: {
      t: "Distribusi Makanan",
      d: "Pelacakan pengiriman makanan ke lokasi tujuan.",
    },
    pencucian_limbah: {
      t: "Limbah Pencucian",
      d: "Berita acara serah terima limbah dari area pencucian.",
    },
    kebersihan_limbah: {
      t: "Limbah Kebersihan",
      d: "Berita acara serah terima limbah dari area kebersihan.",
    },
  };

  const current = titles[appState.currentTab] || titles.overview;

  DOM.pageTitle.textContent = current.t;
  DOM.pageDesc.textContent = current.d;
}

// ==========================================================================
// KPI CARDS
// ==========================================================================
function renderKpiCards() {
  let html = "";

  const persiapanTotal =
    getDataList("persiapan_bahan").length +
    getDataList("persiapan_limbah").length;

  const pengolahanTotal =
    getDataList("pengolahan_suhu").length +
    getDataList("pengolahan_produksi").length;

  const pemorsianTotal =
    getDataList("pemorsian_ompreng").length +
    getDataList("pemorsian_sisa").length;

  const distribusiList = getDataList("distribusi");
  const distribusiTotal = distribusiList.length;

  const limbahTotal =
    getDataList("persiapan_limbah").length +
    getDataList("pencucian_limbah").length +
    getDataList("kebersihan_limbah").length;

  const aslapDistribusiTotal =
    getDataList("aslap_distribusi").length;

  const aslapPlanningTotal =
    getDataList("aslap_planning").length;

  // Hitung total porsi distribusi
  let totalPorsiDistribusi = 0;

  distribusiList.forEach((item) => {
    const jumlahPorsi = toNumber(item["Jumlah Porsi"]);

    if (jumlahPorsi > 0) {
      totalPorsiDistribusi += jumlahPorsi;
    } else {
      totalPorsiDistribusi +=
        toNumber(item["Porsi Besar"]) +
        toNumber(item["Porsi Kecil"]);
    }
  });

  // ==========================================================
  // OVERVIEW
  // ==========================================================
  if (appState.currentTab === "overview") {
    html = `
      ${metricCard(
        "info",
        "Persiapan",
        persiapanTotal,
        "Bahan dan limbah persiapan",
        "fa-carrot"
      )}

      ${metricCard(
        "success",
        "Pengolahan",
        pengolahanTotal,
        "Suhu dan produksi",
        "fa-fire-burner"
      )}

      ${metricCard(
        "warning",
        "Pemorsian",
        pemorsianTotal,
        "Ompreng dan sisa makanan",
        "fa-kitchen-set"
      )}

      ${metricCard(
        "info",
        "Distribusi",
        distribusiTotal,
        `${totalPorsiDistribusi} total porsi`,
        "fa-truck"
      )}

      ${metricCard(
        "danger",
        "Total Limbah",
        limbahTotal,
        "Seluruh berita acara limbah",
        "fa-recycle"
      )}

      ${metricCard(
        "success",
        "Aslap Distribusi",
        aslapDistribusiTotal,
        "Penerima manfaat",
        "fa-route"
      )}

      ${metricCard(
        "warning",
        "Aslap Planning",
        aslapPlanningTotal,
        "Planning penerima",
        "fa-calendar-check"
      )}
    `;

    DOM.kpiGrid.innerHTML = html;
    return;
  }

  const list = getDataList(appState.currentTab);
  const total = list.length;

  // ==========================================================
  // DETAIL DISTRIBUSI
  // ==========================================================
  if (appState.currentTab === "distribusi") {
    let porsiBesar = 0;
    let porsiKecil = 0;
    let totalPorsi = 0;
    let terkirim = 0;
    let dalamPerjalanan = 0;

    list.forEach((item) => {
      const besar = toNumber(item["Porsi Besar"]);
      const kecil = toNumber(item["Porsi Kecil"]);
      const jumlah = toNumber(item["Jumlah Porsi"]);

      porsiBesar += besar;
      porsiKecil += kecil;

      totalPorsi += jumlah > 0
        ? jumlah
        : besar + kecil;

      const status = String(item["Status"] || "")
        .trim()
        .toLowerCase();

      if (
        status.includes("terkirim") ||
        status.includes("selesai") ||
        status.includes("diterima")
      ) {
        terkirim++;
      }

      if (
        status.includes("jalan") ||
        status.includes("berangkat") ||
        status.includes("proses")
      ) {
        dalamPerjalanan++;
      }
    });

    html = `
      ${metricCard(
        "info",
        "Total Pengiriman",
        total,
        "Jumlah tujuan distribusi",
        "fa-truck"
      )}

      ${metricCard(
        "success",
        "Porsi Besar",
        porsiBesar,
        "Total porsi besar",
        "fa-bowl-food"
      )}

      ${metricCard(
        "warning",
        "Porsi Kecil",
        porsiKecil,
        "Total porsi kecil",
        "fa-utensils"
      )}

      ${metricCard(
        "info",
        "Total Porsi",
        totalPorsi,
        "Akumulasi seluruh porsi",
        "fa-calculator"
      )}

      ${metricCard(
        "success",
        "Terkirim",
        terkirim,
        "Pengiriman selesai",
        "fa-circle-check"
      )}

      ${metricCard(
        "warning",
        "Dalam Perjalanan",
        dalamPerjalanan,
        "Pengiriman berlangsung",
        "fa-truck-fast"
      )}
    `;

    DOM.kpiGrid.innerHTML = html;
    return;
  }

  // ==========================================================
  // ASLAP DISTRIBUSI
  // ==========================================================
  if (appState.currentTab === "aslap_distribusi") {
    let totalTendik = 0;
    let totalBesar = 0;
    let totalKecil = 0;
    let grandTotal = 0;

    list.forEach((item) => {
      totalTendik += toNumber(item["Tendik"]);
      totalBesar += toNumber(item["Porsi Besar"]);
      totalKecil += toNumber(item["Porsi Kecil"]);

      const totalItem = toNumber(item["Total"]);

      grandTotal += totalItem > 0
        ? totalItem
        : (
            toNumber(item["Tendik"]) +
            toNumber(item["Porsi Besar"]) +
            toNumber(item["Porsi Kecil"])
          );
    });

    html = `
      ${metricCard(
        "info",
        "Penerima",
        total,
        "Jumlah penerima manfaat",
        "fa-school"
      )}

      ${metricCard(
        "success",
        "Tendik",
        totalTendik,
        "Total tenaga pendidik",
        "fa-user-tie"
      )}

      ${metricCard(
        "warning",
        "Porsi Besar",
        totalBesar,
        "Total porsi besar",
        "fa-bowl-food"
      )}

      ${metricCard(
        "info",
        "Porsi Kecil",
        totalKecil,
        "Total porsi kecil",
        "fa-utensils"
      )}

      ${metricCard(
        "danger",
        "Grand Total",
        grandTotal,
        "Total distribusi Aslap",
        "fa-calculator"
      )}
    `;

    DOM.kpiGrid.innerHTML = html;
    return;
  }

  // ==========================================================
  // ASLAP PLANNING
  // ==========================================================
  if (appState.currentTab === "aslap_planning") {
    let totalBesar = 0;
    let totalKecil = 0;
    let grandTotal = 0;

    list.forEach((item) => {
      const besar = toNumber(item["Porsi Besar"]);
      const kecil = toNumber(item["Porsi Kecil"]);
      const totalItem = toNumber(item["Total"]);

      totalBesar += besar;
      totalKecil += kecil;

      grandTotal += totalItem > 0
        ? totalItem
        : besar + kecil;
    });

    html = `
      ${metricCard(
        "info",
        "Penerima",
        total,
        "Jumlah penerima manfaat",
        "fa-school"
      )}

      ${metricCard(
        "success",
        "Porsi Besar",
        totalBesar,
        "Planning porsi besar",
        "fa-bowl-food"
      )}

      ${metricCard(
        "warning",
        "Porsi Kecil",
        totalKecil,
        "Planning porsi kecil",
        "fa-utensils"
      )}

      ${metricCard(
        "danger",
        "Grand Total",
        grandTotal,
        "Total seluruh planning",
        "fa-calculator"
      )}
    `;

    DOM.kpiGrid.innerHTML = html;
    return;
  }

  // ==========================================================
  // DIVISI LAIN
  // ==========================================================
  let k2T = "Info 1";
  let k2V = "-";
  let k3T = "Info 2";
  let k3V = "-";
  let k4T = "Info 3";
  let k4V = "-";

  if (appState.currentTab === "persiapan_bahan") {
    let baik = 0;
    let sedang = 0;
    let rusak = 0;

    list.forEach((item) => {
      baik += toNumber(item["Baik"]);
      sedang += toNumber(item["Sedang"]);
      rusak += toNumber(item["Rusak"]);
    });

    k2T = "Kondisi Baik";
    k2V = baik;

    k3T = "Kondisi Sedang";
    k3V = sedang;

    k4T = "Kondisi Rusak";
    k4V = rusak;

  } else if (appState.currentTab === "pengolahan_suhu") {
    let sum = 0;

    list.forEach((item) => {
      sum += toNumber(item["Suhu Produk"]);
    });

    const average = total > 0
      ? (sum / total).toFixed(1)
      : "0";

    k2T = "Rata-rata Suhu";
    k2V = `${average}°C`;

    k3T = "Item Terdata";
    k3V = total;

    k4T = "Status";
    k4V = total > 0 ? "Ada Data" : "-";

  } else if (appState.currentTab === "pengolahan_produksi") {
    let sum = 0;

    list.forEach((item) => {
      sum += toNumber(item["Hasil Akhir"]);
    });

    k2T = "Total Produksi";
    k2V = sum;

    k3T = "Item Menu";
    k3V = total;

    k4T = "Status";
    k4V = total > 0 ? "Ada Data" : "-";

  } else if (appState.currentTab === "pemorsian_ompreng") {
    let besar = 0;
    let kecil = 0;

    list.forEach((item) => {
      besar += toNumber(item["Qty Ompreng Besar"]);
      kecil += toNumber(item["Qty Ompreng Kecil"]);
    });

    k2T = "Ompreng Besar";
    k2V = besar;

    k3T = "Ompreng Kecil";
    k3V = kecil;

    k4T = "Total Ompreng";
    k4V = besar + kecil;

  } else if (appState.currentTab === "pemorsian_sisa") {
    let sum = 0;

    list.forEach((item) => {
      sum += toNumber(item["Berat Sisa Kg"]);
    });

    k2T = "Total Berat Sisa";
    k2V = `${sum.toFixed(1)} Kg`;

    k3T = "Laporan";
    k3V = total;

    k4T = "Status";
    k4V = total > 0 ? "Ada Data" : "-";

  } else if (appState.currentTab.includes("limbah")) {
    let sum = 0;

    list.forEach((item) => {
      sum += toNumber(item["Berat Limbah Kg"]);
    });

    k2T = "Total Berat Limbah";
    k2V = `${sum.toFixed(1)} Kg`;

    k3T = "Berita Acara";
    k3V = total;

    k4T = "Status";
    k4V = total > 0 ? "Ada Data" : "-";
  }

  html = `
    ${metricCard(
      "info",
      "Total Entri",
      total,
      "Jumlah baris data",
      "fa-database"
    )}

    ${metricCard(
      "success",
      k2T,
      k2V,
      "",
      "fa-chart-simple"
    )}

    ${metricCard(
      "warning",
      k3T,
      k3V,
      "",
      "fa-list-check"
    )}

    ${metricCard(
      "danger",
      k4T,
      k4V,
      "",
      "fa-circle-info"
    )}
  `;

  DOM.kpiGrid.innerHTML = html;
}

function metricCard(type, title, value, footer, icon) {
  return `
    <div class="card metric-card ${type}">
      <div class="metric-header">
        <span class="metric-title">${escapeHtml(title)}</span>
        <div class="metric-icon-wrap">
          <i class="fa-solid ${escapeHtml(icon)}"></i>
        </div>
      </div>
      <div class="metric-value">${escapeHtml(value)}</div>
      <div class="metric-footer">${escapeHtml(footer || "")}</div>
    </div>
  `;
}

// ==========================================================================
// CHART
// ==========================================================================
function renderChart() {
  if (appState.chartInstance) {
    appState.chartInstance.destroy();
    appState.chartInstance = null;
  }

  const canvas = document.getElementById("mainChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const ctx = canvas.getContext("2d");

  let type = "bar";
  let labels = [];
  let values = [];
  let title = "Distribusi Data";
  let datasetLabel = "Jumlah";
  let horizontal = false;

  if (appState.currentTab === "overview") {
    title = "Jumlah Laporan per Kategori";

    labels = [
      "Persiapan",
      "Pengolahan",
      "Pemorsian",
      "Distribusi",
      "Pencucian",
      "Kebersihan",
      "Aslap Distribusi",
      "Aslap Planning",
    ];

    values = [
      getDataList("persiapan_bahan").length +
        getDataList("persiapan_limbah").length,

      getDataList("pengolahan_suhu").length +
        getDataList("pengolahan_produksi").length,

      getDataList("pemorsian_ompreng").length +
        getDataList("pemorsian_sisa").length,

      getDataList("distribusi").length,
      getDataList("pencucian_limbah").length,
      getDataList("kebersihan_limbah").length,
      getDataList("aslap_distribusi").length,
      getDataList("aslap_planning").length,
    ];

    type = "bar";
    datasetLabel = "Jumlah Entri";

    if (DOM.chartTypeIndicator) {
      DOM.chartTypeIndicator.textContent = "Grafik Batang";
    }
  } else if (
    appState.currentTab === "aslap_distribusi" ||
    appState.currentTab === "aslap_planning"
  ) {
    const list = getDataList(appState.currentTab);

    labels = list.map((item) => item["Nama Penerima"] || "Tanpa Nama");

    values = list.map((item) => toNumber(item["Total"]));

    title =
      appState.currentTab === "aslap_distribusi"
        ? "Total Distribusi per Penerima"
        : "Total Planning per Penerima";

    datasetLabel = "Total Porsi";
    type = "bar";
    horizontal = true;

    if (DOM.chartTypeIndicator) {
      DOM.chartTypeIndicator.textContent = "Porsi per Penerima";
    }
  } else {
    title = "Jumlah Entri per Petugas";

    const list = getDataList(appState.currentTab);
    const counts = {};

    list.forEach((item) => {
      const petugas = item["Nama Petugas"] || "Tidak Diketahui";

      counts[petugas] = (counts[petugas] || 0) + 1;
    });

    labels = Object.keys(counts);
    values = Object.values(counts);

    type = "doughnut";
    datasetLabel = "Jumlah Entri";

    if (DOM.chartTypeIndicator) {
      DOM.chartTypeIndicator.textContent = "Grafik Donat";
    }
  }

  if (labels.length === 0) {
    labels = ["Tidak Ada Data"];
    values = [0];
  }

  if (DOM.chartCardTitle) {
    DOM.chartCardTitle.textContent = title;
  }

  const textColor = appState.theme === "dark" ? "#cbd5e1" : "#475569";

  const gridColor =
    appState.theme === "dark"
      ? "rgba(148,163,184,0.18)"
      : "rgba(148,163,184,0.25)";

  appState.chartInstance = new Chart(ctx, {
    type: type,

    data: {
      labels: labels,

      datasets: [
        {
          label: datasetLabel,
          data: values,

          backgroundColor: [
            "#14b8a6",
            "#f59e0b",
            "#3b82f6",
            "#ef4444",
            "#8b5cf6",
            "#10b981",
            "#f97316",
            "#06b6d4",
            "#84cc16",
            "#ec4899",
            "#6366f1",
            "#22c55e",
            "#eab308",
            "#0ea5e9",
          ],

          borderWidth: 0,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? "y" : "x",

      plugins: {
        legend: {
          display: type !== "bar",

          labels: {
            color: textColor,
          },
        },

        tooltip: {
          callbacks: {
            label: function (context) {
              return `${datasetLabel}: ${context.raw}`;
            },
          },
        },
      },

      scales:
        type === "bar"
          ? horizontal
            ? {
                x: {
                  beginAtZero: true,

                  ticks: {
                    color: textColor,
                    precision: 0,
                  },

                  grid: {
                    color: gridColor,
                  },
                },

                y: {
                  ticks: {
                    color: textColor,
                  },

                  grid: {
                    display: false,
                  },
                },
              }
            : {
                y: {
                  beginAtZero: true,

                  ticks: {
                    color: textColor,
                    precision: 0,
                  },

                  grid: {
                    color: gridColor,
                  },
                },

                x: {
                  ticks: {
                    color: textColor,
                  },

                  grid: {
                    display: false,
                  },
                },
              }
          : {},
    },
  });
}

// ==========================================================================
// SUMMARY LIST
// ==========================================================================
function renderSummaryList() {
  const container = DOM.statsSummaryList;

  if (!container) return;

  if (appState.currentTab === "overview") {
    const rows = [
      [
        "Persiapan",
        getDataList("persiapan_bahan").length +
          getDataList("persiapan_limbah").length,
      ],
      [
        "Pengolahan",
        getDataList("pengolahan_suhu").length +
          getDataList("pengolahan_produksi").length,
      ],
      [
        "Pemorsian",
        getDataList("pemorsian_ompreng").length +
          getDataList("pemorsian_sisa").length,
      ],
      ["Distribusi", getDataList("distribusi").length],
      ["Pencucian", getDataList("pencucian_limbah").length],
      ["Kebersihan", getDataList("kebersihan_limbah").length],
      ["Aslap Distribusi", getDataList("aslap_distribusi").length],
      ["Aslap Planning", getDataList("aslap_planning").length],
    ];

    container.innerHTML = rows
      .map(
        (row) => `
      <div class="summary-item">
        <div class="summary-label-area">
          <span class="summary-bullet" style="background:var(--accent)"></span>
          <span class="summary-label">${escapeHtml(row[0])}</span>
        </div>
        <div class="summary-value">${escapeHtml(row[1])}</div>
      </div>
    `,
      )
      .join("");

    return;
  }

  const list = getDataList(appState.currentTab);
  const latest = list.slice(-5).reverse();

  if (latest.length === 0) {
    container.innerHTML =
      '<p style="font-size:12px;color:var(--text-tertiary);">Belum ada data terbaru.</p>';
    return;
  }

  container.innerHTML = latest
    .map((item) => {
      const title =
        item["Nama Penerima"] ||
        item["Nama Bahan"] ||
        item["Menu"] ||
        item["Nama Produk"] ||
        item["Jenis Limbah"] ||
        item["Jenis Makanan"] ||
        item["Rute"] ||
        item["Lokasi Tujuan"] ||
        item["ID"] ||
        "Item";

      const time =
        item["Created At"] ||
        item["Waktu"] ||
        item["Waktu Pemorsian"] ||
        item["Waktu Cek Sisa"] ||
        item["Tanggal"] ||
        "-";

      return `
      <div class="summary-item">
        <div class="summary-label-area">
          <span class="summary-bullet" style="background:var(--accent)"></span>
          <span class="summary-label">${escapeHtml(title)}</span>
        </div>
        <div class="summary-value" style="font-size:11px;font-weight:400;color:var(--text-tertiary)">
          ${escapeHtml(time)}
        </div>
      </div>
    `;
    })
    .join("");
}

// ==========================================================================
// TABLE
// ==========================================================================
function renderTable() {
  let list = [];
  let columns = [];

  if (appState.currentTab === "overview") {
    DOM.tableCardTitle.textContent = "Data Terakhir Semua Kategori";

    columns = [
      { k: "id", l: "ID" },
      { k: "kategori", l: "Kategori" },
      { k: "info", l: "Keterangan" },
      { k: "petugas", l: "Petugas/Penerima" },
    ];

    Object.keys(appState.data).forEach((key) => {
      const arr = getDataList(key);

      arr.slice(-3).forEach((item) => {
        list.push({
          id: item["ID"] || "-",

          kategori: getCategoryLabel(key),

          info:
            item["Nama Penerima"] ||
            item["Nama Bahan"] ||
            item["Nama Produk"] ||
            item["Menu"] ||
            item["Jenis Limbah"] ||
            item["Jenis Makanan"] ||
            item["Lokasi Tujuan"] ||
            item["Rute"] ||
            "-",

          petugas: item["Nama Petugas"] || item["Nama Penerima"] || "-",
        });
      });
    });
  } else {
    DOM.tableCardTitle.textContent = `Detail ${DOM.pageTitle.textContent}`;
    list = getDataList(appState.currentTab);
    columns = getColumnsForTab(appState.currentTab);
  }

  if (appState.searchQuery) {
    const q = appState.searchQuery;

    list = list.filter((row) =>
      Object.values(row).some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }

  renderTableHeader(columns);
  renderTableBody(list, columns);

  DOM.tableShowingText.textContent = `Menampilkan ${list.length} baris data.`;
}

function getColumnsForTab(tab) {
  if (tab === "aslap_distribusi") {
    return [
      { k: "ID", l: "ID" },
      { k: "No", l: "No" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Nama Penerima", l: "Nama Penerima" },
      { k: "Tendik", l: "Tendik" },
      { k: "Porsi Besar", l: "Porsi Besar" },
      { k: "Porsi Kecil", l: "Porsi Kecil" },
      { k: "Total", l: "Total" },
    ];
  }

  if (tab === "aslap_planning") {
    return [
      { k: "ID", l: "ID" },
      { k: "No", l: "No" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Nama Penerima", l: "Nama Penerima" },
      { k: "Porsi Besar", l: "Porsi Besar" },
      { k: "Porsi Kecil", l: "Porsi Kecil" },
      { k: "Total", l: "Total" },
    ];
  }

  if (tab === "persiapan_bahan") {
    return [
      { k: "ID", l: "ID" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Nama Bahan", l: "Nama Bahan" },
      { k: "Banyaknya", l: "Qty" },
      { k: "Satuan", l: "Satuan" },
      { k: "Baik", l: "Baik" },
      { k: "Sedang", l: "Sedang" },
      { k: "Rusak", l: "Rusak" },
      { k: "Nama Petugas", l: "Petugas" },
      { k: "Foto URL", l: "Foto" },
    ];
  }

  if (tab === "persiapan_limbah") {
    return [
      { k: "NO BA", l: "NO BA" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Nama Pihak Kedua", l: "Penerima" },
      { k: "Jenis Limbah", l: "Jenis Limbah" },
      { k: "Berat Limbah Kg", l: "Berat Kg" },
      { k: "Catatan", l: "Catatan" },
      { k: "Nama Petugas", l: "Petugas" },
      { k: "Foto URL", l: "Foto" },
    ];
  }

  if (tab === "pengolahan_suhu") {
    return [
      { k: "ID", l: "ID" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Waktu", l: "Waktu" },
      { k: "Nama Produk", l: "Nama Produk" },
      { k: "Suhu Produk", l: "Suhu" },
      { k: "Paraf", l: "Paraf" },
      { k: "Nama Petugas", l: "Petugas" },
      { k: "Foto URL", l: "Foto" },
    ];
  }

  if (tab === "pengolahan_produksi") {
    return [
      { k: "ID", l: "ID" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Menu", l: "Menu" },
      { k: "Bahan Baku", l: "Bahan Baku" },
      { k: "Qty", l: "Qty" },
      { k: "Satuan Bahan", l: "Sat Bahan" },
      { k: "Waktu Produksi", l: "Durasi" },
      { k: "Jam Mulai", l: "Jam Mulai" },
      { k: "Hasil Akhir", l: "Hasil" },
      { k: "Satuan Hasil", l: "Sat Hasil" },
      { k: "Nama Petugas", l: "Petugas" },
      { k: "Foto URL", l: "Foto" },
    ];
  }

  if (tab === "pemorsian_ompreng") {
    return [
      { k: "ID", l: "ID" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Rute", l: "Rute" },
      { k: "Qty Ompreng Kecil", l: "Kecil" },
      { k: "Qty Ompreng Besar", l: "Besar" },
      { k: "Waktu Pemorsian", l: "Waktu" },
      { k: "Nama Petugas", l: "Petugas" },
      { k: "Foto URL", l: "Foto" },
    ];
  }

  if (tab === "pemorsian_sisa") {
    return [
      { k: "ID", l: "ID" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Rute", l: "Rute" },
      { k: "Waktu Cek Sisa", l: "Waktu Cek" },
      { k: "Jenis Makanan", l: "Makanan" },
      { k: "Berat Sisa Kg", l: "Berat Kg" },
      { k: "Keterangan", l: "Keterangan" },
      { k: "Nama Petugas", l: "Petugas" },
      { k: "Foto URL", l: "Foto" },
    ];
  }

  if (tab === "distribusi") {
    return [
      { k: "ID", l: "ID" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Lokasi Tujuan", l: "Tujuan" },
      { k: "Porsi Besar", l: "Besar" },
      { k: "Porsi Kecil", l: "Kecil" },
      { k: "Jumlah Porsi", l: "Total" },
      { k: "Jam Berangkat", l: "Berangkat" },
      { k: "Jam Tiba", l: "Tiba" },
      { k: "Status", l: "Status" },
      { k: "Nama Petugas", l: "Petugas" },
      { k: "Catatan", l: "Catatan" },
      { k: "Foto URL", l: "Foto" },
    ];
  }

  if (tab === "pencucian_limbah" || tab === "kebersihan_limbah") {
    return [
      { k: "NO BA", l: "NO BA" },
      { k: "Tanggal", l: "Tanggal" },
      { k: "Nama Pihak Kedua", l: "Penerima" },
      { k: "Jenis Limbah", l: "Jenis Limbah" },
      { k: "Berat Limbah Kg", l: "Berat Kg" },
      { k: "Catatan", l: "Catatan" },
      { k: "Nama Petugas", l: "Petugas" },
      { k: "Foto URL", l: "Foto" },
    ];
  }

  return [
    { k: "ID", l: "ID" },
    { k: "Tanggal", l: "Tanggal" },
    { k: "Nama Petugas", l: "Petugas" },
  ];
}

function renderTableHeader(columns) {
  DOM.tableHeaderRow.innerHTML = "";

  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.l;
    DOM.tableHeaderRow.appendChild(th);
  });
}

function renderTableBody(list, columns) {
  DOM.tableBody.innerHTML = "";

  if (list.length === 0) {
    DOM.tableBody.innerHTML = `
      <tr>
        <td colspan="${columns.length}" style="text-align:center;padding:30px;color:var(--text-tertiary)">
          Tidak ada data ditemukan.
        </td>
      </tr>
    `;

    return;
  }

  list.forEach((row) => {
    const tr = document.createElement("tr");

    columns.forEach((col) => {
      const td = document.createElement("td");
      const val = row[col.k];

      renderTableCell(td, col.k, val);

      tr.appendChild(td);
    });

    DOM.tableBody.appendChild(tr);
  });
}

function renderTableCell(td, key, value) {
  const val = value === null || value === undefined ? "" : value;

  if (key === "Foto URL") {
    if (val && String(val).startsWith("http")) {
      const btn = document.createElement("button");

      btn.type = "button";
      btn.className = "foto-link-btn";
      btn.innerHTML = '<i class="fa-solid fa-image"></i> Lihat';
      btn.addEventListener("click", () => openImageModal(String(val)));

      td.appendChild(btn);
    } else {
      td.textContent = "-";
    }

    return;
  }

  if (key === "Baik" || key === "Sedang" || key === "Rusak") {
    const num = toNumber(val);
    let badgeClass = "neutral";

    if (key === "Baik" && num > 0) badgeClass = "success";
    if (key === "Sedang" && num > 0) badgeClass = "warning";
    if (key === "Rusak" && num > 0) badgeClass = "danger";

    if (num > 0) {
      td.innerHTML = `<span class="status-badge ${badgeClass}">${escapeHtml(num)}</span>`;
    } else {
      td.textContent = "-";
    }

    return;
  }

  if (key === "Status") {
    let badgeClass = "neutral";
    const s = String(val || "").toLowerCase();

    if (s.includes("terkirim") || s.includes("selesai")) {
      badgeClass = "success";
    } else if (
      s.includes("jalan") ||
      s.includes("proses") ||
      s.includes("berangkat")
    ) {
      badgeClass = "warning";
    } else if (s.includes("gagal") || s.includes("batal")) {
      badgeClass = "danger";
    }

    td.innerHTML = `<span class="status-badge ${badgeClass}">${escapeHtml(val || "-")}</span>`;
    return;
  }

  td.textContent = safeText(val);
}

// ==========================================================================
// EXPORT CSV
// ==========================================================================
function exportToCsv() {
  let list = [];

  if (appState.currentTab === "overview") {
    alert("Pilih salah satu kategori untuk ekspor CSV.");
    return;
  }

  list = getDataList(appState.currentTab);

  if (list.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  const headers = Object.keys(list[0]);

  let csv =
    headers
      .map((header) => `"${String(header).replace(/"/g, '""')}"`)
      .join(",") + "\n";

  list.forEach((row) => {
    const line = headers.map((header) => {
      const value = String(row[header] || "").replace(/"/g, '""');
      return `"${value}"`;
    });

    csv += line.join(",") + "\n";
  });

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `sppg_${appState.currentTab}_${appState.selectedDate}.csv`;
  link.click();

  URL.revokeObjectURL(link.href);
}
