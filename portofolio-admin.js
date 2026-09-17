const SUPABASE_URL = "https://rkodmrvceeoejlnmvfob.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JX24wW5kGRlp4gqn-zxi3w_4P4MzJyZ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ========================================
// STATE & ELEMENTS
// ========================================

const portfolioGrid = document.getElementById("portfolio-grid");
const typeFiltersContainer = document.getElementById("admin-type-filters");

let allPortfoliosData = [];
let allTypesData = [];
let activeTypeFilter = "all";

// ========================================
// LOAD PORTFOLIO & TYPES
// ========================================

async function loadPortfolio() {
  if (!portfolioGrid) {
    console.error("Element #portfolio-grid tidak ditemukan.");
    return;
  }

  portfolioGrid.innerHTML = `
    <div class="loading">
      Memuat portfolio...
    </div>
  `;

  // 1. Fetch Types
  const { data: typesData, error: typesError } = await supabaseClient
    .from("types")
    .select("id, name, slug")
    .order("created_at", { ascending: true });

  if (typesError) {
    console.error("Gagal mengambil jenis website:", typesError);
  }

  allTypesData = typesData || [];

  // 2. Fetch Portfolios
  const { data, error } = await supabaseClient
    .from("portofolio")
    .select(`
      id,
      title,
      slug,
      image_url,
      client_name,
      project_url,
      is_visible,
      created_at,
      portfolio_types (
        type_id,
        types (
          id,
          name,
          slug
        )
      ),
      categories (
        id,
        name,
        slug
      )
    `)
    .order("is_visible", {
      ascending: false
    })
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Gagal mengambil portfolio:", error);
    portfolioGrid.innerHTML = `
      <div class="empty">
        Gagal memuat portfolio.
        <br>
        <small>${escapeHtml(error.message)}</small>
      </div>
    `;
    return;
  }

  allPortfoliosData = data || [];

  // Render Filter Tabs
  renderTypeFilters();

  // Render Portfolios with current active filter
  renderPortfolios();
}

// ========================================
// RENDER TYPE FILTER TABS
// ========================================

function renderTypeFilters() {
  if (!typeFiltersContainer) return;

  typeFiltersContainer.innerHTML = "";

  // 1. "Semua" Button
  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = `type-filter-btn ${activeTypeFilter === "all" ? "active" : ""}`;
  allBtn.innerHTML = `
    Semua
    <span class="type-filter-count">${allPortfoliosData.length}</span>
  `;
  allBtn.addEventListener("click", () => {
    activeTypeFilter = "all";
    renderTypeFilters();
    renderPortfolios();
  });
  typeFiltersContainer.appendChild(allBtn);

  // 2. Dynamic Type Buttons
  allTypesData.forEach((type) => {
    // Count portfolios under this type
    const count = allPortfoliosData.filter((p) => {
      const pTypes = Array.isArray(p.portfolio_types)
        ? p.portfolio_types.map((rel) => rel.types).filter(Boolean)
        : [];
      return pTypes.some((t) => t.id === type.id || t.slug === type.slug);
    }).length;

    const typeBtn = document.createElement("button");
    typeBtn.type = "button";
    typeBtn.className = `type-filter-btn ${activeTypeFilter === type.id ? "active" : ""}`;
    typeBtn.innerHTML = `
      ${escapeHtml(type.name)}
      <span class="type-filter-count">${count}</span>
    `;

    typeBtn.addEventListener("click", () => {
      activeTypeFilter = type.id;
      renderTypeFilters();
      renderPortfolios();
    });

    typeFiltersContainer.appendChild(typeBtn);
  });
}

// ========================================
// RENDER PORTFOLIOS
// ========================================

function renderPortfolios() {
  if (!portfolioGrid) return;

  // Filter based on activeTypeFilter
  let filteredList = allPortfoliosData;

  if (activeTypeFilter !== "all") {
    filteredList = allPortfoliosData.filter((p) => {
      const pTypes = Array.isArray(p.portfolio_types)
        ? p.portfolio_types.map((rel) => rel.types).filter(Boolean)
        : [];
      return pTypes.some((t) => t.id === activeTypeFilter);
    });
  }

  // Sort showing (is_visible: true) first, then by created_at descending
  filteredList.sort((a, b) => {
    if (Boolean(a.is_visible) === Boolean(b.is_visible)) {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    return a.is_visible ? -1 : 1;
  });

  if (filteredList.length === 0) {
    portfolioGrid.innerHTML = `
      <div class="empty">
        Belum ada portfolio untuk jenis website ini.
      </div>
    `;
    return;
  }

  portfolioGrid.innerHTML = "";

  filteredList.forEach((portfolio) => {
    const card = document.createElement("article");
    card.className = "portfolio-card";

    // Category
    const category = portfolio.categories?.name || "Tanpa Kategori";

    // Types
    const types = Array.isArray(portfolio.portfolio_types)
      ? portfolio.portfolio_types.map((relation) => relation.types).filter(Boolean)
      : [];

    const tagsHTML = types
      .map((type) => `<span class="tag">${escapeHtml(type.name)}</span>`)
      .join("");

    card.innerHTML = `
      <!-- IMAGE -->
      <div class="portfolio-card__image-wrap">
        ${
          portfolio.image_url
            ? `
              <img
                src="${escapeHtml(portfolio.image_url)}"
                alt="${escapeHtml(portfolio.title)}"
                class="portfolio-card__image"
                loading="lazy"
              />
            `
            : `
              <div class="no-image">
                Tidak ada gambar
              </div>
            `
        }
      </div>

      <!-- BODY -->
      <div class="portfolio-card__body">
        <!-- CATEGORY -->
        <p class="portfolio-card__category">
          ${escapeHtml(category)}
        </p>

        <!-- TITLE -->
        <h2 class="portfolio-card__name">
          ${escapeHtml(portfolio.title)}
        </h2>

        <!-- CLIENT -->
        ${
          portfolio.client_name
            ? `
              <p class="portfolio-card__client">
                ${escapeHtml(portfolio.client_name)}
              </p>
            `
            : ""
        }

        <!-- TYPES -->
        ${
          tagsHTML
            ? `
              <div class="portfolio-card__tags">
                ${tagsHTML}
              </div>
            `
            : ""
        }

        <!-- ADMIN ACTIONS -->
        <div class="portfolio-actions">
          <!-- SHOW / HIDE -->
          <label
            class="visibility-switch"
            title="Tampilkan atau sembunyikan portfolio"
          >
            <input
              type="checkbox"
              class="visibility-checkbox"
              data-id="${portfolio.id}"
              ${portfolio.is_visible ? "checked" : ""}
            >
            <span class="switch"></span>
            <span class="visibility-label">
              ${portfolio.is_visible ? "Showing" : "Hiding"}
            </span>
          </label>

          <!-- EDIT -->
          <a
            href="./admin.html?id=${encodeURIComponent(portfolio.id)}"
            class="btn-edit"
          >
            Edit
          </a>
        </div>
      </div>
    `;

    portfolioGrid.appendChild(card);
  });

  // Re-attach switch events
  document
    .querySelectorAll(".visibility-checkbox")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", handleVisibilityChange);
    });
}

// ========================================
// SHOW / HIDE PORTFOLIO
// ========================================

async function handleVisibilityChange(event) {
  const checkbox = event.target;
  const portfolioId = checkbox.dataset.id;
  const isVisible = checkbox.checked;

  const wrapper = checkbox.closest(".visibility-switch");
  const label = wrapper.querySelector(".visibility-label");

  label.textContent = isVisible ? "Showing" : "Hiding";
  checkbox.disabled = true;

  // Update Supabase
  const { error } = await supabaseClient
    .from("portofolio")
    .update({
      is_visible: isVisible
    })
    .eq("id", portfolioId);

  if (error) {
    console.error("Gagal mengubah visibility:", error);
    checkbox.checked = !isVisible;
    label.textContent = checkbox.checked ? "Showing" : "Hiding";
    checkbox.disabled = false;
    alert("Gagal mengubah status portfolio:\n\n" + error.message);
    return;
  }

  checkbox.disabled = false;

  // Update in local data
  const targetPortfolio = allPortfoliosData.find((p) => p.id === portfolioId);
  if (targetPortfolio) {
    targetPortfolio.is_visible = isVisible;
  }

  // Re-render keeping current filter & sorting showing to top
  renderPortfolios();
}

// ========================================
// ESCAPE HTML
// ========================================

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ========================================
// START
// ========================================

loadPortfolio();