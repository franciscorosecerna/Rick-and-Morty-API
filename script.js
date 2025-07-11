const API_URL = "https://rickandmortyapi.com/api/character";
const getAllBtn = document.getElementById("getAllBtn");
const filterForm = document.getElementById("filterForm");
const resultsDiv = document.getElementById("results");
const errorMsg = document.getElementById("error");

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

getAllBtn.addEventListener("click", async () => {
  errorMsg.textContent = "";
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al obtener personajes");
    const data = await res.json();
    renderCharacters(data.results);
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});

filterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const name = document.getElementById("name").value;
  const status = document.getElementById("status").value;
  const species = document.getElementById("species").value;
  const type = document.getElementById("type").value;
  const gender = document.getElementById("gender").value;

  const params = new URLSearchParams();

  if (name) params.append("name", name);
  if (status) params.append("status", status);
  if (species) params.append("species", species);
  if (type) params.append("type", type);
  if (gender) params.append("gender", gender);

  try {
    const res = await fetch(`${API_URL}/?${params.toString()}`);
    if (!res.ok) throw new Error("No se encontraron personajes con esos filtros");
    const data = await res.json();
    renderCharacters(data.results);
  } catch (err) {
    resultsDiv.innerHTML = "";
    errorMsg.textContent = err.message;
  }
});
