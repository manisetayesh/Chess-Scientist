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

let allGames = []; // Loaded once from CSV

// Load the data
d3.csv("./data/processed.csv").then(data => {
    allGames = data.map(d => ({
        ...d,
        moves: d.coords.replace(/[\[\]\'\s]/g, '').split(",") 
    })); 
    updateVis();
});

function getMoves() {
    const minElo = +d3.select("#eloMin").property("value");
    const maxElo = +d3.select("#eloMax").property("value");
    const resultPref = d3.select("#resultFilter").node().value;
    const timeControl = d3.select("#incrementFilter").node().value;
    const filteredGames = allGames.filter(g => {
        const eloMatch = g.white_elo >= minElo && g.white_elo <= maxElo;
        const resultMatch = resultPref === "both" || g.winner === resultPref;
        const timeMatch = timeControl === "all" || g.increment_code === timeControl;
        const moveMatch = moveHistory.every((m, idx) => g.moves[idx] === (getNotation(m.fromX, m.fromY) + getNotation(m.toX, m.toY)));
        return moveMatch
    });
    
    const freqCounts = {};
    filteredGames.forEach(g => {
        const nextMove = g.moves[moveHistory.length];
        if (nextMove) {
            freqCounts[nextMove] = (freqCounts[nextMove] || 0) + 1;
        }
    });
    return Object.entries(freqCounts)
        .map(([move, count]) => ({ move, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

function updateVis() {
    d3.select("#counter").text(`Move Count: ${moveHistory.length}`);

    const historyString = moveHistory.map((m, i) => {
        const piece = standardNotation[pieces.find(p => p.id === m.id).type] || '';
        const location = getNotation(m.toX, m.toY);
        const moveStr = `${piece}${location}`;
        if (i % 2 === 0) {
            return `${Math.floor(i / 2) + 1}. ${moveStr}`;
        }
        return moveStr;
    }).join(" ");
    d3.select("#history-log").text(`Move History: ${historyString}`);

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
            .attr("x1", d => getPx(d.move.substring(0, 2)).x)
            .attr("y1", d => getPx(d.move.substring(0, 2)).y)
            .attr("x2", d => getPx(d.move.substring(2, 4)).x)
            .attr("y2", d => getPx(d.move.substring(2, 4)).y)
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
        if (pieces.some(p => p !== d && p.gridX === movedX && p.gridY === movedY) || (movedX == d.startX && movedY == d.startY)) {
            piece.transition()
                .duration(100)
                .ease(d3.easeBackOut)
                .attr("x", d.gridX * boxSize)
                .attr("y", d.gridY * boxSize);
        } else {
            moveHistory.push({
                id: d.id,
                fromX: d.startX,
                fromY: d.startY,
                toX: movedX,
                toY: movedY
            });
            
            d.gridX = movedX;
            d.gridY = movedY;
            d.pos = getNotation(movedX, movedY);
            piece.transition()
                .duration(100)
                .ease(d3.easeBackOut)
                .attr("x", d.gridX * boxSize)
                .attr("y", d.gridY * boxSize);
            updateVis();
        }
        
    });

boardGroup.selectAll(".piece")
    .data(pieces)
    .enter()
    .append("image")
    .attr("xlink:href", d => "./pieces/" + d.img)
    .attr("class", "piece")
    .attr("x", d => d.gridX * boxSize)
    .attr("y", d => d.gridY * boxSize)
    .attr("width", boxSize)
    .attr("height", boxSize)
    .call(drag);
updateVis();

d3.select("#undoBtn").on("click", () => {
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory.pop();
    const pieceData = pieces.find(p => p.id === lastMove.id);
    pieceData.gridX = lastMove.fromX;
    pieceData.gridY = lastMove.fromY;
    pieceData.pos = getNotation(pieceData.gridX, pieceData.gridY);
    boardGroup.selectAll(".piece")
        .filter(p => p.id === lastMove.id)
        .transition()
        .duration(200)
        .attr("x", pieceData.gridX * boxSize)
        .attr("y", pieceData.gridY * boxSize);
    updateVis();
});

d3.select("#resetBtn").on("click", () => {
    moveHistory = [];
    pieces.forEach((p, i) => {
        p.gridX = initPos[i].gridX;
        p.gridY = initPos[i].gridY;
        p.pos = initPos[i].pos;
    });
    boardGroup.selectAll(".piece")
        .transition()
        .duration(100)
        .delay((d, i) => i * 10)
        .attr("x", d => d.gridX * boxSize)
        .attr("y", d => d.gridY * boxSize);
    updateVis();
});


