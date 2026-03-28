import express from 'express';
import axios from 'axios';
// import sessions from 'express-session';

const app = express();
const PORT = 4000;

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//middleware
app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req, res) => {
    const title = "HEdClass - Home";
    res.render("login", { title });
});


/*
app.get("/dashboard", async (req, res) => {

    const ep = 'http://localhost:5000/getallstores';
    const apiResult = await axios.get(ep);
    const stores = apiResult.data.stores;
    const count = apiResult.data.totalStores;
    res.render("dashboard", { stores, count });
});
*/

app.listen(PORT, (err) => {
    console.log(`listening on port http://localhost:${PORT}`);
});