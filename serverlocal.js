const express = require('express');
const morgan = require('morgan');
const app = express(),
      bodyParser = require("body-parser");
      port = 3072;

const cors = require('cors');



require('dotenv').config()

app.use(cors({
  origin: '*'
}));



app.use(bodyParser.json());
app.use(express.static(process.cwd() + '/my-app/dist'));
app.use(morgan('dev'))

app.use('/api/v1', require('./app/routes'))

//const { Collections } = require('./app/graphql/dataPostgresql')


app.listen(port, () => {  
    // console.log(`Server listening on the port::${port}`);
});
