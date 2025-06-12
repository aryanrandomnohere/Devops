import Express, { type NextFunction, type Request, type Response } from "express";
import client from 'prom-client'
import cors from 'cors'
const requestCounter = new client.Counter({
    name:'http_request_total',
    help:"Getting Http server request state",
    labelNames:['method','route','status_code']
})
const requestBucket = new client.Histogram({
    name:'http_request_time_taken',
    help:'tracks which end point took how many seconds',
    labelNames:['method','status_code','route'],
    buckets:[0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000]
})
const activeRequest = new client.Gauge({
    name:"Active_Http_Requests",
    help:"Tracks the number of active requests", 
})
function middleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    activeRequest.inc();
    res.on('finish', () => {
        const route = req.route?.path || req.path || req.url;
        console.log(`Time it took is ${Date.now() - startTime} ms for method ${req.method} for route ${route}`);
        
        requestCounter.inc({
            method: req.method,
            route,
            status_code: res.statusCode
        });
           requestBucket.observe({
        method:req.method,
        status_code:res.statusCode,
        route
         },Date.now() - startTime)
         activeRequest.dec();
    });
 

    next();
}

const app = Express();
app.use(Express.json());
app.use(middleware);
app.use(cors())
app.get('/',middleware,(req,res)=>{
    console.log("Simple bun app is working 2")
    res.send("Hello World  ")
})

app.get('/cpu', async (req:Request,res:Response)=>{
    await new Promise((resolve)=> setTimeout(resolve, 1000*Math.random()))
    res.send("/cpu end point hit")
})
app.get('/user/:userId', (req:Request,res:Response)=>{
    res.send(`/user end point hit with ${req.params.userId}`)
})
app.get('/metrics',async (req,res)=>{
const metrics = await client.register.metrics();
res.set('Content-Type', client.register.contentType)
res.end(metrics);
})

app.listen(3000,()=>{
    console.log("Server listening on port 80")
})