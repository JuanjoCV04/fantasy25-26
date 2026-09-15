// ============================================================
// CONFIGURACIÓN
// ============================================================
// Carpeta donde están los ficheros jornada1.json, jornada2.json...
// Por defecto busca en la misma carpeta que este HTML.
// Si tus JSON están en otra carpeta (por ejemplo la que usa tu
// scraper), cambia esto, p.ej: const DATA_PATH = '../ScrapBw/';
const DATA_PATH = './';

// Límite de seguridad: hasta qué número de jornada se intenta cargar.
// No hace falta tocarlo, simplemente para de cargar en cuanto un
// jornadaN.json no existe.
const MAX_JORNADAS = 60;

// Carpeta donde están las fotos de los managers, nombradas como su "codigo"
// del pX.json (ej: avatars/kino.jpg). Si la foto no existe, se muestra
// automáticamente un círculo con la inicial del nombre.
const AVATAR_PATH = 'avatars/';
const AVATAR_EXT = '.jpg';

// Posiciones mapeadas según el ID del JSON
const POSITIONS = { 1: 'POR', 2: 'DEF', 3: 'MED', 4: 'DEL', 5: 'ENT' };

// Mapeo de tipos de eventos basándonos en el JSON
const EVENT_TYPES = {
    1: { icon: '⚽', label: 'Gol' },
    2: { icon: '🥅', label: 'Gol de Penalti' },
    3: { icon: '👟', label: 'Asistencia' },
    4: { icon: '⬇️', label: 'Sale' },
    5: { icon: '⬆️', label: 'Entra' },
    6: { icon: '🟨', label: 'Tarjeta Amarilla' },
    7: { icon: '🟥', label: 'Tarjeta Roja' },
    10: { icon: '🧤', label: 'Parada' },
    13: { icon: '❌', label: 'Penalti Fallado' },
    14: { icon: '⚠️', label: 'Falta' },
    16: { icon: '🟨🟥', label: 'Doble Amarilla' }
};

// ============================================================
// ESTADO GLOBAL
// ============================================================
// rounds = [{ num: 1, data: {...} }, { num: 2, data: {...} }, ...]
// Se llenan automáticamente probando jornada1.json, jornada2.json, etc.
let rounds = [];
let currentIndex = 0;

// puntuacionesRounds = [{ num: 1, jugadores: [{nombre, puntosJornada, jugados}] }, ...]
// Se llenan automáticamente probando puntuaciones1.json, puntuaciones2.json, etc.
let puntuacionesRounds = [];
// 'jornada' -> se está viendo la tabla de puntuaciones de una jornada concreta
// 'general' -> se está viendo la clasificación acumulada de toda la liga privada
let currentMode = 'jornada';

document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        await Promise.all([loadAllJornadas(), loadAllPuntuaciones()]);

        if (rounds.length === 0) {
            throw new Error('No se encontró ningún jornadaX.json. Revisa DATA_PATH en script.js y que estés usando un servidor local.');
        }

        // Por defecto se muestra la última jornada cargada (la más reciente)
        currentIndex = rounds.length - 1;
        currentMode = 'jornada';

        document.getElementById('season-label').textContent =
            getLastRound().data.season ? getLastRound().data.season.name : '';

        renderStandings(getLastRound().data.competition.standings[0].teams);
        renderRoundTabs();
        renderRoundExtras();
        renderMatches(getCurrentRound().data.games);
        renderQuickStats();
        renderTopStats();
        renderPuntuacionesJornada();
        toggleBoteBox(false);
        setupModal();
    } catch (error) {
        console.error('Error inicializando el dashboard:', error);
        document.getElementById('standings-body').innerHTML =
            `<tr><td colspan="10">Error cargando datos: ${error.message}</td></tr>`;
    }
}

// Intenta cargar jornada1.json, jornada2.json... hasta que uno falle.
// Así, cuando tengas más jornadas en el futuro, no hay que tocar el código.
async function loadAllJornadas() {
    for (let n = 1; n <= MAX_JORNADAS; n++) {
        try {
            const response = await fetch(`${DATA_PATH}jornada${n}.json`, { cache: 'no-store' });
            if (!response.ok) break;

            const json = await response.json();
            if (!json || !json.data) break;

            rounds.push({ num: n, data: json.data });
        } catch (err) {
            break; // no hay más jornadas (o hubo un problema de red/CORS)
        }
    }
}

function getCurrentRound() { return rounds[currentIndex]; }
function getLastRound() { return rounds[rounds.length - 1]; }

// Intenta cargar p1.json, p2.json... hasta que uno falle.
// Es opcional: si no existe ninguno, la sección de Puntuaciones simplemente
// se queda vacía a la espera de que rellenes las plantillas.
async function loadAllPuntuaciones() {
    for (let n = 1; n <= MAX_JORNADAS; n++) {
        try {
            const response = await fetch(`${DATA_PATH}p${n}.json`, { cache: 'no-store' });
            if (!response.ok) break;

            const json = await response.json();
            if (!json || !Array.isArray(json.jugadores)) break;

            puntuacionesRounds.push({ num: n, jugadores: json.jugadores });
        } catch (err) {
            break;
        }
    }
}

// ============================================================
// 0. Estadísticas rápidas (resumen de toda la temporada cargada)
// ============================================================
function renderQuickStats() {
    const box = document.getElementById('quick-stats');
    if (!box) return;

    let playedGames = 0;
    let totalGoals = 0;

    rounds.forEach(r => {
        r.data.games.forEach(g => {
            if (g.status === 'finished') {
                playedGames++;
                totalGoals += (g.home.score || 0) + (g.away.score || 0);
            }
        });
    });

    const avgGoals = playedGames ? (totalGoals / playedGames).toFixed(2) : '0';

    box.innerHTML = `
        <div class="quick-stat">
            <span class="qs-value">${rounds.length}</span>
            <span class="qs-label">Jornadas cargadas</span>
        </div>
        <div class="quick-stat">
            <span class="qs-value">${playedGames}</span>
            <span class="qs-label">Partidos jugados</span>
        </div>
        <div class="quick-stat">
            <span class="qs-value">${totalGoals}</span>
            <span class="qs-label">Goles totales</span>
        </div>
        <div class="quick-stat">
            <span class="qs-value">${avgGoals}</span>
            <span class="qs-label">Goles / partido</span>
        </div>
    `;
}

// ============================================================
// 1. Tabla de Clasificación General (siempre la de la última jornada)
// ============================================================
function renderStandings(teams) {
    const tbody = document.getElementById('standings-body');
    tbody.innerHTML = '';

    teams.forEach(t => {
        const played = t.won + t.tied + t.lost;
        const goalDiff = t.scored - t.against;
        const gdColor = goalDiff > 0 ? 'var(--success)' : goalDiff < 0 ? 'var(--danger)' : 'var(--text-muted)';

        const tr = document.createElement('tr');
        tr.className = `pos-${t.position}`;
        tr.innerHTML = `
            <td>${t.position}</td>
            <td class="team-name">${t.team.name}</td>
            <td class="pts">${t.points}</td>
            <td>${played}</td>
            <td>${t.won}</td>
            <td>${t.tied}</td>
            <td>${t.lost}</td>
            <td>${t.scored}</td>
            <td>${t.against}</td>
            <td style="color: ${gdColor}; font-weight: bold;">${goalDiff > 0 ? '+' + goalDiff : goalDiff}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================================
// 2. Pestañas de jornadas (una por cada jornadaX.json cargado) + "General"
// ============================================================
function renderRoundTabs() {
    const nav = document.getElementById('round-tabs');
    nav.innerHTML = '';

    // Botón "General": clasificación acumulada de la liga privada de Puntuaciones
    const generalBtn = document.createElement('button');
    generalBtn.className = 'round-tab round-tab-general' + (currentMode === 'general' ? ' active' : '');
    generalBtn.textContent = '🏆 General';
    generalBtn.title = 'Clasificación acumulada de la liga';
    generalBtn.addEventListener('click', () => selectGeneralTab(generalBtn));
    nav.appendChild(generalBtn);

    rounds.forEach((r, idx) => {
        const btn = document.createElement('button');
        btn.className = 'round-tab' + (currentMode === 'jornada' && idx === currentIndex ? ' active' : '');
        const statusIcon = r.data.status === 'finished' ? '' : (r.data.status === 'active' ? ' 🔴' : ' ⏳');
        btn.textContent = (r.data.short || `J${r.num}`) + statusIcon;
        btn.title = r.data.name;
        btn.addEventListener('click', () => selectJornadaTab(idx, btn));
        nav.appendChild(btn);
    });
}

// Click en una pestaña J1, J2, J3... -> muestra esa jornada (partidos + puntuaciones de esa jornada)
function selectJornadaTab(idx, btnEl) {
    currentMode = 'jornada';
    currentIndex = idx;
    document.querySelectorAll('.round-tab').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    renderRoundExtras();
    renderMatches(getCurrentRound().data.games);
    renderPuntuacionesJornada();
    toggleBoteBox(false);
}

// Click en "General" -> muestra la clasificación acumulada de la liga privada.
// El bloque de LaLiga (partidos, MVP, once ideal) se deja tal cual estaba.
function selectGeneralTab(btnEl) {
    currentMode = 'general';
    document.querySelectorAll('.round-tab').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    renderPuntuacionesGeneral();
}

// ============================================================
// 3. Extras de la jornada seleccionada: título, MVP, Once ideal
// ============================================================
function renderRoundExtras() {
    const round = getCurrentRound().data;

    document.getElementById('jornada-title').textContent = round.name;

    // MVP de la jornada
    const mvpBox = document.getElementById('mvp-box');
    if (round.mvp) {
        const realPoints = findPlayerPointsInRound(round, round.mvp.id);
        mvpBox.innerHTML = `
            <div>
                <span class="mvp-label">⭐ MVP de la jornada</span>
                <span class="mvp-name">${round.mvp.name}</span>
            </div>
            ${realPoints !== null ? `<span class="mvp-pts">${realPoints} pts</span>` : ''}
        `;
        mvpBox.classList.remove('hidden');
    } else {
        mvpBox.classList.add('hidden');
        mvpBox.innerHTML = '';
    }

    // Once ideal de la jornada
    const lineupBox = document.getElementById('ideal-lineup');
    if (round.idealLineup && round.idealLineup.players && round.idealLineup.players.length) {
        lineupBox.innerHTML = buildIdealLineupHTML(round.idealLineup);
    } else {
        lineupBox.innerHTML = '';
    }
}

// Busca los puntos reales de un jugador (por id) entre los partidos de la jornada
function findPlayerPointsInRound(round, playerId) {
    for (const g of round.games) {
        for (const side of [g.home, g.away]) {
            if (!side.reports) continue;
            const rep = side.reports.find(r => r.player.id === playerId);
            if (rep) return rep.points;
        }
    }
    return null;
}

// Construye el HTML del once ideal a partir del "type" (ej. "3-4-3")
function buildIdealLineupHTML(lineup) {
    const formation = (lineup.type || '')
        .split('-')
        .map(n => parseInt(n, 10))
        .filter(n => !isNaN(n));

    const players = lineup.players || [];
    let idx = 0;
    const lines = [];

    // El primer jugador siempre es el portero
    if (players[idx]) {
        lines.push({ label: 'POR', names: [players[idx]] });
        idx++;
    }

    const labels = ['DEF', 'MED', 'DEL'];
    formation.forEach((count, i) => {
        const group = players.slice(idx, idx + count);
        idx += count;
        if (group.length) lines.push({ label: labels[i] || 'DEL', names: group });
    });

    let html = `<div class="lineup-header">📋 Once Ideal (${lineup.type || '—'}) · ${lineup.points ?? '—'} pts</div><div class="ideal-formation">`;
    lines.forEach(line => {
        html += `<div class="formation-row">`;
        line.names.forEach(p => {
            html += `
                <div class="formation-player">
                    <span class="fp-pos">${line.label}</span>
                    <span class="fp-name">${p.name}</span>
                </div>
            `;
        });
        html += `</div>`;
    });
    html += `</div>`;
    return html;
}

// ============================================================
// 3b. Puntuaciones de la liga privada (jornada concreta / general)
// ============================================================

// Suma puntosJornada, jugados y dinero de cada manager en todas las pX.json
// cuyo número sea <= uptoRoundNum. Devuelve { nombre: { puntos, jugados, dinero, codigo } }
function getAccumulatedPuntuaciones(uptoRoundNum) {
    const acc = {};
    puntuacionesRounds.forEach(r => {
        if (r.num > uptoRoundNum) return;
        r.jugadores.forEach(j => {
            if (!acc[j.nombre]) acc[j.nombre] = { puntos: 0, jugados: 0, dinero: 0, codigo: j.codigo };
            acc[j.nombre].puntos += j.puntosJornada || 0;
            acc[j.nombre].jugados += j.jugados || 0;
            acc[j.nombre].dinero += j.dinero || 0;
            if (j.codigo) acc[j.nombre].codigo = j.codigo;
        });
    });
    return acc;
}

// Convierte el acumulado en un array ordenado por puntos (mayor a menor)
function rankPuntuaciones(acc) {
    return Object.entries(acc)
        .map(([nombre, v]) => ({ nombre, puntos: v.puntos, jugados: v.jugados, dinero: v.dinero, codigo: v.codigo }))
        .sort((a, b) => b.puntos - a.puntos);
}

// Cabecera común de la tabla de Puntuaciones
function puntuacionesTheadHTML() {
    return '<tr><th>Pos</th><th class="pt-name">Jugador</th><th>Puntos</th><th>Jugados</th><th>Dinero</th></tr>';
}

// Tabla de Puntuaciones de la jornada seleccionada: ranking de ESA jornada
// (por puntos anotados esa semana, no el acumulado)
function renderPuntuacionesJornada() {
    const round = getCurrentRound();
    const roundNum = round.num;
    const pRound = puntuacionesRounds.find(r => r.num === roundNum);

    document.getElementById('puntuaciones-title').textContent =
        `📊 Puntuaciones · ${round.data.short || ('J' + roundNum)}`;

    if (!pRound) {
        document.getElementById('puntuaciones-thead').innerHTML = puntuacionesTheadHTML();
        document.getElementById('puntuaciones-body').innerHTML =
            `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">
                Todavía no has añadido <code>p${roundNum}.json</code> para esta jornada.
            </td></tr>`;
        return;
    }

    const ranked = [...pRound.jugadores]
        .map(j => ({
            nombre: j.nombre,
            codigo: j.codigo,
            puntos: j.puntosJornada || 0,
            jugados: j.jugados || 0,
            dinero: j.dinero || 0
        }))
        .sort((a, b) => b.puntos - a.puntos);

    // Flechas comparando con el ranking de esa MISMA jornada anterior (si existe)
    const pPrev = puntuacionesRounds.find(r => r.num === roundNum - 1);
    const prevPos = {};
    if (pPrev) {
        [...pPrev.jugadores]
            .sort((a, b) => (b.puntosJornada || 0) - (a.puntosJornada || 0))
            .forEach((j, i) => { prevPos[j.nombre] = i + 1; });
    }

    renderPuntuacionesTable(ranked, prevPos);
}

// Tabla de Puntuaciones con el acumulado total (todas las jornadas cargadas)
function renderPuntuacionesGeneral() {
    document.getElementById('puntuaciones-title').textContent = '🏆 Puntuaciones · Clasificación General';

    if (puntuacionesRounds.length === 0) {
        document.getElementById('puntuaciones-thead').innerHTML = puntuacionesTheadHTML();
        document.getElementById('puntuaciones-body').innerHTML =
            `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">
                Todavía no hay ningún <code>pX.json</code> cargado.
            </td></tr>`;
        toggleBoteBox(false);
        return;
    }

    const lastNum = puntuacionesRounds[puntuacionesRounds.length - 1].num;
    const prevNum = puntuacionesRounds.length > 1
        ? puntuacionesRounds[puntuacionesRounds.length - 2].num
        : lastNum - 1;

    const accNow = getAccumulatedPuntuaciones(lastNum);
    const accPrev = getAccumulatedPuntuaciones(prevNum);
    const prevPos = {};
    rankPuntuaciones(accPrev).forEach((r, i) => { prevPos[r.nombre] = i + 1; });

    const rankedNow = rankPuntuaciones(accNow);
    renderPuntuacionesTable(rankedNow, prevPos);

    // Bote total acumulado: la suma del dinero de todos los managers hasta la fecha
    const totalBote = rankedNow.reduce((sum, r) => sum + (r.dinero || 0), 0);
    toggleBoteBox(true, totalBote);
}

// Muestra u oculta la caja del Bote total (solo tiene sentido en la vista General)
function toggleBoteBox(show, total) {
    const box = document.getElementById('bote-box');
    if (!box) return;

    if (!show) {
        box.classList.add('hidden');
        return;
    }

    document.getElementById('bote-value').textContent = `${total || 0} €`;
    box.classList.remove('hidden');
}

// Icono circular con la foto del manager (avatars/<codigo>.jpg). Si la imagen
// no existe o falla al cargar, cae automáticamente en un círculo con su inicial.
function avatarHTML(codigo, nombre) {
    const initial = (nombre || '?').trim().charAt(0).toUpperCase();
    const src = `${AVATAR_PATH}${codigo || ''}${AVATAR_EXT}`;
    return `
        <span class="pt-avatar">
            <img src="${src}" alt="${nombre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <span class="pt-avatar-fallback">${initial}</span>
        </span>
    `;
}

// Pinta la tabla de Puntuaciones: Pos · Jugador (foto + nombre) · Puntos · Jugados · Dinero
function renderPuntuacionesTable(ranked, prevPos) {
    document.getElementById('puntuaciones-thead').innerHTML = puntuacionesTheadHTML();
    const tbody = document.getElementById('puntuaciones-body');

    if (ranked.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Sin datos.</td></tr>';
        return;
    }

    tbody.innerHTML = ranked.map((r, i) => {
        const pos = i + 1;
        const prev = prevPos[r.nombre];

        let arrow = '<span class="pt-arrow same">–</span>';
        if (prev !== undefined && prev !== pos) {
            arrow = prev > pos
                ? `<span class="pt-arrow up">▲${prev - pos}</span>`
                : `<span class="pt-arrow down">▼${pos - prev}</span>`;
        }

        const dineroLabel = r.dinero > 0 ? `${r.dinero} €` : '–';
        const dineroClass = r.dinero > 0 ? 'pt-dinero-owed' : '';

        return `
            <tr class="${pos === 1 ? 'pt-first' : ''}">
                <td class="pt-pos">
                    <span class="pt-pos-inner">
                        <span class="pt-pos-num">${pos}º</span>
                        ${arrow}
                    </span>
                </td>
                <td class="pt-name">
                    <span class="pt-name-inner">
                        ${avatarHTML(r.codigo, r.nombre)}
                        <span>${r.nombre}</span>
                    </span>
                </td>
                <td class="pt-badge pt-general pt-puntos">${r.puntos}</td>
                <td class="pt-badge pt-jugados">${r.jugados}</td>
                <td class="pt-badge pt-dinero-cell ${dineroClass}">${dineroLabel}</td>
            </tr>
        `;
    }).join('');
}

// ============================================================
// 4. Partidos de la jornada seleccionada
// ============================================================
function renderMatches(games) {
    const container = document.getElementById('games-container');
    container.innerHTML = '';

    games.forEach(game => {
        const dateObj = new Date(game.date * 1000);
        const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="game-header">
                <span>📅 ${dateStr}</span>
                <span>📍 ${game.location || 'Estadio Desconocido'}</span>
            </div>
            <div class="game-score-row">
                <div class="team home">${game.home.name}</div>
                <div class="score">${game.home.score} - ${game.away.score}</div>
                <div class="team away">${game.away.name}</div>
            </div>
            <div style="text-align: center; margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
                ${game.status === 'finished' ? '✅ Finalizado' : '⏳ Pendiente'}
            </div>
        `;

        card.addEventListener('click', () => openMatchDetails(game));
        container.appendChild(card);
    });
}

// ============================================================
// 5. Máximos goleadores / asistentes (acumulado de todas las jornadas cargadas)
// ============================================================
function renderTopStats() {
    const goalCount = {};
    const assistCount = {};
    const cardCount = {};

    rounds.forEach(r => {
        r.data.games.forEach(g => {
            [g.home, g.away].forEach(side => {
                if (!side.reports) return;
                side.reports.forEach(rep => {
                    if (!rep.events) return;
                    rep.events.forEach(ev => {
                        if (ev.type === 1 || ev.type === 2) {
                            goalCount[rep.player.name] = (goalCount[rep.player.name] || 0) + 1;
                        }
                        if (ev.type === 3) {
                            assistCount[rep.player.name] = (assistCount[rep.player.name] || 0) + 1;
                        }
                        if (ev.type === 6 || ev.type === 7 || ev.type === 16) {
                            cardCount[rep.player.name] = (cardCount[rep.player.name] || 0) + 1;
                        }
                    });
                });
            });
        });
    });

    renderTopList('top-scorers', goalCount, '⚽');
    renderTopList('top-assists', assistCount, '👟');
    renderTopList('top-cards', cardCount, '🟨');
}

function renderTopList(containerId, counts, icon) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Sin datos todavía.</p>';
        return;
    }

    container.innerHTML = sorted.map(([name, count], i) => `
        <div class="top-row">
            <span class="top-rank">${i + 1}</span>
            <span class="top-name">${name}</span>
            <span class="top-count">${icon} ${count}</span>
        </div>
    `).join('');
}

// ============================================================
// 6. Gestión del Modal (Ficha del Partido)
// ============================================================
function setupModal() {
    const modal = document.getElementById('match-modal');
    const closeBtn = document.getElementById('close-modal');
    const tabs = document.querySelectorAll('.tab-btn');

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.remove('hidden');
        });
    });
}

function openMatchDetails(game) {
    const modal = document.getElementById('match-modal');

    document.getElementById('modal-header').innerHTML = `
        <h2>${game.home.name} ${game.home.score} - ${game.away.score} ${game.away.name}</h2>
        <p>Estadio: ${game.location || 'Desconocido'}</p>
    `;

    renderStats(game);
    renderTimeline(game);
    renderLineups(game);

    document.querySelector('.tab-btn[data-target="tab-stats"]').click();
    modal.classList.remove('hidden');
}

// Estadísticas Colectivas
function renderStats(game) {
    const container = document.getElementById('tab-stats');
    const homeStats = game.home.stats || {};
    const awayStats = game.away.stats || {};

    const metrics = [
        { key: 'possession', label: 'Posesión (%)', type: 'pct' },
        { key: 'shots', label: 'Tiros Totales', type: 'num' },
        { key: 'goalShots', label: 'Tiros a Puerta', type: 'num' },
        { key: 'corners', label: 'Córners', type: 'num' },
        { key: 'passes', label: 'Pases Totales', type: 'num' },
        { key: 'passesAccuracy', label: 'Precisión de Pases (%)', type: 'pct' },
        { key: 'tackles', label: 'Entradas', type: 'num' },
        { key: 'aerialsWon', label: 'Duelos Aéreos Ganados', type: 'num' },
        { key: 'dribbles', label: 'Regates', type: 'num' },
        { key: 'offsides', label: 'Fueras de Juego', type: 'num' }
    ];

    let html = '';
    metrics.forEach(m => {
        const hVal = homeStats[m.key] || 0;
        const aVal = awayStats[m.key] || 0;
        const total = hVal + aVal;

        let hPct = 50;
        let aPct = 50;

        if (total > 0) {
            hPct = (hVal / total) * 100;
            aPct = (aVal / total) * 100;
        }

        html += `
            <div class="stat-row">
                <div class="stat-labels">
                    <span>${hVal}${m.type === 'pct' ? '%' : ''}</span>
                    <span class="stat-name">${m.label}</span>
                    <span>${aVal}${m.type === 'pct' ? '%' : ''}</span>
                </div>
                <div class="stat-bars">
                    <div class="stat-bar-home" style="width: ${hPct}%"></div>
                    <div class="stat-bar-away" style="width: ${aPct}%"></div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html || '<p style="text-align:center">No hay estadísticas disponibles.</p>';
}

// Línea Temporal
function renderTimeline(game) {
    const container = document.getElementById('tab-timeline');
    let events = [];

    const extractEvents = (teamData, isHome) => {
        if (!teamData.reports) return;
        teamData.reports.forEach(report => {
            if (report.events) {
                report.events.forEach(ev => {
                    events.push({
                        minute: ev.metadata,
                        player: report.player.name,
                        type: ev.type,
                        isHome: isHome
                    });
                });
            }
        });
    };

    extractEvents(game.home, true);
    extractEvents(game.away, false);

    events.sort((a, b) => a.minute - b.minute);

    if (events.length === 0) {
        container.innerHTML = '<p style="text-align:center">No hay eventos registrados en este partido.</p>';
        return;
    }

    let html = '<div class="timeline">';
    events.forEach(ev => {
        const eventInfo = EVENT_TYPES[ev.type] || { icon: '📌', label: 'Evento' };
        const alignClass = ev.isHome ? 'home' : 'away';

        html += `
            <div class="timeline-item ${alignClass}">
                <div class="timeline-icon">${eventInfo.icon}</div>
                <div class="timeline-content">
                    <span class="minute">${ev.minute}'</span>
                    <strong>${ev.player}</strong>
                    <p style="font-size:0.8rem; color:var(--text-muted)">${eventInfo.label}</p>
                </div>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

// Alineaciones y Puntos (incluye entrenador)
function renderLineups(game) {
    const container = document.getElementById('tab-lineups');

    const buildTeamLineup = (teamData, teamName) => {
        if (!teamData.reports) return `<div class="team-lineup"><h3>${teamName}</h3><p>Datos no disponibles</p></div>`;

        const players = [...teamData.reports].sort((a, b) => a.player.position - b.player.position);

        let html = `<div class="team-lineup"><h3>${teamName}</h3>`;
        players.forEach(report => {
            const p = report.player;
            const pts = report.points !== undefined ? report.points : '-';
            const ptsClass = typeof pts === 'number' && pts < 0 ? 'negative' : '';

            html += `
                <div class="player-row">
                    <div>
                        <span class="player-pos">${POSITIONS[p.position] || 'UNK'}</span>
                        <span>${p.name}</span>
                    </div>
                    <div class="player-points ${ptsClass}">${pts} pts</div>
                </div>
            `;
        });

        if (teamData.coach && teamData.coach.player) {
            const c = teamData.coach;
            const ptsClass = typeof c.points === 'number' && c.points < 0 ? 'negative' : '';
            html += `
                <div class="player-row coach-row">
                    <div>
                        <span class="player-pos">ENT</span>
                        <span>${c.player.name}</span>
                    </div>
                    <div class="player-points ${ptsClass}">${c.points} pts</div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    };

    container.innerHTML = `
        <div class="lineups-grid">
            ${buildTeamLineup(game.home, game.home.name)}
            ${buildTeamLineup(game.away, game.away.name)}
        </div>
    `;
}