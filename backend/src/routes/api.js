const express = require('express');
const dbPool = require('../config/db');

// Repositories & Controllers
const BaseRepository = require('../repositories/BaseRepository');
const BaseController = require('../controllers/BaseController');

// Services
const BaseService = require('../services/BaseService');
const { GroupService, FloorService } = require('../services/MenuServices');
const OrderService = require('../services/OrderService');

const router = express.Router();

/**
 * Helper function to dynamically create full CRUD routes for a given service
 */
function makeRoute(svc) {
    const r = express.Router();
    const c = new BaseController(svc);
    
    r.get('/', c.getAll.bind(c));
    r.get('/:id', c.getById.bind(c));
    r.post('/', c.create.bind(c));
    r.put('/:id', c.update.bind(c));
    r.delete('/:id', c.delete.bind(c));
    
    return r;
}

// ==========================================
// 1. STANDARD CRUD ENDPOINTS
// ==========================================
const tables = [
    'taxes', 'variants', 'addons', 'items', 'inventory', 
    'customers', 'feedback', 'tokens', 'expenses', 'staff', 
    'online_orders', 'tables', 'categories'
];

// Dynamically generate routes for simple tables
tables.forEach(t => {
    const repository = new BaseRepository(dbPool, t);
    const service = new BaseService(repository);
    router.use(`/${t}`, makeRoute(service));
});

// ==========================================
// 2. RELATIONAL ENDPOINTS (Custom Services)
// ==========================================
router.use('/groups', makeRoute(
    new GroupService(
        new BaseRepository(dbPool, 'menu_groups'), 
        new BaseRepository(dbPool, 'categories')
    )
));

router.use('/floors', makeRoute(
    new FloorService(
        new BaseRepository(dbPool, 'floors'), 
        new BaseRepository(dbPool, 'tables')
    )
));

// ==========================================
// 3. OPERATIONAL ENDPOINTS (Orders, KOT, Dashboard)
// ==========================================
const ordSvc = new OrderService(dbPool);

router.post('/orders/place', async (req, res, nxt) => { 
    try { 
        res.json({ data: await ordSvc.placeOrder(req.body) });
    } catch(e) { 
        nxt(e); 
    }
});

router.post('/orders/settle', async (req, res, nxt) => { 
    try { 
        res.json({ data: await ordSvc.settleBill(req.body) });
    } catch(e) { 
        nxt(e); 
    }
});

router.get('/dashboard', async (req, res) => { 
    const [[{ rev }]] = await dbPool.query('SELECT SUM(total) as rev FROM bills'); 
    res.json({ data: { revenue: rev || 0 } }); 
});

module.exports = router;

