import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import productsRouter from "./products";
import opportunitiesRouter from "./opportunities";
import alertsRouter from "./alerts";
import marketplacesRouter from "./marketplaces";
import subscriptionsRouter from "./subscriptions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(productsRouter);
router.use(opportunitiesRouter);
router.use(alertsRouter);
router.use(marketplacesRouter);
router.use(subscriptionsRouter);

export default router;
