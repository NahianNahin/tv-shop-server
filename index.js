const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

//MiddleWare
app.use(cors());
app.use(express.json());
// Verify JWT Token
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_JWT_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send('Forbidden Access');
        }
        req.decoded = decoded;
        next();
    })

}


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


        // After VerifyJWT use VerifyAdmin
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.role !== 'Admin') {
                return res.status(403).send('Forbidden Access');
            }
            next();
        }
        // After VerifyJWT use VerifySeller
        const verifySeller = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.role !== 'Seller') {
                return res.status(403).send('Forbidden Access');
            }
            next();
        }
        // After VerifyJWT use VerifyBuyer
        const verifyBuyer = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.role !== 'Buyer') {
                return res.status(403).send('Forbidden Access');
            }
            next();
        }
        // Get User by Email
        app.get('/users', verifyJWT, async (req, res) => {
            const setEmail = req.query.email;
            const query = { email: setEmail };
            const result = await usersCollection.findOne(query);
            res.send(result);
        })
        // Get User by Seller Name
        app.get('/users_by_seller', async (req, res) => {
            const setSeller = req.query.seller;
            const query = { name: setSeller };
            const result = await usersCollection.findOne(query);
            res.send(result);
        })
        // Get User by role
        app.get('/users_role', verifyJWT, verifyAdmin, async (req, res) => {
            const setRole = req.query.role;
            const query = { role: setRole };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        //put User Details
        app.put('/users', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email }
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: user.name,
                    role: user.role,
                    photoURL: user.photoURL
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })
        //Verify Seller
        app.put('/user/seller_verified/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    verified: true
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        // Delete User
        app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })
        // Check Seller
        app.get('/users_seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        })
        // Check Buyer
        app.get('/users_buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'Buyer' });
        })
        // Check Admin
        app.get('/users_admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
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
        app.get('/seller_products', verifyJWT, verifySeller, async (req, res) => {
            const setSellerEmail = req.query.email;
            const filter = {
                sellerEmail: setSellerEmail
            }
            const result = await productsCollection.find(filter).toArray();
            res.send(result)
        })
        // Get Product by Advertised
        app.get('/advertise_products', async (req, res) => {
            const filter = {
                advertised: true,
                sold: false
            }
            const result = await productsCollection.find(filter).toArray();
            res.send(result)
        })
        // Get Product by Reported
        app.get('/reported_products', verifyJWT, verifyAdmin, async (req, res) => {
            const filter = {
                reported: true
            }
            const result = await productsCollection.find(filter).toArray();
            res.send(result)
        })

        //Get All  Product
        app.get('/all_products', async (req, res) => {
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
        app.post('/products', verifyJWT, verifySeller, async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })
        //GET ADVERTISE UPDATE
        app.put('/product/get_advertise/:id', verifyJWT, verifySeller, async (req, res) => {
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
        app.put('/product/remove_advertise/:id', verifyJWT, verifySeller, async (req, res) => {
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
        //GET REPORT UPDATE
        app.put('/product/add_reported/:id', verifyJWT, verifyBuyer, async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    reported: true
                },
            };
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        //GET SOLD UPDATE
        app.put('/product/sold_status/:id', verifyJWT, verifySeller, async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    sold: true
                },
            };
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        //GET UNSOLD UPDATE
        app.put('/product/unsold_status/:id', verifyJWT, verifySeller, async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    sold: false
                },
            };
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        // Delete Product
        app.delete('/product/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })
        // update Data
        app.get('/update', async (req, res) => {

            const filter = {

            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    sellerEmail: 'ariyankhan702018@gmail.com'
                },
            };
            const result = await productsCollection.updateMany(filter, updateDoc, options);
            res.send(result)
        })

        // Get Bookings by email
        app.get('/bookings', verifyJWT, verifyBuyer, async (req, res) => {
            const selectedEmail = req.query.email;
            const filter = {
                email: selectedEmail
            }
            const booking = await bookingsCollection.find(filter).toArray();
            // console.log(booking);
            res.send(booking);
        })
        // Get Bookings by id
        app.get('/bookings/:id', verifyJWT, verifyBuyer, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const result = await bookingsCollection.findOne(query);
            res.send(result);
        })
        // Post Bookings
        app.post('/bookings', verifyJWT, verifyBuyer, async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })


        // PAYMENT
        // Stripe intent
        app.post("/create-payment-intent", verifyJWT, verifyBuyer, async (req, res) => {
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
        app.post('/payments', verifyJWT, verifyBuyer, async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const productId = payment.product_id;
            const filter = {
                _id: ObjectId(id)
            }
            const query = {
                _id: ObjectId(productId)
            }
            const updateBooking = {
                $set: {
                    paid: true,
                    transation_id: payment.transationId
                },
            };
            const updateProduct = {
                $set: {
                    sold: true
                },
            };
            const updateresultBooking = await bookingsCollection.updateOne(filter, updateBooking);
            const updateresultproduct = await productsCollection.updateOne(query, updateProduct);
            res.send(result);

        })


        // Get All blogs
        app.get('/blogs', async (req, res) => {
            const query = {};
            const result = await blogsCollection.find(query).toArray();
            res.send(result);
        })
    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);

// Get Jwt Token
app.get('/jwt', (req, res) => {
    const selectEmail = req.query.email;
    const user = {
        email: selectEmail
    }
    const token = jwt.sign(user, process.env.ACCESS_JWT_TOKEN, { expiresIn: '7d' });
    res.send({ token })
})
app.get('/', (req, res) => {
    res.send('TV Shop server is running')
})

app.listen(port, () => {
    console.log(`TV Shop server is listening on port ${port}`)
})