const eloMin = d3.select("#eloMin");
const eloMax = d3.select("#eloMax");
const minDisp = d3.select("#eloMinDisplay");
const maxDisp = d3.select("#eloMaxDisplay");

const handleRange = (event) => {
    let valMin = parseInt(eloMin.property("value"));
    let valMax = parseInt(eloMax.property("value"));
    if (valMin > valMax - 100) { 
        if (event.target.id === "eloMin") {
            eloMax.property("value", valMin + 100);
        } else {
            eloMin.property("value", valMax - 100);
        }
    }
    minDisp.text(eloMin.property("value"));
    maxDisp.text(eloMax.property("value"));
};

eloMin.on("input", (event) => {handleRange(event)});
eloMax.on("input", (event) => {handleRange(event)});