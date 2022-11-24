const express = require('express');
const cors = require('cors');
require('dotenv').config();

//MiddleWare
app.use(cors());
app.use(express.json());


const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('TV Shop server is running')
})

app.listen(port, () => {
  console.log(`TV Shop server is listening on port ${port}`)
})