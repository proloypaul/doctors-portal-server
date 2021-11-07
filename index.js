const express = require('express')
const app = express()
const port = process.env.PORT || 3800

app.get('/', (req, res) => {
    res.send("doctors portal server")
})

app.listen(port, () => {
    console.log("doctors portal server port", port)
})