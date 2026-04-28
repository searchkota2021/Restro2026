const DB_KEY = 'restros_db_v3';

let restrosDB = { 
    floors: [], tables: [], items: [], categories: [], groups: [], taxes: [], bills: [], orders: [], kots: [] 
};

function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        restrosDB = {
            floors: [{ id: "f1", name: "Main Dining" }],
            tables: [
                { id: "t1", floorId: "f1", name: "Table 1", capacity: 4, status: "free" },
                { id: "t2", floorId: "f1", name: "Table 2", capacity: 2, status: "free" }
            ],
            items: [
                { id: "i1", name: "Paneer Tikka", category: "c1", prices: { dinein: 280, quick: 280 }, channels: {dinein:true, quick:true}, active: true },
                { id: "i2", name: "Coke", category: "c2", prices: { dinein: 60, quick: 60 }, channels: {dinein:true, quick:true}, active: true }
            ],
            bills: [], orders: [], kots: []
        };
        saveDB();
    } else {
        restrosDB = JSON.parse(localStorage.getItem(DB_KEY));
    }
}

function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(restrosDB));
}
