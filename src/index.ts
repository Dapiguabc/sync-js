/* eslint-disable @typescript-eslint/ban-types */
import Graceful from "@ladjs/graceful";
import path from "path";
import Bree from "bree";
import Koa from "koa";
import Router from "@koa/router";
import KoaBodyParse from "koa-bodyparser";
import SqlClient from "./sql.js";
import { ConfigRow } from "./shim.d.js"
import fs from "fs";
import logger from "./log.js";
import cors from "koa2-cors";

const Root = path.resolve(process.env.ROOT || 'build');
const databasePath = path.join(Root, 'database');
const JobPath = path.join(path.resolve(process.env.ROOT || 'build'), "jobs");
const breelogger = logger.scope("bree scope");
const koalogger = logger.scope("koa scope");


interface JobOptions {
  name?: string | undefined;
  path?: string | (() => void) | undefined;
  timeout?: number | string | boolean | undefined;
  interval?: number | string | undefined;
  date?: Date | undefined;
  cron?: string | undefined;
  hasSeconds?: boolean | undefined;
  cronValidate?: object | undefined;
  closeWorkerAfterMs?: number | undefined;
  worker?: object | undefined;
  outputWorkerMetadate?: boolean | undefined;
}

interface JobItem extends ConfigRow{
  run?: boolean;
}

// define a middleware to unified response data format.
function routerResponse(){
  return async function(ctx: Koa.Context, next: Koa.Next){
      ctx.success = function (data?: Record<string, string | number | object>) {
          ctx.type = "json"
          ctx.body = {
              code: 200,
              success: true,
              msg: "success",
              data: data || null
          }
          koalogger.log(ctx.method, ctx.url);
      }
      ctx.fail = function (code: number, msg: string) {
          ctx.type = "json"
          ctx.body = {
              code: code || 201,
              success: false,
              msg: msg || 'fail',
          }
          koalogger.log(ctx.method, ctx.url);
      }
      await next();
  }
}

// create JobOptions[] from the data load from sqlite.
function createJobs(jobConfig: ConfigRow[]): JobOptions[]{
  const jobs = jobConfig.filter(row => row.status ===  1).map((row) => {
    switch(row.type) {
      case "token": 
        return {
          name: row.name,
          path: path.join(path.resolve(JobPath), "token.js"),
          cron: row.cron,
          worker: {
            workerData: {
              db: path.join(databasePath, row.db),
              canisterId: row.canisterId,
            }
          }
        }
      case "token-registry":
        return {
          name: row.name,
          path: path.join(path.resolve(JobPath), "registry.js"),
          cron: row.cron,
          worker: {
            workerData: {
              db: path.join(databasePath, row.db),
              canisterId: row.canisterId,
            }
          }
        }
      case "dswap-storage":
        return {
          name: row.name,
          path: path.join(path.resolve(JobPath), "dswap.js"),
          cron: row.cron,
          worker: {
            workerData: {
              db: path.join(databasePath, row.db),
              canisterId: row.canisterId,
            }
          }
        }  
    }
  });
  return jobs; 
}

(async () => {
    const isexist = fs.existsSync(databasePath);
    if(!isexist){
      try{
        fs.mkdirSync(databasePath);
      } catch {
        throw new Error("Create database directory failed");
      }
    }

    const sqlClient = SqlClient.createSqlClient(path.join(databasePath, "config.db"));
    sqlClient.init();
    const jobData = sqlClient.all<ConfigRow>("select * from job_config");

    const bree = new Bree({
      // <https://cabinjs.com>
      logger: breelogger,
      root: JobPath,
      jobs: createJobs(jobData),
      hasSeconds: true,
      errorHandler: (error, workerMetadata) => {
        if (workerMetadata.threadId) {
          breelogger.info(`There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`)
        } else {
          breelogger.info(`There was an error while running a worker ${workerMetadata.name}`)
        }
        breelogger.error(error);
      }
    });

    bree.on('worker created', (name) => {
      breelogger.start('job started', name);
      const job = jobData.find(x => x.name = name);
      const [ok, err] = sqlClient.run(`UPDATE job_config SET status = 2 WHERE name = '${job.name}' `);
      if(!ok){
        breelogger.error(err);
      }
    });
    
    bree.on('worker deleted', (name) => {
      breelogger.complete('job completed', name);
      const job = jobData.find(x => x.name = name);
      const [ok, err] = sqlClient.run(`UPDATE job_config SET status = 1 WHERE name = '${job.name}' `);
      if(!ok){
        breelogger.error(err);
      }
    });

    // handle graceful reloads, pm2 support, and events like SIGHUP, SIGINT, etc.
    const graceful = new Graceful({ brees: [bree] });
    graceful.listen();

    // start all jobs (this is the equivalent of reloading a crontab):
    bree.start();
  
    // create a http server to export the apis to manage and schedule your tasks.
    const app = new Koa();
    
    // unified response data.
    app.use(routerResponse());
    app.use(KoaBodyParse());
    // enable corsss domain.
    app.use(cors({
      maxAge: 5,
      credentials: true, 
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
      allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    }));

    const router = new Router({
      prefix: '/api/job'
    });


    // Get all jobs
    // todo: add total and pagnation
    router.get('/', async (ctx) => {
      // 4: job is deleted
      const jobs = sqlClient.all<ConfigRow>("select * from job_config where status != 4");
      ctx.success(jobs);
    });

    // Start all jobs
    router.get('/start', async (ctx) => {
      bree.start();
      const [ok, err] = sqlClient.run(`UPDATE job_config SET status = 1`);
      if(!ok){
        ctx.fail(202, err);
        return;
      }
      ctx.success();
    });

    // Start a job
    router.get('/start/:name', (ctx) => {
      bree.start(ctx.params.name);
      const [ok, err] = sqlClient.run(`UPDATE job_config SET status = 1 WHERE name = '${ctx.params.name}' `);
      if(!ok){
        ctx.fail(202, err);
        return;
      }
      ctx.success();
    });

    // run all jobs
    router.get('/run', (ctx) => {
      bree.run();
      ctx.success();
    });

    // run a job
    router.get('/run/:name', (ctx) => {
      bree.run(ctx.params.name);
      ctx.success();
    });

    // stop a job
    router.get('/stop/:name', (ctx) => {
      bree.stop(ctx.params.name);
      const [ok, err] = sqlClient.run(`UPDATE job_config SET status = 0 WHERE name = '${ctx.params.name}' `);
      if(!ok){
        ctx.fail(202, err);
        return;
      }
      ctx.success();
    });

    // Add a job
    router.post('/add', (ctx) => {
      try{
        const job: JobItem = ctx.request.body;
        const res = sqlClient.run(`INSERT INTO job_config (name, canisterId, type, db, cron, desc, status)
        VALUES ('${job.name}','${job.canisterId}','${job.type}','${job.db}','${job.cron}','${job.desc}','${job.status}')`);
        if(!res[0]){
          ctx.fail(201, res[1]);
          return;
        }
        bree.add(createJobs([job]));
        bree.start(job.name);
        if(job.run){
          bree.run(job.name);
        }
        ctx.success();
      } catch(e) {
        ctx.fail(202, e.message);
      }
    });

    // remove a jjob
    router.get('/remove/:name', (ctx) => {
      bree.remove(ctx.params.name);
      const [ok, err] = sqlClient.run(`UPDATE job_config SET status = 4 WHERE name = '${ctx.params.name}' `);
      if(!ok){
        ctx.fail(202, err);
        return;
      }
      ctx.success();
    });
    app.use(router.routes());
    app.use(router.allowedMethods());
    app.listen(process.env.KOA_PORT || 6300,()=>{
      koalogger.success(`Server running at http://0.0.0.0:${process.env.KOA_PORT || 6300}`);
    });

    // update a job
    // router.post('/update/:name', (ctx, next) => {
      
    // });
})();