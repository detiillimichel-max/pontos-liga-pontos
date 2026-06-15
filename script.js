const ROWS = 6;
const COLS = 6;
const COLORS = ["red", "green", "blue", "orange", "purple"];
const COLOR_NAMES = { red:"Vermelho", green:"Verde", blue:"Azul", orange:"Laranja", purple:"Roxo" };

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
let grid = [];
let selectedColor = "red";
let msgTimeout = null;

const gridContainer = document.getElementById("gridContainer");
const levelNumSpan = document.getElementById("levelNum");
const flowsDoneSpan = document.getElementById("flowsDone");
const coverageSpan = document.getElementById("coverage");
const messageBox = document.getElementById("messageBox");
const colorPaletteDiv = document.getElementById("colorPalette");

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
            messageBox.innerHTML = "🏆 CAMPEÃO! Todas as fases completas! 🏆";
        else
            messageBox.innerHTML = "🎉 PARABÉNS! Fase completa! Clique em PRÓXIMA FASE 🎉";
        messageBox.style.background = "#ffe88c";
    } else {
        messageBox.innerHTML = "🌈 Escolha uma cor, depois pinte uma célula vizinha ao caminho da mesma cor!";
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
        const { color, startRow, startCol, endRow, endCol } = ep;
        newGrid[startRow][startCol].isEndpoint = true;
        newGrid[startRow][startCol].endpointColor = color;
        newGrid[startRow][startCol].pathColor = color;
        newGrid[endRow][endCol].isEndpoint = true;
        newGrid[endRow][endCol].endpointColor = color;
        newGrid[endRow][endCol].pathColor = color;
    }
    return newGrid;
}

function resetFullLevel() {
    grid = initGridFromLevel();
    renderGrid();
    updateStatsAndWin();
    showMessage(`✨ Fase ${currentLevelIdx+1} reiniciada! Construa os caminhos passo a passo.`, false, 1800);
}

function countCompletedFlows() {
    let completed = 0;
    for (let color of COLORS) {
        let endpoints = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c].isEndpoint && grid[r][c].endpointColor === color) {
                    endpoints.push([r, c]);
                }
            }
        }
        if (endpoints.length !== 2) continue;
        const [start, end] = endpoints;
        const visited = Array(ROWS).fill().map(() => Array(COLS).fill(false));
        const queue = [start];
        visited[start[0]][start[1]] = true;
        let found = false;
        while (queue.length) {
            const [r, c] = queue.shift();
            if (r === end[0] && c === end[1]) { found = true; break; }
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            for (let [dr, dc] of dirs) {
                const nr = r+dr, nc = c+dc;
                if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !visited[nr][nc] && grid[nr][nc].pathColor === color) {
                    visited[nr][nc] = true;
                    queue.push([nr, nc]);
                }
            }
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
    const flows = countCompletedFlows();
    const coverage = calcCoverage();
    flowsDoneSpan.innerText = flows;
    coverageSpan.innerText = coverage;
    if (flows === COLORS.length) {
        if (currentLevelIdx+1 === TOTAL_LEVELS)
            showMessage("🏆 UAU! Você completou todas as fases! 🏆", false, 3000);
        else
            showMessage("🎉 Fase completa! Clique em PRÓXIMA FASE para novo desafio 🎉", false, 2500);
    } else {
        updateMessageToDefault();
    }
}

function canPaint(row, col, color) {
    const cell = grid[row][col];
    if (cell.isEndpoint) return false;
    if (cell.pathColor !== null && cell.pathColor !== color) return false;
    if (cell.pathColor === color) return false;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (let [dr, dc] of dirs) {
        const nr = row+dr, nc = col+dc;
        if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS) {
            if (grid[nr][nc].pathColor === color) return true;
        }
    }
    return false;
}

function tryPaint(row, col) {
    const cell = grid[row][col];
    if (cell.isEndpoint) {
        showMessage(`🌟 Este é um ponto fixo (★)! Não pode pintar por cima.`, true, 1200);
        return false;
    }
    if (cell.pathColor !== null && cell.pathColor !== selectedColor) {
        showMessage(`❌ Caminho da cor ${COLOR_NAMES[cell.pathColor]} já existe aqui. Não pode cruzar!`, true, 1300);
        return false;
    }
    if (cell.pathColor === selectedColor) {
        showMessage(`✔️ Esta célula já está pintada de ${COLOR_NAMES[selectedColor]}.`, false, 800);
        return false;
    }
    if (!canPaint(row, col, selectedColor)) {
        showMessage(`⚠️ Você só pode pintar ao lado de um caminho da cor ${COLOR_NAMES[selectedColor]}!`, true, 1500);
        return false;
    }
    cell.pathColor = selectedColor;
    renderGrid();
    updateStatsAndWin();
    const endpointsForColor = [];
    for (let r=0; r<ROWS; r++)
        for (let c=0; c<COLS; c++)
            if (grid[r][c].isEndpoint && grid[r][c].endpointColor === selectedColor)
                endpointsForColor.push([r,c]);
    if (endpointsForColor.length === 2) {
        const [start, end] = endpointsForColor;
        if (isConnected(start[0], start[1], end[0], end[1], selectedColor)) {
            showMessage(`✅ Ótimo! Você conectou os pontos ${COLOR_NAMES[selectedColor]}!`, false, 1500);
        } else {
            showMessage(`👍 Continue pintando para ligar os dois ${COLOR_NAMES[selectedColor]}!`, false, 1200);
        }
    } else {
        showMessage(`➕ Caminho de ${COLOR_NAMES[selectedColor]} aumentou!`, false, 800);
    }
    return true;
}

function isConnected(r1,c1, r2,c2, color) {
    const visited = Array(ROWS).fill().map(() => Array(COLS).fill(false));
    const queue = [[r1,c1]];
    visited[r1][c1] = true;
    while(queue.length) {
        const [r,c] = queue.shift();
        if (r===r2 && c===c2) return true;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for(let [dr,dc] of dirs) {
            const nr=r+dr, nc=c+dc;
            if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !visited[nr][nc] && grid[nr][nc].pathColor === color) {
                visited[nr][nc] = true;
                queue.push([nr,nc]);
            }
        }
    }
    return false;
}

function clearAllPaths() {
    for (let r=0; r<ROWS; r++) {
        for (let c=0; c<COLS; c++) {
            if (!grid[r][c].isEndpoint) {
                grid[r][c].pathColor = null;
            } else {
                grid[r][c].pathColor = grid[r][c].endpointColor;
            }
        }
    }
    renderGrid();
    updateStatsAndWin();
    showMessage("🧽 Todos os traços foram apagados! Agora construa os caminhos de novo.", false, 1600);
}

function changeLevel(delta) {
    let newIdx = currentLevelIdx + delta;
    if (newIdx < 0) newIdx = TOTAL_LEVELS - 1;
    if (newIdx >= TOTAL_LEVELS) newIdx = 0;
    currentLevelIdx = newIdx;
    grid = initGridFromLevel();
    levelNumSpan.innerText = currentLevelIdx+1;
    renderGrid();
    updateStatsAndWin();
    showMessage(`📀 FASE ${currentLevelIdx+1}! Construa os caminhos sem cruzar as cores.`, false, 1800);
}

function renderGrid() {
    gridContainer.innerHTML = "";
    for (let i=0; i<ROWS; i++) {
        for (let j=0; j<COLS; j++) {
            const cell = grid[i][j];
            const colorVal = cell.pathColor || "";
            const div = document.createElement("div");
            div.className = "cell";
            if (cell.isEndpoint) div.classList.add("endpoint");
            div.setAttribute("data-color", colorVal);
            div.addEventListener("click", (function(r,c){
                return function() { tryPaint(r,c); };
            })(i,j));
            gridContainer.appendChild(div);
        }
    }
}

function createPalette() {
    colorPaletteDiv.innerHTML = "";
    COLORS.forEach(color => {
        const btn = document.createElement("div");
        btn.className = `color-btn ${color}`;
        if (selectedColor === color) btn.classList.add("active");
        btn.addEventListener("click", () => {
            selectedColor = color;
            document.querySelectorAll(".color-btn").forEach(cb => cb.classList.remove("active"));
            btn.classList.add("active");
            showMessage(`🖌️ Cor selecionada: ${COLOR_NAMES[color]}`, false, 800);
        });
        colorPaletteDiv.appendChild(btn);
    });
}

function bindEvents() {
    document.getElementById("prevBtn").addEventListener("click", () => changeLevel(-1));
    document.getElementById("nextBtn").addEventListener("click", () => changeLevel(1));
    document.getElementById("resetBtn").addEventListener("click", () => resetFullLevel());
    document.getElementById("clearPathsBtn").addEventListener("click", () => clearAllPaths());
}

function startGame() {
    currentLevelIdx = 0;
    grid = initGridFromLevel();
    selectedColor = "red";
    levelNumSpan.innerText = "1";
    createPalette();
    renderGrid();
    updateStatsAndWin();
    bindEvents();
}

startGame();
