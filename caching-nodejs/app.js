const express = require("express");
const redis = require("redis");
const responseTime = require("response-time");
const axios = require("axios");
const { promisify } = require("util");

const app = express();
app.use(responseTime());
const client = redis.createClient({
  host: "127.0.0.1",
  port: 6379,
});

const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);

app.get("/rockets", async (req, res, next) => {
  try {
    const reply = await GET_ASYNC("rockets");
    if (reply) {
      console.log("cached data received");
      res.send(JSON.parse(reply));
      return;
    }
    const response = await axios.get("https://api.spacexdata.com/v3/rockets");
    const saveResult = await SET_ASYNC(
      "rockets",
      JSON.stringify(response.data),
      "EX",
      10
    );
    console.log("new data cached");
    res.send(response.data);
  } catch (err) {
    console.log(err.message);
  }
});

app.listen(5000, () => {
  console.log("Listening on port 5000");
});
