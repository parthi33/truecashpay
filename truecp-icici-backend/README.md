# True Cash Pay – ICICI Recharge Backend (UAT)
1) Copy `.env.example` to `.env` and fill values.
2) Install deps: `npm install`
3) Run: `npm start` (local) or `pm2 start src/server.js --name truecp-icici` (server)

Expose HTTPS (prod: 443 via Nginx/Caddy). Use exact API paths from ICICI portal docs.
