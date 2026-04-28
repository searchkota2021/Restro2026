const DB_KEY = 'restros_db_v5';

let restrosDB = { 
    floors: [], tables: [], items: [], categories: [], groups: [], taxes: [], addons: [], variants: [],
    bills: [], orders: [], kots: [], inventory: [], customers: []
};

function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        restrosDB = {
            groups: [{ id: "g1", name: "Food" }, { id: "g2", name: "Beverages" }],
            categories: [{ id: "c1", name: "Starters", group: "g1" }, { id: "c2", name: "Cold Drinks", group: "g2" }],
            taxes: [{ id: "t1", name: "GST 5%", rate: 5, type: "forward" }],
            variants: [{ id: "v1", name: "Portion Size", options: [{label:"Half",price:0}, {label:"Full",price:80}] }],
            addons: [{ id: "a1", name: "Extra Dips", min: 0, max: 2 }],
            items: [
                { id: "i1", name: "Paneer Tikka", code: "PTK-1", category: "c1", tax: "t1", foodType: "veg", active: true, prices: { dinein: 280, takeaway: 280, online: 300, quick: 280 }, channels: {dinein:true, takeaway:true, online:true, quick:true} },
                { id: "i2", name: "Coke", code: "COK-1", category: "c2", tax: "t1", foodType: "veg", active: true, prices: { dinein: 60, takeaway: 60, online: 70, quick: 60 }, channels: {dinein:true, takeaway:true, online:true, quick:true} }
            ],
            floors: [{ id: "f1", name: "Main Dining" }],
            tables: [
                { id: "t1", floorId: "f1", name: "Table 1", capacity: 4, status: "free" },
                { id: "t2", floorId: "f1", name: "Table 2", capacity: 4, status: "free" }
            ],
            bills: [], orders: [], kots: [],
            inventory: [{ itemId: "i1", itemName: "Paneer Tikka", availableQty: 50, reorderAt: 10, unit: "pcs" }],
            customers: [{ id: "cust1", name: "Rahul Verma", phone: "9876543210", visits: 12, totalspent: 15400, loyaltyPoints: 840 }]
        };
        saveDB();
    } else {
        restrosDB = JSON.parse(localStorage.getItem(DB_KEY));
        if(!restrosDB.bills) restrosDB.bills = [];
        if(!restrosDB.kots) restrosDB.kots = [];
        if(!restrosDB.orders) restrosDB.orders = [];
    }
}

function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(restrosDB));
}
