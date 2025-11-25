const tile = 30;
const boardSize = 10;

// Canvas
let playerCanvas, enemyCanvas, pctx, ectx;
let boardsSection = document.getElementById("boardsSection");

// Boards
let playerBoard;
let enemyBoard;

// Game State
let difficulty = "easy";
let shipsToPlace = 5;
let gameStarted = false;
let playerTurn = false;

// AI memory
let lastHit = null;
let hitQueue = [];

// Start button
document.getElementById("startBtn").onclick = startGame;
document.getElementById("restartBtn").onclick = restartGame;


// ========== START GAME ==========
function startGame() {
  difficulty = document.getElementById("difficultySelect").value;

  document.getElementById("restartBtn").style.display = "inline-block";
  boardsSection.style.display = "flex";

  initializeBoards();
  setupEvents();

  document.getElementById("status").innerText = "Place your 5 ships...";
}

// ========== RESTART GAME ==========
function restartGame() {
  // Reset EVERYTHING
  difficulty = document.getElementById("difficultySelect").value;
  shipsToPlace = 5;
  gameStarted = false;
  playerTurn = false;

  lastHit = null;
  hitQueue = [];

  initializeBoards();
  document.getElementById("status").innerText = "Place your 5 ships again...";
}


// ========== INITIALIZE (USED IN START + RESTART) ==========
function initializeBoards() {
  // Reset boards
  playerBoard = createEmptyBoard();
  enemyBoard = createEmptyBoard();

  // Get canvas + contexts
  playerCanvas = document.getElementById("playerBoard");
  enemyCanvas = document.getElementById("enemyBoard");
  pctx = playerCanvas.getContext("2d");
  ectx = enemyCanvas.getContext("2d");

  drawBoard(pctx, playerBoard);
  drawBoard(ectx, enemyBoard);

  placeEnemyShips();
}


// ========== CREATE EMPTY BOARD ==========
function createEmptyBoard() {
  let b = [];
  for (let i = 0; i < boardSize; i++) {
    b[i] = new Array(boardSize).fill(0);
  }
  return b;
}


// ========== DRAW BOARD ==========
function drawBoard(ctx, board) {
  ctx.clearRect(0, 0, 300, 300);

  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {

      ctx.strokeStyle = "#00ffff";
      ctx.strokeRect(x * tile, y * tile, tile, tile);

      if (ctx === pctx && board[x][y] === 1) {
        ctx.fillStyle = "lime";
        ctx.fillRect(x * tile, y * tile, tile, tile);
      }

      if (board[x][y] === 2) {
        ctx.fillStyle = "red";
        ctx.fillRect(x * tile, y * tile, tile, tile);
      }

      if (board[x][y] === 3) {
        ctx.fillStyle = "white";
        ctx.fillRect(x * tile, y * tile, tile, tile);
      }
    }
  }
}


// ========== EVENTS ==========
function setupEvents() {

  // Remove old event listeners
  playerCanvas.replaceWith(playerCanvas.cloneNode(true));
  enemyCanvas.replaceWith(enemyCanvas.cloneNode(true));

  playerCanvas = document.getElementById("playerBoard");
  enemyCanvas = document.getElementById("enemyBoard");

  pctx = playerCanvas.getContext("2d");
  ectx = enemyCanvas.getContext("2d");

  // Ship placement
  playerCanvas.addEventListener("click", (e) => {
    if (gameStarted) return;

    const rect = playerCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / tile);
    const y = Math.floor((e.clientY - rect.top) / tile);

    if (playerBoard[x][y] === 0 && shipsToPlace > 0) {
      playerBoard[x][y] = 1;
      shipsToPlace--;
      drawBoard(pctx, playerBoard);

      if (shipsToPlace === 0) {
        document.getElementById("status").innerText = "Game Started — Fire cannons!";
        gameStarted = true;
        playerTurn = true;
      } else {
        document.getElementById("status").innerText = `Place ships: ${shipsToPlace} left`;
      }
    }
  });

  // Player fires cannon
  enemyCanvas.addEventListener("click", (e) => {
    if (!gameStarted || !playerTurn) return;

    const rect = enemyCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / tile);
    const y = Math.floor((e.clientY - rect.top) / tile);

    if (enemyBoard[x][y] === 2 || enemyBoard[x][y] === 3) return;

    if (enemyBoard[x][y] === 1) {
      enemyBoard[x][y] = 2;
      document.getElementById("status").innerText = "🎯 HIT!";
    } else {
      enemyBoard[x][y] = 3;
      document.getElementById("status").innerText = "💨 Miss...";
    }

    drawBoard(ectx, enemyBoard);

    if (checkWin(enemyBoard)) {
      document.getElementById("status").innerText = "🔥 YOU WIN!";
      return;
    }

    playerTurn = false;
    setTimeout(enemyFire, 800);
  });
}


// ========== ENEMY SHIP PLACEMENT ==========
function placeEnemyShips() {
  let count = 5;
  while (count > 0) {
    let x = Math.floor(Math.random() * 10);
    let y = Math.floor(Math.random() * 10);
    if (enemyBoard[x][y] === 0) {
      enemyBoard[x][y] = 1;
      count--;
    }
  }
}


// ========== CHECK WIN ==========
function checkWin(board) {
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      if (board[x][y] === 1) return false;
    }
  }
  return true;
}


// ========== AI FIRING (uses difficulty levels) ==========
function enemyFire() {

  let { x, y } = pickTarget();

  // Fire shot
  if (playerBoard[x][y] === 1) {
    playerBoard[x][y] = 2;
    document.getElementById("status").innerText = "💥 Enemy HIT!";
    lastHit = { x, y };
  } else {
    playerBoard[x][y] = 3;
    document.getElementById("status").innerText = "Enemy Missed";
  }

  drawBoard(pctx, playerBoard);

  if (checkWin(playerBoard)) {
    document.getElementById("status").innerText = "💀 YOU LOSE!";
    return;
  }

  playerTurn = true;
  document.getElementById("status").innerText = "Your turn — fire!";
}


// ========== EASY AI = RANDOM ==========
function randomTarget() {
  let x, y;
  do {
    x = Math.floor(Math.random() * 10);
    y = Math.floor(Math.random() * 10);
  } while (playerBoard[x][y] === 2 || playerBoard[x][y] === 3);
  return { x, y };
}


// ========== MEDIUM AI = SHOOT NEAR HIT ==========
function mediumAI() {
  if (lastHit) {
    const dirs = [
      {x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}
    ];

    for (let d of dirs) {
      let xx = lastHit.x + d.x;
      let yy = lastHit.y + d.y;
      if (xx>=0 && xx<10 && yy>=0 && yy<10 &&
        playerBoard[xx][yy] !== 2 && playerBoard[xx][yy] !== 3) {
        return { x: xx, y: yy };
      }
    }
  }
  return randomTarget();
}


// ========== HARD AI = HUNT MODE ==========
function hardAI() {
  // follow queued shots
  if (hitQueue.length > 0) return hitQueue.shift();

  // search deeply around last hit
  if (lastHit) {
    const dirs = [
      {x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}
    ];

    dirs.forEach(d => {
      let xx = lastHit.x + d.x;
      let yy = lastHit.y + d.y;
      if (xx>=0 && xx<10 && yy>=0 && yy<10 &&
        playerBoard[xx][yy] === 1) {
        hitQueue.push({ x: xx, y: yy });
      }
    });

    if (hitQueue.length > 0) return hitQueue.shift();
  }

  return randomTarget();
}


// ========== SELECT TARGET BASED ON DIFFICULTY ==========
function pickTarget() {
  if (difficulty === "easy") return randomTarget();
  if (difficulty === "medium") return mediumAI();
  return hardAI();
}
