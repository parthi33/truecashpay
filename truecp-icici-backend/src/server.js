import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import makeICICIClient from "./iciciClient.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(morgan("tiny"));

const cfg = {
  baseUrl: process.env.ICICI_BASE_URL,
  apikey: process.env.ICICI_APIKEY,
  partnerId: process.env.ICICI_PARTNER_ID || "",
  bankPublicKeyPem: process.env.ICICI_PUBLIC_KEY_PEM
};
const icici = makeICICIClient(cfg);

// Health
app.get("/health", (_req, res) => res.json({ ok: true, service: "truecp-icici-backend" }));

// 1) Plans
app.post("/api/plans", async (req, res) => {
  try {
    const { mobile } = req.body;
    const data = await icici.browsePlans(mobile);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// 2) Validate
app.post("/api/validate", async (req, res) => {
  try {
    const { mobile, amount, operatorCode, circleName, isBSNL = false, extra = {} } = req.body;
    const data = await icici.validate(
      mobile, amount, operatorCode, circleName,
      isBSNL ? { ...extra } : extra
    );
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// 3) Recharge
app.post("/api/recharge", async (req, res) => {
  try {
    const { mobile, amount, operatorCode, circleName } = req.body;
    const refId = "TCP" + Date.now(); // TODO: persist in DB
    const data = await icici.recharge(mobile, amount, operatorCode, circleName, refId);
    res.json({ ok: true, refId, data });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// 4) Status
app.get("/api/status/:refId", async (req, res) => {
  try {
    const data = await icici.status(req.params.refId);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("TRUECP ICICI backend up on port", port);
});
