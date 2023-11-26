require("dotenv").config()
const port = process.env.PORT || 4000
const app = require("./app")

app.get("/", (req, res) => res.send({ message: "server is ok" }));

// app.use((req, res, next) => res.send({ message: "bad url" }));
// app.use((err, req, res, next) => res.send({ message: "other error" }));
app.listen(port, () => console.log(`app listening on port ${port}!`))