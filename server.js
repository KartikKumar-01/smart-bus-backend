import express from "express"
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import citiesRouter from "./src/modules/cities/cities.routes.js"
import routesRouter from "./src/modules/bus-routes/bus-routes.routes.js"
import authRouter from "./src/modules/auth/auth.routes.js"
import adminRouter from "./src/modules/admin/admin.routes.js"
import busesRouter from "./src/modules/buses/buses.routes.js"
import busScheduleRouter from "./src/modules/bus-schedule/bus-schedule.routes.js"
import bookingsRouter from "./src/modules/bookings/bookings.routes.js"
// import "./src/config/redis.js"
import morgan from "morgan";
import { adminLoginController } from "./src/modules/admin/admin.controller.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.urlencoded({extended: true}))
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(helmet());
app.use(morgan("dev"))

// Admin login route (separate from API routes)
app.post("/admin/login", adminLoginController)

app.use("/api/cities", citiesRouter)
app.use("/api/routes", routesRouter)
app.use("/api/auth", authRouter)
app.use("/api/admin", adminRouter)
app.use("/api/buses", busesRouter)
app.use("/api/bus-schedules", busScheduleRouter)
app.use("/api/bookings", bookingsRouter)

app.get("/", (req, res) => {
    res.send("Hello")
})



app.listen(port, () => {
    console.log("Server started on port " + port)
})