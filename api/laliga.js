// ==== Tabla API SPORTS 2.0 ====

async function cargarClasificacion() {
  try {
    const respuesta = await fetch("https://v3.football.api-sports.io/standings?league=140&season=2023", {
      headers: {
        "x-rapidapi-key": "3293e65ec5f775049e124ee3810d46da",
        "x-rapidapi-host": "v3.football.api-sports.io"
      }
    });

    if (!respuesta.ok) throw new Error(`HTTP error: ${respuesta.status}`);

    const datos = await respuesta.json();
    console.log(datos); // Para comprobar la estructura

    const tabla = datos.response[0].league.standings[0];
    const tbody = document.getElementById("tablaClasificacion");
    tbody.innerHTML = "";

    tabla.forEach((equipo, i) => {
      tbody.innerHTML += `
        <tr class="border-t border-gray-700">
          <td class="py-1">${i+1}</td>
          <td class="py-1 flex items-center gap-2 justify-center">
            <img src="${equipo.team.logo}" alt="${equipo.team.name}" class="h-6 w-6">
            ${equipo.team.name}
          </td>
          <td class="py-1">${equipo.points}</td>
          <td class="py-1">${equipo.all.played}</td>
          <td class="py-1">${equipo.all.win}</td>
          <td class="py-1">${equipo.all.draw}</td>
          <td class="py-1">${equipo.all.lose}</td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error cargando la clasificación:", error);
  }
}

cargarClasificacion();