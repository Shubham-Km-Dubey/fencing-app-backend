// Updated Import: Use modular V2 for HTTPS requests
const {onRequest} = require("firebase-functions/v2/https");
const {MongoClient} = require("mongodb");
const {Storage} = require("@google-cloud/storage");
const Busboy = require("busboy");

// Securely access the MongoDB URI set as a secret
// Note: V2 functions automatically load secrets into process.env if listed in 'secrets' array
const mongoUri = process.env.MONGO_URI;

// Your confirmed project ID for the Storage bucket
const BUCKET_NAME = "fencing-india-464c5.appspot.com";
const storage = new Storage();

// Use the V2 syntax for defining the function with memory and secrets.
exports.registerUserWithMedia = onRequest({
  memory: "512MiB",
  secrets: ["MONGO_URI"],
}, async (req, res) => {
  // 1. Ensure it's a POST request and has the correct content type
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  if (!req.headers["content-type"] || !req.headers["content-type"].startsWith("multipart/form-data")) {
    return res.status(400).send("Bad Request: Content type must be multipart/form-data.");
  }

  const busboy = Busboy({headers: req.headers});
  const fields = {};
  const uploads = {};

  // 2. Handle text fields (name, email, etc.)
  busboy.on("field", (fieldname, val) => {
    fields[fieldname] = val;
  });

  // 3. Handle file upload
  busboy.on("file", (fieldname, file, info) => {
    const {filename, mimeType} = info;
    const filepath = `media/${fields.email || "user"}/${filename}`; // Create a unique path
    const fileUpload = storage.bucket(BUCKET_NAME).file(filepath);

    uploads[fieldname] = {
      filepath: filepath,
      mimeType: mimeType,
    };

    // Pipe the file stream directly to Firebase Storage
    file.pipe(fileUpload.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
    }));
  });

  // 4. Handle end of the request
  busboy.on("finish", async () => {
    let client;
    try {
      // Get the public URL for the uploaded file
      const mediaKey = Object.keys(uploads)[0];
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${uploads[mediaKey].filepath}`;

      // Connect to MongoDB Atlas
      client = await MongoClient.connect(mongoUri);

      const db = client.db("YOUR_DATABASE_NAME"); // <-- REMINDER: Replace this with your actual DB name!
      const users = db.collection("users");

      // Insert user data and media URL into MongoDB
      const result = await users.insertOne({
        name: fields.name,
        email: fields.email,
        mediaUrl: publicUrl,
        uploadedAt: new Date(),
      });

      res.status(200).send({
        message: "Registration successful!",
        userId: result.insertedId,
        mediaUrl: publicUrl,
      });
    } catch (error) {
      console.error("MongoDB or Storage Error:", error);
      res.status(500).send("Internal Server Error: " + error.message);
    } finally {
      if (client) {
        await client.close();
      }
    }
  });

  // Pipe the request body into Busboy for parsing
  busboy.end(req.rawBody);
});
