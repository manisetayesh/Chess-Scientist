
const initPos = []
const getNotation = (x, y) => {
    return `${files[x]}${ranks[y]}`;
};
const getPx = (notation) => {
    return {
        x: files.indexOf(notation[0]) * boxSize + boxSize / 2,
        y: (8 - parseInt(notation[1])) * boxSize + boxSize / 2
    };
}
var counts = {}
const addPiece = (type, color, x, y) => {
    const mapping = { 
        king: 'k', queen: 'q', rook: 'r', 
        bishop: 'b', knight: 'n', pawn: 'p' 
    };
    const key = `${color[0]}${mapping[type]}`;
    counts[key] = (counts[key] || 0) + 1;
    initPos.push({id: `${key}${counts[key]}`, color:color, img: `${color}_${type}.png`, gridX: x, gridY: y, pos: getNotation(x, y), type: type});
}
for (let i = 0; i < 8; i++) {
    addPiece(layout[i], 'black', i, 0);
    addPiece('pawn', 'black', i, 1);
    addPiece('pawn', 'white', i, 6);
    addPiece(layout[i], 'white', i, 7); 
}