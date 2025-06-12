import Express, { type NextFunction, type Request, type Response } from "express";
import client from 'prom-client'

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
function middleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

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
    });
 

    next();
}

const app = Express();
app.use(Express.json());
app.use(middleware);
app.get('/',middleware,(req,res)=>{
    console.log("Simple bun app is working 2")
    res.send("Hello World")
})

app.get('/cpu', middleware, (req:Request,res:Response)=>{
    for(let i = 0;i< Math.random()*1000 ;i++){
        i++;
    }
    res.send("/cpu end point hit")
})
app.get('/user', middleware, (req:Request,res:Response)=>{
    res.send("/user end point hit")
})
app.get('/metrics',async (req,res)=>{
const metrics = await client.register.metrics();
res.set('Content-Type', client.register.contentType)
res.end(metrics);
})

app.listen(80,()=>{
    console.log("Server listening on port 80")
})