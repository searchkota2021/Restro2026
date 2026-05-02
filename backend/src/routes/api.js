const express = require('express');
const dbPool = require('../config/db');

// Utils
const TransactionManager = require('../utils/TransactionManager');

// Repositories
const BaseRepository = require('../repositories/BaseRepository');

// Services
const BaseService = require('../services/BaseService');
const { GroupService, CategoryService } = require('../services/MenuServices');
const { FloorService, TableService } = require('../services/TableServices');
const OrderService = require('../services/OrderService');
const DashboardService = require('../services/DashboardService');

// Controllers
const BaseController = require('../controllers/BaseController');
const DashboardController = require('../controllers/DashboardController');

const router = express.Router();

function createRoute(serviceInstance) {
    const r = express.Router();
    const ctrl = new BaseController(serviceInstance);
    r.get('/', (req, res, next) => ctrl.getAll(req, res, next));
    r.get('/:id', (req, res, next) => ctrl.getById(req, res, next));
    r.post('/', (req, res, next) => ctrl.create(req, res, next));
    r.put('/:id', (req, res, next) => ctrl.update(req, res, next));
    r.delete('/:id', (req, res, next) => ctrl.delete(req, res, next));
    return r;
}

// --- Repositories ---
const groupRepo = new BaseRepository(dbPool, 'menu_groups');
const catRepo = new BaseRepository(dbPool, 'categories');
const itemRepo = new BaseRepository(dbPool, 'items');
const floorRepo = new BaseRepository(dbPool, 'floors');
const tableRepo = new BaseRepository(dbPool, 'tables');
const orderRepo = new BaseRepository(dbPool, 'orders');
const kotRepo = new BaseRepository(dbPool, 'kots');
const invRepo = new BaseRepository(dbPool, 'inventory');

// --- Relational Routes ---
router.use('/groups', createRoute(new GroupService(groupRepo, catRepo)));
router.use('/categories', createRoute(new CategoryService(catRepo, itemRepo)));
router.use('/floors', createRoute(new FloorService(floorRepo, tableRepo)));
router.use('/tables', createRoute(new TableService(tableRepo)));

// --- Standard CRUD Routes ---
const simpleTables = ['taxes', 'variants', 'addons', 'items', 'inventory', 'customers', 'feedback', 'tokens', 'expenses', 'staff', 'online_orders'];
simpleTables.forEach(t => router.use(`/${t}`, createRoute(new BaseService(new BaseRepository(dbPool, t)))));

// --- Operational Routes ---
const txManager = new TransactionManager(dbPool);
const orderSvc = new OrderService(orderRepo, kotRepo, tableRepo, invRepo, txManager);

router.post('/orders/place', async (req, res, next) => { 
    try { res.json({ success: true, data: await orderSvc.placeOrder(req.body) }); } catch(e){ next(e); }
});

router.post('/orders/settle', async (req, res, next) => { 
    try { res.json({ success: true, data: await orderSvc.settleBill(req.body) }); } catch(e){ next(e); }
});

router.put('/kots/:id/ready', async (req, res, next) => { 
    try { 
        await kotRepo.update(req.params.id, { status: 'ready' });
        res.json({ success: true }); 
    } catch(e){ next(e); }
});

// --- Dashboard Routes ---
const dashCtrl = new DashboardController(new DashboardService(dbPool));
router.get('/dashboard', (req, res, next) => dashCtrl.getSummary(req, res, next));

module.exports = router;
