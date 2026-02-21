import express from "express"
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import citiesRouter from "./src/modules/cities/cities.routes.js"
import morgan from "morgan";
const app = express();
const port = process.env.PORT || 3000;

dotenv.config();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173", // your frontend
    credentials: true
}));
app.use(helmet());
app.use(morgan("dev"))


app.use("/api/cities", citiesRouter)

app.get("/", (req, res) => {
    res.send("Hello")
})



app.listen(port, () => {
    console.log("Server started on port " + port)
})