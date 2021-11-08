const express = require('express')
const { MongoClient } = require('mongodb');
var cors = require('cors')
require('dotenv').config()
const app = express()

app.use(cors())
app.use(express.json())

const port = process.env.PORT || 3800


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e3dsx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri)
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
        app.get('/appointmentorders', async (req, res) => {
            const email = req.query.email 
            console.log( "user email", email)
            const query = {email: email}
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


// import React from "react";
// import isWeekend from "date-fns/isWeekend";
// import TextField from "@mui/material/TextField";
// import AdapterDateFns from "@mui/lab/AdapterDateFns";
// import LocalizationProvider from "@mui/lab/LocalizationProvider";
// import StaticDatePicker from "@mui/lab/StaticDatePicker";

// const Calender = ({ date, setDate }) => {
//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns}>
//       <StaticDatePicker
//         displayStaticWrapperAs="desktop"
//         value={date}
      
//  <LocalizationProvider dateAdapter={AdapterDateFns}>
//       <StaticDatePicker
//         displayStaticWrapperAs="desktop"
//         value={date}
//         onChange={(newValue) => {
//           setDate(newValue);
//         }}
//         renderInput={(params) => <TextField {...params} />}
//       />
//     </LocalizationProvider>