const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require('jsonwebtoken')
const cookeyParser = require('cookie-parser')
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors({
  origin:["http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(cookeyParser())

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0twede1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollecton = client.db("medicalcampDB").collection("users");
    const campCollecton = client.db("medicalcampDB").collection("camps");

    app.get("/user", async (req, res) => {
      const userdata = req.query.email;
      const result = await userCollecton.findOne({ email: userdata });
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await userCollecton.insertOne(user);
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const userdata = req.body;
      const token = jwt.sign(userdata, process.env.RANDOM_SECRET_TOKEN, {
        expiresIn: "1h",
      });
      console.log(userdata);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', 
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
    });

    app.get('/campcount', async(req, res)=>{
      const count = await campCollecton.estimatedDocumentCount()
      res.send({count})
    })

    app.get("/camps", async (req, res) => {
      const page = parseInt(req.query.page);
      const category = req.query.filter;
      
      var categoryfilter;
      if (!(category === "all")) {
        categoryfilter = { division: category };
      }
        const skip = (page - 1) * 6;
        console.log(skip);

      const result = await campCollecton
        .find(categoryfilter)
        .skip(skip)
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/campdetails/:id", async(req, res)=> {
      const id = req.params.id;
      const result = await campCollecton.findOne({_id: new ObjectId(id)})
      res.send(result)
    })

    app.post("/camp", async (req, res) => {
      const query = req.body;
      const result = await campCollecton.insertOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  console.log(res.send("hellow dere"));
});

app.listen(port, () => {});
