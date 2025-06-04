import express from "express";
const app = express();
app.get("/",(req,res)=>res.send("hello world"));
app.get("/cpu",(req,res)=>{
    for(let i= 0; i< 10000000; i++){
        Math.random();
    }
    res.send("Hello World");
})

app.listen(3000) 
