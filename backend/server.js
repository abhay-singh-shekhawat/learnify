import 'dotenv/config';
import app from "./app.js"
import {connect} from "./src/db/connect.js"


connect();
const port = process.env.PORT || 5000

app.listen(port ,"0.0.0.0", ()=>{
    console.log(`app is running on http://localhost:${port}`);
})

