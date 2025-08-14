import express from 'express';
import authRoute from './auth.route.js';
import categoryRoute from './category.route.js';
import productRoute from './product.route.js';
import userRoute from './user.route.js';
import cartRoute from './cart.route.js';
import orderRoute from './order.route.js';
import storageRoute from './StorageRoutes.js';
const router = express.Router();

router.use('/auth', authRoute);
router.use('/category', categoryRoute);
router.use('/product', productRoute);
router.use('/user', userRoute);
router.use('/cart', cartRoute);
router.use('/order', orderRoute);
router.use('/storage', storageRoute);

export default router;
