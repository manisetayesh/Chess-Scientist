d3.selectAll(".tab-btn").on("click", function() {
    const target = d3.select(this).attr("data-tab");
    d3.selectAll(".tab-btn").classed("active", false);
    d3.select(this).classed("active", true);
    d3.selectAll(".tab-pane").classed("active", false);
    d3.select(`#${target}`).classed("active", true);
});

let uniqueOpenings = [];

function processOpenings(data) {
    const openingMap = new Map();
    data.forEach(g => {
        const name = g.opening_name
        if (openingMap.has(name)) {
            const existing = openingMap.get(name);
            existing.count += 1;
        } else {
            openingMap.set(name, {
                name: name,
                eco: g.opening_eco,
                moves: g.moves.split(" ").slice(0, +g.opening_ply),
                coords: g.coords.slice(0, +g.opening_ply),
                moveCount: +g.opening_ply,
                count: 1
            });
        }
    });
    uniqueOpenings = Array.from(openingMap.values())
        .sort((a, b) => b.count - a.counts);

    initOpenings();
}

function initOpenings() {
    const container = d3.select("#openingSuggestions");
    container.selectAll("*").remove();
    const listWrapper = container.append("div").attr("class", "opening-scroll-area");

    const drawList = (data) => {
        const items = listWrapper.selectAll(".opening-item")
            .data(data, d => d.name);
        items.join("div")
            .attr("class", "opening-item")
            .html(d => `
                <div class="opening-header">
                    <span class="eco-badge">${d.eco}</span>
                    <strong>${d.name}</strong>
                </div>
                <div class="opening-moves">${d.moves}</div>
            `)
            .on("click", (event, d) => playOpeningSequence(d.coords));
    };
    drawList(uniqueOpenings.slice(0, 50));
}

let openingTimers = [];
function playOpeningSequence(moveList) {
    openingTimers.forEach(t => clearTimeout(t));
    openingTimers = [];
    resetVis(); 

    const MOVE_DELAY = 600;
    const START_OFFSET = 500; 

    moveList.forEach((uci, index) => {
        const from = fromNotation(uci.substring(0, 2), false);
        const to = fromNotation(uci.substring(2, 4), false);
        
        const t = setTimeout(() => {
            const d = pieces.find(p => p.gridX === from.x && p.gridY === from.y);
            console.log(from, to, d, uci)
            if (d) {
                const pieceElement = d3.select(`#piece-${d.id}`);
                move(d, pieceElement, to.x, to.y);
            }
        }, (index * MOVE_DELAY) + START_OFFSET);
        openingTimers.push(t);
        }
    )
}


