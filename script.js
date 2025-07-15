const API_URL = "https://rickandmortyapi.com/api/character";
const getAllBtn = document.getElementById("getAllBtn");
const filterForm = document.getElementById("filterForm");
const resultsDiv = document.getElementById("results");
const errorMsg = document.getElementById("error");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const currentPageSpan = document.getElementById("currentPage");

let currentPage = 1;
let totalPages = 1;
let currentFilters = null;

function renderCharacters(characters) {
  resultsDiv.innerHTML = "";
  characters.forEach((char) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${char.image}" alt="${char.name}" />
      <h3>${char.name}</h3>
      <p><strong>Status:</strong> ${char.status}</p>
      <p><strong>Species:</strong> ${char.species}</p>
      <p><strong>Gender:</strong> ${char.gender}</p>
    `;
    resultsDiv.appendChild(card);
  });
}

function updatePaginationUI() {
  currentPageSpan.textContent = `Página: ${currentPage}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

async function fetchCharacters(page = 1, filters = null) {
  errorMsg.textContent = "";
  resultsDiv.innerHTML = "";
  currentPage = page;
  currentFilters = filters;

  const params = new URLSearchParams(filters || {});
  params.append("page", page);

  try {
    const res = await fetch(`${API_URL}/?${params.toString()}`);
    if (!res.ok) throw new Error("No se encontraron personajes en esta página.");
    const data = await res.json();
    renderCharacters(data.results);
    totalPages = data.info.pages;
    updatePaginationUI();
  } catch (err) {
    errorMsg.textContent = err.message;
    updatePaginationUI();
  }
}

getAllBtn.addEventListener("click", () => {
  fetchCharacters(1);
});

filterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const status = document.getElementById("status").value;
  const species = document.getElementById("species").value;
  const type = document.getElementById("type").value;
  const gender = document.getElementById("gender").value;

  const filters = {};
  if (name) filters.name = name;
  if (status) filters.status = status;
  if (species) filters.species = species;
  if (type) filters.type = type;
  if (gender) filters.gender = gender;

  fetchCharacters(1, filters);
});

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    fetchCharacters(currentPage - 1, currentFilters);
  }
});

nextPageBtn.addEventListener("click", () => {
  if (currentPage < totalPages) {
    fetchCharacters(currentPage + 1, currentFilters);
  }
});