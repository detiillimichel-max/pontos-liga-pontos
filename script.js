// ============================================================
// LIGA PONTOS SEM BLOQUEIO - versão para crianças
// Ao conectar um par, verifica se todas as outras cores
// ainda conseguem ser conectadas. Se não, a conexão é bloqueada.
// ============================================================

const ROWS = 6;
const COLS = 6;
const COLORS = ["red", "green", "blue", "orange", "purple"];
const COLOR_NAMES = { red:"Vermelho", green:"Verde", blue:"Azul", orange:"Laranja", purple:"Roxo" };

// 5 fases (apenas posições dos pontos mudam)
const LEVELS = [
    { endpoints: [
        { color:"red", startRow:0, startCol:0, endRow:5, endCol:5 },
        { color:"green", startRow:0, startCol:2, endRow:5, endCol:3 },
        { color:"blue", startRow:0, startCol:4, endRow:5, endCol:1 },
        { color:"orange", startRow:2, startCol:0, endRow:4, endCol:5 },
        { color:"purple", startRow:3, startCol:0, endRow:2, endCol:5 }
    ]},
    { endpoints: [
        { color:"red", startRow:0, startCol:1, endRow:4, endCol:5 },
        { color:"green", startRow:0, startCol:3, endRow:5, endCol:0 },
        { color:"blue", startRow:1, startCol:0, endRow:3, endCol:5 },
        { color:"orange", startRow:2, startCol:2, endRow:5, endCol:4 },
        { color:"purple", startRow:0, startCol:5, endRow:5, endCol:2 }
    ]},
    { endpoints: [
        { color:"red", startRow:0, startCol:5, endRow:5, endCol:0 },
        { color:"green", startRow:0, startCol:0, endRow:3, endCol:3 },
        { color:"blue", startRow:1, startCol:5, endRow:4, endCol:0 },
        { color:"orange", startRow:2, startCol:0, endRow:5, endCol:3 },
        { color:"purple", startRow:3, startCol:5, endRow:5, endCol:5 }
    ]},
    { endpoints: [
        { color:"red", startRow:1, startCol:1, endRow:4, endCol:4 },
        { color:"green", startRow:0, startCol:2, endRow:5, endCol:5 },
        { color:"blue", startRow:0, startCol:3, endRow:3, endCol:0 },
        { color:"orange", startRow:2, startCol:5, endRow:5, endCol:1 },
        { color:"purple", startRow:4, startCol:0, endRow:1, endCol:5 }
    ]},
    { endpoints: [
        { color:"red", startRow:0, startCol:4, endRow:4, endCol:1 },
        { color:"green", startRow:0, startCol:1, endRow:5, endCol:4 },
        { color:"blue", startRow:2, startCol:1, endRow:3, endCol:5 },
        { color:"orange", startRow:5, startCol:0, endRow:1, endCol:2 },
        { color:"purple", startRow:3, startCol:3, endRow:5, endCol:5 }
    ]}
];
const TOTAL_LEVELS = LEVELS.length;

let currentLevelIdx = 0;
let grid = [];               // { pathColor, isEndpoint, endpointColor }
let selectedPos = null;
let msgTimeout = null;

const gridContainer = document.getElementById("gridContainer");
const levelNumSpan = document.getElementById("levelNum");
const flowsDoneSpan = document.getElementById("flowsDone");
const coverageSpan = document.getElementById("coverage");
const messageBox = document.getElementById("messageBox");

// ========== AUXILIARES ==========
function showMessage(msg, isError = false, duration = 2000) {
    if (msgTimeout) clearTimeout(msgTimeout);
    messageBox.innerHTML = msg;
    messageBox.style.background = isError ? "#ffc9b4" : "#ffe2a4";
    messageBox.style.color = isError ? "#b13e0d" : "#aa6d2b";
    msgTimeout = setTimeout(() => updateMessageToDefault(), duration);
}

function updateMessageToDefault() {
    const flows = countCompletedFlows();
    if (flows === COLORS.length) {
        if (currentLevelIdx + 1 === TOTAL_LEVELS)
            messageBox.innerHTML = "🏆 CAMPEÃO! Você zerou todas as fases! 🏆";
        else
            messageBox.innerHTML = "🎉 PARABÉNS! Fase completa! Clique em PRÓXIMA FASE 🎉";
        messageBox.style.background = "#ffe88c";
    } else {
        messageBox.innerHTML = "🌈 Toque num pontinho ★ e depois no outro da mesma cor! O jogo só permite se não atrapalhar as outras cores.";
        messageBox.style.background = "#ffe2a4";
        messageBox.style.color = "#aa6d2b";
    }
}

function initGridFromLevel() {
    const newGrid = Array(ROWS).fill().map(() => Array(COLS).fill().map(() => ({
        pathColor: null,
        isEndpoint: false,
        endpointColor: null
    })));
    const levelData = LEVELS[currentLevelIdx];
    for (let ep of levelData.endpoints) {
        newGrid[ep.startRow][ep.startCol].isEndpoint = true;
        newGrid[ep.startRow][ep.startCol].endpointColor = ep.color;
        newGrid[ep.startRow][ep.startCol].pathColor = ep.color;
        newGrid[ep.endRow][ep.endCol].isEndpoint = true;
        newGrid[ep.endRow][ep.endCol].endpointColor = ep.color;
        newGrid[ep.endRow][ep.endCol].pathColor = ep.color;
    }
    return newGrid;
}

function resetFullLevel() {
    grid = initGridFromLevel();
    selectedPos = null;
    renderGrid();
    updateStatsAndWin();
    showMessage(`✨ Fase ${currentLevelIdx+1} reiniciada! Clique nos pares de pontinhos.`, false, 1800);
}

// Conta quantas cores já estão conectadas (caminho contínuo)
function countCompletedFlows() {
    let completed = 0;
    for (let color of COLORS) {
        let endpoints = [];
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                if (grid[r][c].isEndpoint && grid[r][c].endpointColor === color)
                    endpoints.push([r, c]);
        if (endpoints.length !== 2) continue;
        const [start, end] = endpoints;
        const visited = Array(ROWS).fill().map(() => Array(COLS).fill(false));
        const queue = [start];
        visited[start[0]][start[1]] = true;
        let found = false;
        while (queue.length) {
            const [r, c] = queue.shift();
            if (r === end[0] && c === end[1]) { found = true; break; }
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
                const nr = r+dr, nc = c+dc;
                if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !visited[nr][nc] && grid[nr][nc].pathColor === color) {
                    visited[nr][nc] = true;
                    queue.push([nr, nc]);
                }
            });
        }
        if (found) completed++;
    }
    return completed;
}

function calcCoverage() {
    let filled = 0;
    for (let r=0; r<ROWS; r++)
        for (let c=0; c<COLS; c++)
            if (grid[r][c].pathColor !== null) filled++;
    return Math.floor((filled / (ROWS*COLS)) * 100);
}

function updateStatsAndWin() {
    flowsDoneSpan.innerText = countCompletedFlows();
    coverageSpan.innerText = calcCoverage();
    if (countCompletedFlows() === COLORS.length) {
        if (currentLevelIdx+1 === TOTAL_LEVELS)
            showMessage("🏆 UAU! Você completou todas as fases! 🏆", false, 3000);
        else
            showMessage("🎉 Fase completa! Clique em PRÓXIMA FASE 🎉", false, 2500);
    } else {
        updateMessageToDefault();
    }
}

// ========== VERIFICAÇÃO GLOBAL DE VIABILIDADE ==========
// Verifica se, em um determinado grid, todas as cores ainda têm um caminho possível
// (usando BFS apenas por células vazias ou já da própria cor)
function allColorsHavePath(gridState) {
    for (let color of COLORS) {
        // encontra endpoints desta cor
        let endpoints = [];
        for (let r=0; r<ROWS; r++)
            for (let c=0; c<COLS; c++)
                if (gridState[r][c].isEndpoint && gridState[r][c].endpointColor === color)
                    endpoints.push([r, c]);
        if (endpoints.length !== 2) continue;
        const [start, end] = endpoints;
        // BFS que pode passar por células vazias (pathColor === null) ou da própria cor (pathColor === color)
        // mas NÃO pode passar por células de outras cores (pathColor !== null && pathColor !== color)
        const visited = Array(ROWS).fill().map(() => Array(COLS).fill(false));
        const queue = [start];
        visited[start[0]][start[1]] = true;
        let found = false;
        while (queue.length) {
            const [r, c] = queue.shift();
            if (r === end[0] && c === end[1]) { found = true; break; }
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
                const nr = r+dr, nc = c+dc;
                if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !visited[nr][nc]) {
                    const cell = gridState[nr][nc];
                    if (cell.isEndpoint && !(nr === end[0] && nc === end[1])) return; // não pode atravessar outros pontos
                    if (cell.pathColor === null || cell.pathColor === color) {
                        visited[nr][nc] = true;
                        queue.push([nr, nc]);
                    }
                }
            });
        }
        if (!found) return false;
    }
    return true;
}

// Encontra um caminho entre start e end usando BFS (apenas por células vazias ou da cor)
// e retorna o caminho como lista de coordenadas {r,c}
function findPath(gridState, startRow, startCol, endRow, endCol, color) {
    const parent = Array(ROWS).fill().map(() => Array(COLS).fill(null));
    const visited = Array(ROWS).fill().map(() => Array(COLS).fill(false));
    const queue = [{r: startRow, c: startCol}];
    visited[startRow][startCol] = true;
    let found = false;
    while (queue.length && !found) {
        const {r, c} = queue.shift();
        if (r === endRow && c === endCol) { found = true; break; }
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
            const nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !visited[nr][nc]) {
                const cell = gridState[nr][nc];
                const isTarget = (nr === endRow && nc === endCol);
                if (isTarget) {
                    visited[nr][nc] = true;
                    parent[nr][nc] = {r, c};
                    queue.push({r: nr, c: nc});
                }
                else if (cell.isEndpoint) return; // não pode atravessar outros pontos fixos
                else if (cell.pathColor === null || cell.pathColor === color) {
                    visited[nr][nc] = true;
                    parent[nr][nc] = {r, c};
                    queue.push({r: nr, c: nc});
                }
            }
        });
    }
    if (!found) return null;
    // reconstrói caminho do fim ao início
    const path = [];
    let cur = {r: endRow, c: endCol};
    while (!(cur.r === startRow && cur.c === startCol)) {
        path.push(cur);
        const p = parent[cur.r][cur.c];
        if (!p) break;
        cur = p;
    }
    path.push({r: startRow, c: startCol});
    return path;
}

// Tenta conectar dois pontos. Antes, simula e verifica se todas as outras cores ainda terão caminho.
function tryConnect(startRow, startCol, endRow, endCol, color) {
    // Primeiro, encontra um caminho no grid atual (sem ainda modificar)
    const path = findPath(grid, startRow, startCol, endRow, endCol, color);
    if (!path) {
        showMessage(`❌ Não há caminho livre para conectar os ${COLOR_NAMES[color]} agora.`, true, 2000);
        return false;
    }
    // Faz uma cópia profunda do grid e aplica o caminho
    const testGrid = JSON.parse(JSON.stringify(grid));
    for (let node of path) {
        if (!testGrid[node.r][node.c].isEndpoint) {
            testGrid[node.r][node.c].pathColor = color;
        }
    }
    // Verifica se todas as outras cores ainda têm possibilidade de conexão
    if (allColorsHavePath(testGrid)) {
        // Aplicar a mudança no grid real
        for (let node of path) {
            if (!grid[node.r][node.c].isEndpoint) {
                grid[node.r][node.c].pathColor = color;
            }
        }
        return true;
    } else {
        showMessage(`⚠️ Essa conexão iria bloquear outra cor! Tente conectar uma cor diferente primeiro.`, true, 2500);
        return false;
    }
}

// ========== CLIQUE NOS PONTOS ==========
function onCellClick(row, col) {
    const cell = grid[row][col];
    if (!cell.isEndpoint) {
        if (selectedPos !== null)
            showMessage(`⭐ Toque no segundo pontinho da cor ${COLOR_NAMES[selectedPos.color]}`, true, 1000);
        else
            showMessage("🌈 Toque primeiro num pontinho com estrela ★", false, 1000);
        return;
    }
    const color = cell.endpointColor;
    if (selectedPos === null) {
        selectedPos = { row, col, color };
        renderGrid();
        showMessage(`✨ Agora toque no OUTRO pontinho ${COLOR_NAMES[color]} para conectar!`, false, 1500);
        return;
    }
    const first = selectedPos;
    selectedPos = null;
    if (first.row === row && first.col === col) {
        renderGrid();
        showMessage("Clique em dois pontinhos DIFERENTES da mesma cor :)", true, 1200);
        return;
    }
    if (first.color !== color) {
        renderGrid();
        showMessage(`Cores diferentes! Conecte ${COLOR_NAMES[first.color]} com ${COLOR_NAMES[first.color]} apenas.`, true, 1500);
        return;
    }
    // Tenta conectar com verificação de bloqueio
    const success = tryConnect(first.row, first.col, row, col, color);
    renderGrid();
    if (success) {
        updateStatsAndWin();
        if (countCompletedFlows() === COLORS.length) {
            showMessage(`🎉 Parabéns! Fase ${currentLevelIdx+1} completa! 🎉`, false, 2500);
        } else {
            showMessage(`✅ Conexão ${COLOR_NAMES[color]} criada sem bloquear ninguém!`, false, 1500);
        }
    } else {
        // mensagem de erro já exibida
        renderGrid();
    }
}

function renderGrid() {
    gridContainer.innerHTML = "";
    for (let i=0; i<ROWS; i++) {
        for (let j=0; j<COLS; j++) {
            const cell = grid[i][j];
            const div = document.createElement("div");
            div.className = "cell";
            if (cell.isEndpoint) div.classList.add("endpoint");
            if (selectedPos && selectedPos.row === i && selectedPos.col === j)
                div.classList.add("selected");
            div.setAttribute("data-color", cell.pathColor || "");
            div.addEventListener("click", (() => onCellClick(i, j)));
            gridContainer.appendChild(div);
        }
    }
}

function changeLevel(delta) {
    let newIdx = currentLevelIdx + delta;
    if (newIdx < 0) newIdx = TOTAL_LEVELS - 1;
    if (newIdx >= TOTAL_LEVELS) newIdx = 0;
    currentLevelIdx = newIdx;
    grid = initGridFromLevel();
    selectedPos = null;
    levelNumSpan.innerText = currentLevelIdx+1;
    renderGrid();
    updateStatsAndWin();
    showMessage(`📀 FASE ${currentLevelIdx+1}! Conecte os pares sem bloquear as outras cores.`, false, 1800);
}

function bindEvents() {
    document.getElementById("prevBtn").addEventListener("click", () => changeLevel(-1));
    document.getElementById("nextBtn").addEventListener("click", () => changeLevel(1));
    document.getElementById("resetBtn").addEventListener("click", () => resetFullLevel());
}

function startGame() {
    currentLevelIdx = 0;
    grid = initGridFromLevel();
    selectedPos = null;
    levelNumSpan.innerText = "1";
    renderGrid();
    updateStatsAndWin();
    bindEvents();
}

startGame();
