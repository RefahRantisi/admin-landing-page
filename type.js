const SUPABASE_URL = "https://rkodmrvceeoejlnmvfob.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JX24wW5kGRlp4gqn-zxi3w_4P4MzJyZ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const typeForm = document.getElementById("typeForm");
const nameInput = document.getElementById("name");
const slugInput = document.getElementById("slug");
const typeList = document.getElementById("typeList");
const submitButton = document.getElementById("submitButton");
const editingTypeId = new URLSearchParams(window.location.search).get("id");

nameInput.addEventListener("input", () => {
  slugInput.value = nameInput.value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
});

async function loadTypes() {
  typeList.textContent = "Memuat jenis website...";

  const { data, error } = await supabaseClient
    .from("types")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    typeList.textContent = "Gagal memuat jenis website.";
    return;
  }

  if (!data || data.length === 0) {
    typeList.textContent = "Belum ada jenis website.";
    return;
  }

  typeList.innerHTML = "";
  data.forEach((type) => {
    const item = document.createElement("div");
    item.className = "type-item";
    item.innerHTML = `
      <div>
        <div class="type-name">${escapeHtml(type.name)}</div>
        <div class="type-slug">/${escapeHtml(type.slug)}</div>
      </div>
      <div class="type-actions">
        <button type="button" class="btn-edit" data-edit-id="${escapeHtml(type.id)}">Edit</button>
        <button type="button" class="btn-delete" data-delete-id="${escapeHtml(type.id)}">Hapus</button>
      </div>
    `;
    typeList.appendChild(item);
  });

  typeList.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `type.html?id=${encodeURIComponent(button.dataset.editId)}`;
    });
  });

  typeList.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteType(button.dataset.deleteId));
  });
}

async function loadTypeForEdit() {
  if (!editingTypeId) return;

  document.getElementById("pageTitle").textContent = "Edit Jenis Website";
  document.getElementById("pageDescription").textContent = "Perbarui jenis website portfolio.";
  submitButton.textContent = "Simpan Perubahan";

  const { data, error } = await supabaseClient
    .from("types")
    .select("id, name, slug")
    .eq("id", editingTypeId)
    .single();

  if (error) {
    showMessage("Gagal memuat jenis website: " + error.message, "error");
    return;
  }

  nameInput.value = data.name || "";
  slugInput.value = data.slug || "";
}

typeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const slug = slugInput.value.trim();
  if (!name || !slug) {
    showMessage("Nama dan slug wajib diisi.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = editingTypeId ? "Menyimpan Perubahan..." : "Menyimpan...";

  const query = editingTypeId
    ? supabaseClient.from("types").update({ name, slug }).eq("id", editingTypeId)
    : supabaseClient.from("types").insert([{ name, slug }]);
  const { error } = await query;

  if (error) {
    console.error(error);
    showMessage(
      error.code === "23505"
        ? "Nama atau slug tersebut sudah ada."
        : "Gagal menyimpan jenis website: " + error.message,
      "error"
    );
    submitButton.disabled = false;
    submitButton.textContent = editingTypeId ? "Simpan Perubahan" : "Simpan Jenis Website";
    return;
  }

  showMessage(
    editingTypeId ? "Jenis website berhasil diperbarui!" : "Jenis website berhasil ditambahkan!",
    "success"
  );
  typeForm.reset();
  submitButton.disabled = false;
  submitButton.textContent = editingTypeId ? "Simpan Perubahan" : "Simpan Jenis Website";
  loadTypes();
});

async function deleteType(typeId) {
  if (!window.confirm("Hapus jenis website ini? Relasi portfolio yang menggunakannya juga akan dihapus.")) return;

  const { error: relationError } = await supabaseClient
    .from("portfolio_types")
    .delete()
    .eq("type_id", typeId);

  if (relationError) {
    showMessage("Gagal menghapus relasi jenis website: " + relationError.message, "error");
    return;
  }

  const { error } = await supabaseClient
    .from("types")
    .delete()
    .eq("id", typeId);

  if (error) {
    showMessage("Gagal menghapus jenis website: " + error.message, "error");
    return;
  }

  showMessage("Jenis website berhasil dihapus.", "success");
  loadTypes();
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
  await loadTypeForEdit();
  await loadTypes();
}

initialize();
