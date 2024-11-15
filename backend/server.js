//load ennvironment variables
require("dotenv").config();
const projectId = process.env.GCP_PROJECT_ID;
const keyFile = process.env.GCP_KEYFILE_PATH;
const modelEndpoint = process.env.GCP_MODEL_ENDPOINT;
const port = process.env.PORT;

// imports
const express = require("express");
const cors = require("cors");
const multer = require("multer"); // middlewre for handling img uploads
const { PredictionServiceClient } = require("@google-cloud/aiplatform"); // import for vertex ai

//create/enable express
const app = express(); // creates the app

//enabling middlewares
app.use(cors());
app.use(express.json()); //takes json data and turns it into a js object

// configuring vertex ai client
const client = new PredictionServiceClient({
  keyFilename: keyFile, // path to service acckey
});

// setting up mutler to handle img uploads
const upload = multer({ storage: multer.memoryStorage() }); // store file in memory

//  ----- endpoints ------ //

// test route
app.get("/", (req, res) => {
  res.send("Backend is connectified 🔌!");
});

// predict endpoint
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("please upload an image file");
    }

    const imageBase64 = req.file.buffer.toString("base64"); // converts the upload to base64 (converts binary data into text format to be sent over internet)

    const endpoint = `projects/${projectId}/locations/us-central1/endpoints/${modelEndpoint}`; // my models specific endpoint

    const instance = {
      content: imageBase64, // passes the image as base64 content
    };

    // call ai
    const [response] = await client.predict({
      endpoint: endpoint,
      instances: [instance],
    });

    // process & send back result
    const predictions = response.predictions.map((pred) => ({
      //map through results and return selected
      label: pred.displayName, // label
      score: pred.confidence, // confidence score of label
    }));

    res.status(200).json({ predictions });
  } catch (error) {
    console.error("an error occured during prediction:", error);
    res.status(500).send("an error occured during prediction");
  }
});

// START THE SERVER
//listening on localhost:port (at bottom always)
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
