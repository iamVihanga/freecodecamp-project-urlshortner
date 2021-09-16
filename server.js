require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const dns = require("dns");
const url = require("url");

// Basic Configuration
const port = 3000;

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
  original_url: String,
  short_url: String,
});
let URL = mongoose.model("Url", urlSchema);

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const lookUpUrl = req.body.url;
    const parsedUrl = url.parse(lookUpUrl);

    dns.lookup(parsedUrl.hostname, (error, address, family) => {
      if (!error && parsedUrl.hostname != null) {
        // Create new short url object
        const newUrl = new URL({
          original_url: parsedUrl.href,
          short_url: new Date().getTime().toString(36),
        });

        // Save new url object to DB
        newUrl.save((err, data) => {
          if (!err) {
            res.json({
              original_url: data.original_url,
              short_url: data.short_url,
            });
          }
        });
      } else {
        res.json({
          error: "invalid url",
        });
      }
    });
  }
});

app.get("/api/shorturl/:url", (req, res) => {
  URL.findOne({ short_url: req.params.url })
    .then((url) => res.redirect(301, url.original_url))
    .catch((err) => res.json(err));
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
