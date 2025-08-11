import axios from "axios";
import { encryptHybrid /*, decryptHybrid */ } from "./cryptoHelper.js";

export default function makeICICIClient(cfg) {
  const { baseUrl, apikey, partnerId, bankPublicKeyPem } = cfg;

  const http = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      apikey,
      ...(partnerId ? { "x-partner-id": partnerId } : {})
    }
  });

  async function callEncrypted(path, body) {
    const enc = encryptHybrid(body, bankPublicKeyPem);
    const req = { encSessionKey: enc.encSessionKey, encryptedData: enc.encryptedData };
    const { data } = await http.post(path, req);
    // If encrypted back: return decryptHybrid(data, OUR_PRIVATE_KEY_PEM)
    return data;
  }

  return {
    // NOTE: Replace paths with exact ones from ICICI docs
    browsePlans: (mobile) =>
      callEncrypted("/mobile-recharge/browse-plans", { mobile }),
    validate: (mobile, amount, operatorCode, circleName, extra = {}) =>
      callEncrypted("/mobile-recharge/validate", {
        mobile, amount, operatorCode, circleName, ...extra
      }),
    recharge: (mobile, amount, operatorCode, circleName, refId) =>
      callEncrypted("/mobile-recharge/recharge", {
        mobile, amount, operatorCode, circleName, refId
      }),
    status: (refId) =>
      callEncrypted("/mobile-recharge/status", { refId })
  };
}
