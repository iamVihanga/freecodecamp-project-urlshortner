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
});
let URL = mongoose.model("Url", urlSchema);

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const bodyUrl = req.body.url;
    const parsedUrl = url.parse(bodyUrl);

    dns.lookup(parsedUrl.hostname, (error, address, family) => {
      console.log(parsedUrl.hostname);
      console.log(error, address, family);

      if (error === null && parsedUrl.hostname !== null) {
        let urlObj = new URL({
          original_url: parsedUrl.hostname,
        });
        urlObj.save((err, data) => {
          if (!err) {
            res.json({
              original_url: data.original_url,
              short_url: data._id,
            });
          }
        });
      } else {
        res.json({ error: "invalid url" });
      }
    });
  }
});

app.get("/api/shorturl/:url", (req, res) => {
  const id = req.params.url;

  URL.findById(id, (err, data) => {
    // console.log(data)
    if (err) {
      res.json({ error: "invalid url" });
    } else {
      res.redirect(`https://${data.original_url}/`);
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
