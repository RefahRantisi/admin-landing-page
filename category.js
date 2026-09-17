const SUPABASE_URL = "https://rkodmrvceeoejlnmvfob.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JX24wW5kGRlp4gqn-zxi3w_4P4MzJyZ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const categoryForm = document.getElementById("categoryForm");
const nameInput = document.getElementById("name");
const slugInput = document.getElementById("slug");
const categoryList = document.getElementById("categoryList");
const submitButton = document.getElementById("submitButton");
const editingCategoryId = new URLSearchParams(window.location.search).get("id");

nameInput.addEventListener("input", () => {
  slugInput.value = nameInput.value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
});

async function loadCategories() {
  categoryList.textContent = "Memuat kategori...";

  const { data, error } = await supabaseClient
    .from("categories")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    categoryList.textContent = "Gagal memuat kategori.";
    return;
  }

  if (!data || data.length === 0) {
    categoryList.textContent = "Belum ada kategori.";
    return;
  }

  categoryList.innerHTML = "";
  data.forEach((category) => {
    const item = document.createElement("div");
    item.className = "category-item";
    item.innerHTML = `
      <div>
        <div class="category-name">${escapeHtml(category.name)}</div>
        <div class="category-slug">/${escapeHtml(category.slug)}</div>
      </div>
      <div class="category-actions">
        <button type="button" class="btn-edit" data-edit-id="${escapeHtml(category.id)}">Edit</button>
        <button type="button" class="btn-delete" data-delete-id="${escapeHtml(category.id)}">Hapus</button>
      </div>
    `;
    categoryList.appendChild(item);
  });

  categoryList.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `category.html?id=${encodeURIComponent(button.dataset.editId)}`;
    });
  });

  categoryList.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteCategory(button.dataset.deleteId));
  });
}

async function loadCategoryForEdit() {
  if (!editingCategoryId) return;

  document.getElementById("pageTitle").textContent = "Edit Kategori";
  document.getElementById("pageDescription").textContent = "Perbarui kategori portfolio.";
  submitButton.textContent = "Simpan Perubahan";

  const { data, error } = await supabaseClient
    .from("categories")
    .select("id, name, slug")
    .eq("id", editingCategoryId)
    .single();

  if (error) {
    showMessage("Gagal memuat kategori: " + error.message, "error");
    return;
  }

  nameInput.value = data.name || "";
  slugInput.value = data.slug || "";
}

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const slug = slugInput.value.trim();
  if (!name || !slug) {
    showMessage("Nama dan slug wajib diisi.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = editingCategoryId ? "Menyimpan Perubahan..." : "Menyimpan...";

  const query = editingCategoryId
    ? supabaseClient.from("categories").update({ name, slug }).eq("id", editingCategoryId)
    : supabaseClient.from("categories").insert([{ name, slug }]);
  const { error } = await query;

  if (error) {
    console.error(error);
    showMessage(
      error.code === "23505"
        ? "Nama atau slug tersebut sudah ada."
        : "Gagal menyimpan kategori: " + error.message,
      "error"
    );
    submitButton.disabled = false;
    submitButton.textContent = editingCategoryId ? "Simpan Perubahan" : "Simpan Kategori";
    return;
  }

  showMessage(
    editingCategoryId ? "Kategori berhasil diperbarui!" : "Kategori berhasil ditambahkan!",
    "success"
  );
  categoryForm.reset();
  submitButton.disabled = false;
  submitButton.textContent = editingCategoryId ? "Simpan Perubahan" : "Simpan Kategori";
  loadCategories();
});

async function deleteCategory(categoryId) {
  if (!window.confirm("Hapus kategori ini? Portfolio yang menggunakan kategori ini akan diubah menjadi tanpa kategori.")) return;

  const { error: portfolioError } = await supabaseClient
    .from("portofolio")
    .update({ category_id: null })
    .eq("category_id", categoryId);

  if (portfolioError) {
    showMessage("Gagal memperbarui relasi portfolio: " + portfolioError.message, "error");
    return;
  }

  const { error } = await supabaseClient
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    showMessage("Gagal menghapus kategori: " + error.message, "error");
    return;
  }

  showMessage("Kategori berhasil dihapus.", "success");
  loadCategories();
}

function showMessage(message, type) {
  const element = document.getElementById("message");
  element.textContent = message;
  element.className = "message " + type;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function initialize() {
  await loadCategoryForEdit();
  await loadCategories();
}

initialize();