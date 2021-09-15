require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const dns = require("dns");
const urlparser = require("url");

// Basic Configuration
const port = process.env.PORT || 3000;

// DB configuration
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (!err) console.log("MongoDB has connected successfully.");
  }
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Create Schema & Model
const urlSchema = new Schema({
  url: String,
});
let URL = mongoose.model("Url", urlSchema);

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res) => {
  let bodyUrl = req.body.url;

  let something = dns.lookup(
    urlparser.parse(bodyUrl).hostname,
    (error, address) => {
      if (!address) {
        res.json({ error: "invalid url" });
      } else {
        let url = new URL({ url: bodyUrl });
        url.save((err, data) => {
          if (!err) {
            res.json({ original_url: data.url, short_url: data.id });
          }
        });
      }
    }
  );

  console.log("something : ", something);
});

app.get("/api/shorturl/:id", (req, res) => {
  let id = req.params.id;

  URL.findById(id, (err, data) => {
    if (!data) {
      res.json({ error: "invalid url" });
    } else {
      res.redirect(data.url);
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
