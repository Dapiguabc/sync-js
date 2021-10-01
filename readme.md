<h1 align="center">
  Dfinance-sync
</h1>

<h4 align="center">
  👋 Sync data from canister.
</h4>

## Description

Dfinance-sync is a backend server written in js to sync data from some canister and exports apis to manage
these schedule jobs. You can find a management page at [here](https://github.com/Dapiguabc/sync-web) or a [demo](http://150.158.167.68:5000/jobs).


## Web Management Page

## Install

```bash
git clone https://github.com/Dapiguabc/sync-js
cd sync-js
npm install
```

## Useage

### develop

```bash
npm run start:dev
```

### deploy

modify the ```.env``` file

```bash
ROOT=build // the root path, default build  if not set
ICP_HOST=https://ic0.app/  // canister host, default https://ic0.app/  if not set
KOA_PORT=6300  // the port of the koa server, default 6300 if not set
```
start your server

```bash
npm run start:prod
```











