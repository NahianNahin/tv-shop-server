const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
        const paymentsCollection = client.db("TV-Shop").collection("payments");
        const blogsCollection = client.db("TV-Shop").collection("blogs");

        // Get User by role
        app.get('/users', async (req, res) => {
            const setRole = req.query.role;
            const query = { role: setRole };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })
        //Post User Details
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
        // Delete User
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
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
       
        // Get Product by seller
        app.get('/products', async(req, res) => {
            const setSellerEmail = req.query.email;
            const filter = {
                sellerEmail : setSellerEmail
            }
            const result = await productsCollection.find(filter).toArray();
            res.send(result)
        })
        // Get Product by Advertised
        app.get('/advertise_products', async(req, res) => {
            const filter = {
                advertised : true
            }
            const result = await productsCollection.find(filter).toArray();
            res.send(result)
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
        //GET ADVERTISE UPDATE
        app.put('/product/get_advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    advertised: true
                },
            };
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        //REMOVE ADVERTISE UPDATE
        app.put('/product/remove_advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    advertised: false
                },
            };
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        // update Data
        app.get('/update', async (req, res) => {
            
            const filter = {
                
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    sellerEmail:'ariyankhan702018@gmail.com'
                },
            };
            const result = await productsCollection.updateMany(filter, updateDoc, options);
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
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
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


        // PAYMENT
        // Stripe intent
        app.post("/create-payment-intent", async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                "payment_method_types": [
                    "card"
                ],
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        // Post Payment 
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = {
                _id: ObjectId(id)
            }
            const updateDoc = {
                $set: {
                    paid: true,
                    transation_id: payment.transationId
                },
            };
            const updateresult = await bookingsCollection.updateOne(filter, updateDoc);
            res.send(result);

        })

        // Delete anything
        app.get('/deleteBookings', async (req, res) => {
            const query = {};
            const result = await bookingsCollection.deleteMany(query);
            res.send(result);
        })
        // Get All blogs
        app.get('/blogs', async(req, res) => {
            const query = {};
            const result = await blogsCollection.find(query).toArray();
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