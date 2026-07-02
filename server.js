import express from 'express';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {Server} from 'socket.io';




import http from 'http'

dotenv.config()


const app = express()
const PORT = process.env.PORT


const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
            // method: ['GET', 'POST']
        }
})



app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(fileUpload())


app.get('/', (req, res) => {
    res.send('ok')
})


const MONGO_URL = process.env.MONGO_URL

mongoose.connect(MONGO_URL).then(() => {
    httpServer.listen(PORT, () => console.log(`Server running on port: ${PORT}`)
    )
}).catch(error => {
    console.log(error); 
})