const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//MiddleWare
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4k7t9co.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db("TV-Shop").collection("users");
        const categoriesCollection = client.db("TV-Shop").collection("Categories");
        const productsCollection = client.db("TV-Shop").collection("products");
        const bookingsCollection = client.db("TV-Shop").collection("bookings");


        //Post User Details
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        // Get Categories 
        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).toArray();
            res.send(result);
        })
        // get product by categories 
        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })
        //Get All  Product
        app.get('/products', async (req, res) => {
            const query = {};
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })
        // get product by categories 
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })
        // Post Product
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })
        // update Data
        app.get('/updateCategories/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    bgColor: 'bg-neutral',
                    color: 'text-white'
                },
            };
            const result = await categoriesCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
       
        // Get Bookings by email
        app.get('/bookings', async (req, res) => {
            const selectedEmail = req.query.email;
            const filter = {
                email: selectedEmail
            }
            const booking = await bookingsCollection.find(filter).toArray();
            // console.log(booking);
            res.send(booking);
        })
        // Get Bookings by id
        app.get('/bookings/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {
                _id : ObjectId(id)
            }
            const result = await bookingsCollection.findOne(query);
            res.send(result);
        })
        // Post Bookings
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
        // Delete anything
        app.get('/deleteBookings', async (req, res) => {
            const query = {};
            const result = await bookingsCollection.deleteMany(query);
            res.send(result);
        })
    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('TV Shop server is running')
})

app.listen(port, () => {
    console.log(`TV Shop server is listening on port ${port}`)
})