let pieces = initPos.map(p => ({ ...p }));;
let moveHistory = [];
let dx, dy;
const standardNotation = {
    'king': 'K',
    'queen': 'Q',
    'rook': 'R',
    'bishop': 'B',
    'knight': 'N',
    'pawn': ''
};

let allGames = [];
let redoStack = [];
d3.csv("./data/processed.csv").then(data => {
    allGames = data.map(d => ({
        ...d,
        coords: d.coords.replace(/[\[\]\'\s]/g, '').split(",") 
    })); 
    updateVis();
    processOpenings(allGames)
});

const drag = d3.drag()
    .on("start", function(event, d) {
        const piece = d3.select(this);
        piece.raise();
        d.startX = d.gridX;
        d.startY = d.gridY;
        dx = +piece.attr("x") - event.x;
        dy = +piece.attr("y") - event.y;
        d3.select("#drag-tip").remove();
    })
    .on("drag", function(event, d) {
        d3.select(this)
            .attr("x", event.x + dx)
            .attr("y", event.y + dy);
    })
    .on("end", function(event, d) {
        const piece = d3.select(this);
        const movedX = Math.max(0, Math.min(size - 1, Math.round((event.x + dx) / boxSize)));
        const movedY = Math.max(0, Math.min(size - 1, Math.round((event.y + dy) / boxSize)));
        move(d, piece, movedX, movedY)
    });

    
function getMoves() {
    const minElo = +d3.select("#eloMin").property("value");
    const maxElo = +d3.select("#eloMax").property("value");
    const resultPref = d3.select("#resultFilter").node().value;
    const timeControl = d3.select("#incrementFilter").node().value;
    
    
    const filteredGames = allGames.filter(g => {
        const eloMatch = g.white_rating >= minElo && g.white_rating <= maxElo;
        const resultMatch = resultPref === "both" || g.winner === resultPref;
        const timeMatch = timeControl === "all" || g.increment_code === timeControl;
       
        const moveMatch = moveHistory.every((m, idx) => g.coords[idx] === (getNotation(m.fromX, m.fromY) + getNotation(m.toX, m.toY)));
        return moveMatch && timeMatch && resultMatch && eloMatch
    });
    const freqCounts = {};
    filteredGames.forEach(g => {
        const nextMove = g.coords[moveHistory.length];
        if (nextMove) {
            freqCounts[nextMove] = (freqCounts[nextMove] || 0) + 1;
        }
    });
    return Object.entries(freqCounts)
        .map(([move, count]) => ({ move, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

function move(d, piece, movedX, movedY) {
    const existingPiece = pieces.find(p => p.gridX === movedX && p.gridY === movedY);

    if ((existingPiece && existingPiece.color === d.color) || (movedX == d.startX && movedY == d.startY)) {
        piece.transition()
            .duration(100)
            .ease(d3.easeBackOut)
            .attr("x", d.gridX * boxSize)
            .attr("y", d.gridY * boxSize);
    } else {
        redoStack = []
        if (existingPiece) {
            pieces = pieces.filter(p => p.id !== existingPiece.id);
        }
        let isCastle = false;
        let rookMove = null;
        let castleType = null
        if (d.type === 'king' && Math.abs(movedX - d.startX) === 2) {
            const isKingside = (movedX > d.startX);
            const rookStartX = isKingside ? 7 : 0;
            const rookEndX = isKingside ? 5 : 3;
            const r = pieces.find(p => p.gridX === rookStartX && p.gridY === d.gridY && p.type === 'rook');
            if (!r || r.hasMoved || d.hasMoved) {
                piece.transition()
                    .duration(100)
                    .ease(d3.easeBackOut)
                    .attr("x", d.gridX * boxSize)
                    .attr("y", d.gridY * boxSize);
                return
            }
            isCastle = true;
            castleType = isKingside ? 'O-O' : 'O-O-O';
            r.gridX = rookEndX;
            r.startX = rookEndX;
            r.hasMoved = true
            

            rookMove = {
                data: r,
                fromX: rookStartX,
                toX: rookEndX
            };
            d3.select(`#piece-${r.id}`)
                .transition()
                .duration(200)
                .attr("x", r.gridX * boxSize);
        }
        
        moveHistory.push({
            piece: piece,
            type: d.type,
            id: d.id,
            fromX: d.startX,
            fromY: d.startY,
            toX: movedX,
            toY: movedY,
            captured: existingPiece,
            isCastle: isCastle,
            firstMove: !d.hasMoved,
            rookData: rookMove ? { id: rookMove.data.id, fromX: rookMove.fromX, toX: rookMove.toX } : null,
            castleType: castleType
        });
        d.hasMoved = true;
        d.gridX = movedX;
        d.gridY = movedY;
        d.startX = movedX;
        d.startY = movedY;
        d.pos = getNotation(movedX, movedY);
        piece.transition()
            .duration(100)
            .ease(d3.easeBackOut)
            .attr("x", d.gridX * boxSize)
            .attr("y", d.gridY * boxSize);
        updateVis();
    }
}

function updatePieces() {
    const pieceSelection = boardGroup.selectAll(".piece")
        .data(pieces, d => d.id);
    pieceSelection.join(
        enter => enter.append("image")
            .attr("class", "piece")
            .attr("id", d => `piece-${d.id}`)
            .attr("width", boxSize)
            .attr("height", boxSize)
            .attr("xlink:href", d => `./pieces/${d.img}`)
            .style("opacity", 0)
            .attr("x", d => d.gridX * boxSize)
            .attr("y", d => d.gridY * boxSize)
            .call(drag)
            .call(enter => enter.transition().duration(200).style("opacity", 1)),
        
        update => update.transition().duration(200)
            .attr("x", d => d.gridX * boxSize)
            .attr("y", d => d.gridY * boxSize),

        exit => exit.transition().duration(150)
            .style("opacity", 0)
            .remove()
    );
}

function updateArrows() {
    const movesArray = getMoves();
    const opacityScale = d3.scaleLinear()
    .domain([0, d3.max(movesArray, d => d.count)])
        .range([0.5, 1]);
    const strokeScale = d3.scaleLinear()
    .domain([0, d3.max(movesArray, d => d.count)])
    .range([2, 10]);
    const arrows = boardGroup.selectAll(".heatmap-arrow")
        .data(movesArray, d => d.move);
    arrows.join(
        enter => enter.append("line")
            .attr("class", "heatmap-arrow")
            .attr("x1", d => fromNotation(d.move.substring(0, 2), true).x)
            .attr("y1", d => fromNotation(d.move.substring(0, 2), true).y)
            .attr("x2", d => fromNotation(d.move.substring(2, 4), true).x)
            .attr("y2", d => fromNotation(d.move.substring(2, 4), true).y)
            .attr("stroke", "orange")
            .attr("stroke-width",  d => strokeScale(d.count))
            .attr("marker-end", "url(#arrowhead)")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .call(enter => enter.transition().duration(300)
                .style("opacity", d => opacityScale(d.count))
            ),
        
        update => update.transition().duration(300)
            .style("opacity", d => opacityScale(d.count)),

        exit => exit.transition().duration(200)
            .style("opacity", 0)
            .remove()
    );
}

function updateVis() {
    updatePieces();
    d3.select("#counter").text(`Move Count: ${moveHistory.length}`);
    const historyString = moveHistory.map((m, i) => {
        let moveStr = "";
        if (m.isCastle) {
            moveStr = m.castleType;
        } else {
            moveStr = `${standardNotation[m.pieceType] || ''}${getNotation(m.toX, m.toY)}`;
        }
        if (i % 2 === 0) {
            return `${Math.floor(i / 2) + 1}. ${moveStr}`;
        }
        return moveStr;
    }).join(" ");
    d3.select("#history-log").text(`Move History: ${historyString}`);
    updateArrows();
    
}

updateVis();


d3.select("#undoBtn").on("click", () => {
    if (moveHistory.length === 0) return;
    const m = moveHistory.pop();
    redoStack.push(m)
    const p = pieces.find(p => p.id === m.id);
    p.gridX = m.fromX;
    p.gridY = m.fromY;
    p.pos = getNotation(p.gridX, p.gridY);
    m.piece.transition()
        .duration(200)
        .attr("x", p.gridX * boxSize)
        .attr("y", p.gridY * boxSize);
    if (m.captured) {
        pieces.push(m.captured);
    }
    
    if (m.isCastle && m.rookData) {
        const rook = pieces.find(p => p.id === m.rookData.id);
        rook.gridX = m.rookData.fromX;
        rook.startX = m.rookData.fromX;
        if (m.firstMove) {
            p.hasMoved = false;
        }
        rook.hasMoved = false;
    }
    updateVis();
});

d3.select("#resetBtn").on("click", () => {
    resetVis()
});

function resetVis() {
    moveHistory = [];
    redoStack = [];
    pieces = initPos.map(p => ({ 
        ...p, 
        startX: p.gridX, 
        startY: p.gridY 
    }));
    updateVis();
}

d3.select("#redoBtn").on("click", () => {
    if (redoStack.length > 0) {
        const m = redoStack.pop();
        moveHistory.push(m);
        const d = pieces.find(p => p.id === m.id);
        d.gridX = m.toX;
        d.gridY = m.toY;
        d.startX = m.toX;
        d.startY = m.toY;
        d.pos = getNotation(m.toX, m.toY);
        m.piece.transition()
            .duration(200)
            .ease(d3.easeBackOut)
            .attr("x", m.toX * boxSize)
            .attr("y", m.toY * boxSize);
        updateVis();
    }
});

d3.select("#eloMin").on("change", () => {
    updateArrows();
})

d3.select("#eloMax").on("change", () => {
    updateArrows();
})

d3.select("#resultFilter").on("change", () => {
    updateArrows();
})

d3.select("#incrementFilter").on("change", () => {
    updateArrows();
})