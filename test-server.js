const express = require("express");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

let timeLeft = 30;

app.get("/status", (req, res) => {
  res.json({ timeLeft, test: "OK" });
});

app.get("/start", (req, res) => {
  res.send("START OK");
});

const PORT = 3000;
try {
  app.listen(PORT, () => {
    console.log(`Server at http://localhost:${PORT}`);
    setInterval(() => console.log("alive"), 5000);
  });
} catch(err) {
  console.error("LISTEN ERROR:", err);
}
