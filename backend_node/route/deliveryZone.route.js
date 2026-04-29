import { Router } from 'express';
import auth from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js';
import {
    createDeliveryZone,
    getDeliveryZones,
    updateDeliveryZone,
    deleteDeliveryZone,
    checkPincode,
} from '../controllers/deliveryZone.controller.js';

const deliveryZoneRouter = Router();

deliveryZoneRouter.post('/create', auth, admin, createDeliveryZone);
deliveryZoneRouter.get('/get', getDeliveryZones);
deliveryZoneRouter.put('/update', auth, admin, updateDeliveryZone);
deliveryZoneRouter.delete('/delete', auth, admin, deleteDeliveryZone);
deliveryZoneRouter.post('/check-pincode', checkPincode);

export default deliveryZoneRouter;
