const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const layout = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
const size = 8;
const boxSize = 60;
const lightColor = "#eeeed2";
const darkColor = "#769656";
const margin = 30; 

const boardData = [];


for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
        boardData.push({
            x: col * boxSize,
            y: row * boxSize,
            color: (row + col) % 2 === 0 ? lightColor : darkColor
        });
    }
}
const svg = d3.select("#board")
    .append("svg")
    .attr("width", size * boxSize + margin * 2)
    .attr("height", size * boxSize + margin * 2);
const boardGroup = svg.append("g")
    .attr("transform", `translate(${margin}, ${margin})`);
boardGroup.selectAll(".square")
    .data(boardData)
    .enter()
    .append("rect")
    .attr("class", "square")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("width", boxSize)
    .attr("height", boxSize)
    .attr("fill", d => d.color);

files.forEach((file, i) => {
    boardGroup.append("text").attr("class", "board-label").text(file)
        .attr("x", i * boxSize + boxSize / 2)
        .attr("y", -10);
    boardGroup.append("text").attr("class", "board-label").text(file)
        .attr("x", i * boxSize + boxSize / 2)
        .attr("y", size * boxSize + 20);
});
ranks.forEach((rank, i) => {
    boardGroup.append("text").attr("class", "board-label").text(rank)
        .attr("x", -15)
        .attr("y", i * boxSize + boxSize / 2);
    boardGroup.append("text").attr("class", "board-label").text(rank)
        .attr("x", size * boxSize + 15)
        .attr("y", i * boxSize + boxSize / 2);
});

svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 8)
    .attr("refY", 0)
    .attr("markerWidth", 5)
    .attr("markerHeight", 5)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "orange");