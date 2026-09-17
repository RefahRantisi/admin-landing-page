const SUPABASE_URL = "https://rkodmrvceeoejlnmvfob.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_JX24wW5kGRlp4gqn-zxi3w_4P4MzJyZ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ========================================
// CEK MODE TAMBAH / EDIT
// ========================================

const urlParams = new URLSearchParams(
  window.location.search
);

const portfolioId =
  (urlParams.get("id") || "").trim();

const isEditMode =
  portfolioId !== "";


// ========================================
// ELEMENT
// ========================================

const portfolioForm =
  document.getElementById("portfolioForm");

const submitButton =
  portfolioForm.querySelector(
    'button[type="submit"]'
  );

const titleInput =
  document.getElementById("title");

const slugInput =
  document.getElementById("slug");

const categorySelect =
  document.getElementById("category");

const typeOptions =
  document.getElementById("typeOptions");


// ========================================
// LOAD CATEGORIES
// ========================================

async function loadCategories() {

  const {
    data,
    error
  } = await supabaseClient

    .from("categories")

    .select("id, name")

    .order("name", {
      ascending: true
    });


  if (error) {

    console.error(
      "Gagal memuat kategori:",
      error
    );

    categorySelect.innerHTML = `
      <option value="">
        Gagal memuat kategori
      </option>
    `;

    return false;
  }


  categorySelect.innerHTML = `
    <option value="">
      Pilih kategori
    </option>
  `;


  data.forEach((category) => {

    const option =
      document.createElement("option");

    option.value =
      category.id;

    option.textContent =
      category.name;

    categorySelect.appendChild(
      option
    );

  });


  return true;
}


// ========================================
// LOAD WEBSITE TYPES
// ========================================

async function loadTypes() {

  const {
    data,
    error
  } = await supabaseClient

    .from("types")

    .select("id, name, slug")

    .order("name", {
      ascending: true
    });


  if (error) {

    console.error(
      "Gagal memuat jenis website:",
      error
    );

    typeOptions.innerHTML = `
      <p>
        Gagal memuat jenis website.
      </p>
    `;

    return false;
  }


  if (!data || data.length === 0) {

    typeOptions.innerHTML = `
      <p>
        Belum ada jenis website.
      </p>
    `;

    return true;
  }


  typeOptions.innerHTML = "";


  data.forEach((type) => {

    const label =
      document.createElement("label");

    label.className =
      "type-option";


    const checkbox =
      document.createElement("input");

    checkbox.type =
      "checkbox";

    checkbox.name =
      "type_ids";

    checkbox.value =
      type.id;


    const text =
      document.createElement("span");

    text.textContent =
      type.name;


    label.appendChild(
      checkbox
    );

    label.appendChild(
      text
    );


    typeOptions.appendChild(
      label
    );

  });


  return true;
}


// ========================================
// AUTO GENERATE SLUG
// ========================================

titleInput.addEventListener(
  "input",
  () => {

    // Hanya generate otomatis
    // kalau bukan mode edit

    if (isEditMode) {
      return;
    }


    const slug =
      titleInput.value

        .toLowerCase()

        .trim()

        .replace(
          /[^\w\s-]/g,
          ""
        )

        .replace(
          /\s+/g,
          "-"
        )

        .replace(
          /-+/g,
          "-"
        );


    slugInput.value =
      slug;

  }
);


// ========================================
// LOAD PORTFOLIO UNTUK EDIT
// ========================================

async function loadPortfolioForEdit() {

  if (!isEditMode) {
    return;
  }


  updateEditModeUI();


  submitButton.disabled =
    true;

  submitButton.textContent =
    "Memuat data...";


  console.log(
    "Memuat portfolio dengan ID:",
    portfolioId
  );


  // ========================================
  // AMBIL DATA PORTFOLIO
  // ========================================

  const {
    data: portfolio,
    error: portfolioError
  } = await supabaseClient

    .from("portofolio")

    .select(`
      id,
      title,
      slug,
      category_id,
      client_name,
      image_url,
      project_url
    `)

    .eq(
      "id",
      portfolioId
    )

    .single();


  if (portfolioError) {

    console.error(
      "Gagal mengambil portfolio:",
      portfolioError
    );

    showMessage(
      "Gagal memuat portfolio: " +
        portfolioError.message,
      "error"
    );


    submitButton.disabled =
      false;

    submitButton.textContent =
      "Simpan Perubahan";


    return;
  }


  if (!portfolio) {

    showMessage(
      "Portfolio tidak ditemukan.",
      "error"
    );


    submitButton.disabled =
      false;

    submitButton.textContent =
      "Simpan Perubahan";


    return;
  }


  // ========================================
  // ISI DATA KE FORM
  // ========================================

  titleInput.value =
    portfolio.title || "";


  slugInput.value =
    portfolio.slug || "";


  categorySelect.value =
    portfolio.category_id || "";


  document.getElementById(
    "client_name"
  ).value =
    portfolio.client_name || "";


  document.getElementById(
    "image_url"
  ).value =
    portfolio.image_url || "";


  document.getElementById(
    "project_url"
  ).value =
    portfolio.project_url || "";


  // ========================================
  // AMBIL TYPE PORTFOLIO
  // ========================================

  const {
    data: portfolioTypes,
    error: typesError
  } = await supabaseClient

    .from("portfolio_types")

    .select("type_id")

    .eq(
      "portfolio_id",
      portfolioId
    );


  if (typesError) {

    console.error(
      "Gagal mengambil jenis website:",
      typesError
    );


    showMessage(
      "Portfolio berhasil dimuat, tetapi jenis website gagal dimuat: " +
        typesError.message,
      "error"
    );

  } else {

    const selectedTypeIds =
      new Set(
        (portfolioTypes || []).map(
          (item) =>
            String(item.type_id)
        )
      );


    typeOptions

      .querySelectorAll(
        'input[name="type_ids"]'
      )

      .forEach(
        (checkbox) => {

          checkbox.checked =
            selectedTypeIds.has(
              String(checkbox.value)
            );

        }
      );

  }


  // ========================================
  // SELESAI
  // ========================================

  submitButton.disabled =
    false;

  submitButton.textContent =
    "Simpan Perubahan";


  console.log(
    "Portfolio berhasil dimuat:",
    portfolio
  );

}


// ========================================
// UPDATE UI EDIT
// ========================================

function updateEditModeUI() {

  const pageTitle =
    document.querySelector(
      ".admin-header h1"
    );


  if (pageTitle) {

    pageTitle.textContent =
      "Edit Portfolio";

  }


  const pageSubtitle =
    document.querySelector(
      ".admin-header p"
    );


  if (pageSubtitle) {

    pageSubtitle.textContent =
      "Edit informasi portfolio.";

  }


  if (submitButton) {

    submitButton.textContent =
      "Simpan Perubahan";

  }

}


// ========================================
// AMBIL TYPE YANG DIPILIH
// ========================================

function getSelectedTypeIds() {

  return Array.from(

    typeOptions.querySelectorAll(
      'input[name="type_ids"]:checked'
    )

  ).map(

    (checkbox) =>
      checkbox.value

  );

}


// ========================================
// SIMPAN RELASI PORTFOLIO TYPES
// ========================================

async function syncPortfolioTypes(
  portfolioId,
  typeIds
) {

  console.log(
    "Sync portfolio types:",
    portfolioId,
    typeIds
  );


  // ========================================
  // HAPUS RELASI LAMA
  // ========================================

  const {
    error: deleteError
  } = await supabaseClient

    .from("portfolio_types")

    .delete()

    .eq(
      "portfolio_id",
      portfolioId
    );


  if (deleteError) {

    return deleteError;

  }


  // ========================================
  // JIKA TIDAK ADA TYPE
  // ========================================

  if (
    !typeIds ||
    typeIds.length === 0
  ) {

    return null;

  }


  // ========================================
  // BUAT DATA RELASI
  // ========================================

  const relationData =
    typeIds.map(
      (typeId) => ({

        portfolio_id:
          portfolioId,

        type_id:
          typeId

      })
    );


  // ========================================
  // INSERT RELASI
  // ========================================

  const {
    error: insertError
  } = await supabaseClient

    .from("portfolio_types")

    .insert(
      relationData
    );


  if (insertError) {

    return insertError;

  }


  return null;

}


// ========================================
// SUBMIT FORM
// ========================================

portfolioForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    submitButton.disabled =
      true;


    submitButton.textContent =
      isEditMode
        ? "Menyimpan Perubahan..."
        : "Menyimpan...";


    // ========================================
    // AMBIL TYPE
    // ========================================

    const selectedTypeIds =
      getSelectedTypeIds();


    console.log(
      "Type yang dipilih:",
      selectedTypeIds
    );


    // ========================================
    // AMBIL DATA FORM
    // ========================================

    const portfolioData = {

      title:
        document
          .getElementById(
            "title"
          )
          .value
          .trim(),


      slug:
        document
          .getElementById(
            "slug"
          )
          .value
          .trim(),


      category_id:
        document
          .getElementById(
            "category"
          )
          .value ||
        null,


      client_name:
        document
          .getElementById(
            "client_name"
          )
          .value
          .trim() ||
        null,


      image_url:
        document
          .getElementById(
            "image_url"
          )
          .value
          .trim() ||
        null,


      project_url:
        document
          .getElementById(
            "project_url"
          )
          .value
          .trim() ||
        null

    };


    // ========================================
    // VALIDASI FORM
    // ========================================

    const resetButton = () => {

      submitButton.disabled =
        false;

      submitButton.textContent =
        isEditMode
          ? "Simpan Perubahan"
          : "Simpan Portfolio";

    };


    if (!portfolioData.title) {

      showMessage(
        "Judul portfolio wajib diisi.",
        "error"
      );

      resetButton();
      return;
    }


    if (!portfolioData.category_id) {

      showMessage(
        "Pilih kategori untuk portfolio.",
        "error"
      );

      resetButton();
      return;
    }


    if (!portfolioData.client_name) {

      showMessage(
        "Nama client wajib diisi.",
        "error"
      );

      resetButton();
      return;
    }


    if (
      selectedTypeIds.length === 0
    ) {

      showMessage(
        "Pilih minimal satu jenis website.",
        "error"
      );

      resetButton();
      return;
    }


    // ========================================
    // MODE EDIT
    // ========================================

    if (isEditMode) {

      console.log(
        "Mengupdate portfolio:",
        portfolioId
      );


      // ----------------------------------------
      // UPDATE PORTFOLIO
      // ----------------------------------------

      const {
        error: updateError
      } = await supabaseClient

        .from("portofolio")

        .update(
          portfolioData
        )

        .eq(
          "id",
          portfolioId
        );


      if (updateError) {

        console.error(
          "Gagal mengupdate portfolio:",
          updateError
        );


        showMessage(
          "Gagal mengupdate portfolio: " +
            updateError.message,
          "error"
        );


        submitButton.disabled =
          false;


        submitButton.textContent =
          "Simpan Perubahan";


        return;
      }


      // ----------------------------------------
      // UPDATE RELASI TYPES
      // ----------------------------------------

      const relationError =
        await syncPortfolioTypes(
          portfolioId,
          selectedTypeIds
        );


      if (relationError) {

        console.error(
          "Gagal mengupdate jenis website:",
          relationError
        );


        showMessage(
          "Portfolio berhasil diperbarui, tetapi jenis website gagal disimpan: " +
            relationError.message,
          "error"
        );


        submitButton.disabled =
          false;


        submitButton.textContent =
          "Simpan Perubahan";


        return;
      }


      // ----------------------------------------
      // BERHASIL
      // ----------------------------------------

      showMessage(
        "Portfolio berhasil diperbarui!",
        "success"
      );


      setTimeout(
        () => {

          window.location.href =
            "index.html";

        },
        1000
      );


      return;
    }


    // ========================================
    // MODE TAMBAH
    // ========================================

    console.log(
      "Menambahkan portfolio baru..."
    );


    const {
      data: newPortfolio,
      error: insertError
    } = await supabaseClient

      .from("portofolio")

      .insert([
        portfolioData
      ])

      .select("id")

      .single();


    // ----------------------------------------
    // ERROR INSERT
    // ----------------------------------------

    if (insertError) {

      console.error(
        "Gagal menambahkan portfolio:",
        insertError
      );


      showMessage(
        "Gagal menyimpan portfolio: " +
          insertError.message,
        "error"
      );


      submitButton.disabled =
        false;


      submitButton.textContent =
        "Simpan Portfolio";


      return;
    }


    // ========================================
    // SIMPAN RELASI TYPES
    // ========================================

    const relationError =
      await syncPortfolioTypes(
        newPortfolio.id,
        selectedTypeIds
      );


    if (relationError) {

      console.error(
        "Gagal menyimpan jenis website:",
        relationError
      );


      showMessage(
        "Portfolio berhasil dibuat, tetapi jenis website gagal disimpan: " +
          relationError.message,
        "error"
      );


      submitButton.disabled =
        false;


      submitButton.textContent =
        "Simpan Portfolio";


      return;
    }


    // ========================================
    // BERHASIL
    // ========================================

    showMessage(
      "Portfolio berhasil ditambahkan!",
      "success"
    );


    portfolioForm.reset();


    submitButton.disabled =
      false;


    submitButton.textContent =
      "Simpan Portfolio";

  }
);


// ========================================
// MESSAGE
// ========================================

function showMessage(
  message,
  type
) {

  const messageElement =
    document.getElementById(
      "message"
    );


  if (!messageElement) {
    return;
  }


  messageElement.textContent =
    message;


  messageElement.className =
    "message " + type;

}


// ========================================
// INITIALIZE
// ========================================

async function initialize() {

  console.log(
    "Mode:",
    isEditMode
      ? "EDIT"
      : "TAMBAH"
  );


  if (isEditMode) {

    console.log(
      "Portfolio ID:",
      portfolioId
    );

  }


  // ========================================
  // LOAD CATEGORY
  // ========================================

  const categoriesLoaded =
    await loadCategories();


  // ========================================
  // LOAD TYPES
  // ========================================

  const typesLoaded =
    await loadTypes();


  // ========================================
  // CEK HASIL LOAD
  // ========================================

  if (
    !categoriesLoaded ||
    !typesLoaded
  ) {

    submitButton.disabled =
      true;

    return;

  }


  // ========================================
  // MODE EDIT
  // ========================================

  if (isEditMode) {

    await loadPortfolioForEdit();

  }

}


// ========================================
// START
// ========================================

initialize();