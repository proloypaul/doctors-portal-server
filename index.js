const express = require('express')
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const cors = require('cors')
const fileUpload = require('express-fileupload')
const admin = require("firebase-admin");
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET)
const app = express()
const port = process.env.PORT || 3800

// doctors-portal-firebase-adminsdk.json


const serviceAccount = require('./doctors-portal-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors())
app.use(express.json())
app.use(fileUpload())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e3dsx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri)

async function verifyToken(req, res, next) {
    if(req.headers?.authorization?.startsWith('Bearer ')){
        const token = req.headers?.authorization?.split(' ')[1]

        try{
            const decodedUser = await admin.auth().verifyIdToken(token)
            req.decodedEmail = decodedUser.email 
        }
        catch{

        }
    }
    next()
}
async function run(){
    try{
        await client.connect()
        // console.log("database connect successfully")
        const database = client.db('doctorsPortalWeb')
        const appointmentOrderCollection = database.collection('appointmentOrder')
        const userCollection = database.collection('users')
        

        // POST method to insertData in database
        app.post('/appointmentorders', async(req, res) => {
            const appointmentData = req.body 
            // console.log(appointmentData)
            const result = await appointmentOrderCollection.insertOne(appointmentData)
            // console.log("inser data to database result", result)
            res.json(result)
        })

        // collect loger data from database to server using loger email
        app.get('/appointmentorders', verifyToken, async (req, res) => {
            const email = req.query.email
            // console.log( "user email", email)
            const date = new Date(req.query.date).toLocaleDateString() 
            // console.log("apointment date", date)
            const query = {email: email, date: date}
            // console.log(query)
            const cursor = appointmentOrderCollection.find(query)
            const result = await cursor.toArray() 
            res.json(result)
        })
        // POST method 
        app.post('/users', async(req, res) => {
            const user = req.body;
            // console.log(user)
            const result = await userCollection.insertOne(user)
            // console.log("user result", result)
            res.json(result)
        })

        // PUT method to update user and check user

        app.put('/users', async(req, res) => {
            const user = req.body 
            const filter = {email: user.email}
            const options = {upsert: true}
            const updateDoc = {$set: user}
            const result = await userCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        });

        // put method to update user database and set role in database
        app.put('/users/admin', verifyToken, async(req, res) => {
            const admin = req.body 
            // console.log(admin)
            // console.log("user jwt token", req.headers.authorization)
            // console.log('using jwt take email', req.decodedEmail)
            const requester = req.decodedEmail
            if(requester){
                const requesterAccount = await userCollection.findOne({email: requester})
                if(requesterAccount.role === 'admin'){
                    const filter = {email: admin.email} 
                    const updateDoc = {$set: {role: "admin"}}
                    const result = await userCollection.updateOne(filter, updateDoc)
                    res.json(result)
                }
            }
            else{
                res.status(403).json({message: "you don't have access to make admin"})
            }
            // const filter = {email: admin.email} 
            // const updateDoc = {$set: {role: "admin"}}
            // const result = await userCollection.updateOne(filter, updateDoc)
            // res.json(result)
        });

        // get method to check admin 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email 
            // console.log(email)
            const query = {email: email}
            const result = await userCollection.findOne(query)
            let isAdmin = false 
            if(result?.role === 'admin'){
                isAdmin = true 
            }
            res.json({admin: isAdmin})
        })

        // payment related server site code  find pay order id 
        app.get('/appointmentorders/:id', async (req, res) => {
            const payId = req.params.id
            const query = {_id: ObjectId(payId)}
            const result = await appointmentOrderCollection.findOne(query)
            res.json(result)
        })

        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100; 

            const paymentIntent = await stripe.paymentIntents.create({
                currency : 'usd',
                amount : amount,
                payment_method_types: ['card']
            });

            res.json({clientSecret: paymentIntent.client_secret});
        })

        app.put('/appointmentorders/:id', async (req, res) => {
            const paymentId = req.params.id 
            const paymentData = req.body 
            const filter = {_id: ObjectId(paymentId)}
            const updateDoc = {
                $set: {payment: paymentData}
            }

            const result = await appointmentOrderCollection.updateOne(filter, updateDoc)

            res.json(result)
        })

       
    }finally{
        // await client.close()
    }
}
run().catch(console.dir)
app.get('/', (req, res) => {
    res.send("doctors portal server")
})

app.listen(port, () => {
    console.log("doctors portal server port", port)
})
