import forge from "node-forge";

export function encryptHybrid(jsonObj, bankPublicKeyPem) {
  const payload = JSON.stringify(jsonObj);

  // Random 128-bit AES key + IV (16 bytes each)
  const aesKey = forge.random.getBytesSync(16);
  const iv = forge.random.getBytesSync(16);

  // AES-CBC encrypt payload
  const cipher = forge.cipher.createCipher("AES-CBC", aesKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(payload, "utf8"));
  cipher.finish();
  const encryptedData = forge.util.encode64(cipher.output.getBytes());

  // RSA encrypt (AES key + IV) with bank public key
  const rsa = forge.pki.publicKeyFromPem(bankPublicKeyPem);
  const sessionBlob = aesKey + iv; // 32 bytes
  const encSessionKey = forge.util.encode64(
    rsa.encrypt(sessionBlob, "RSAES-PKCS1-V1_5")
  );

  return { encryptedData, encSessionKey };
}

export function decryptHybrid(resp, ourPrivateKeyPem) {
  // Use only if responses are encrypted (many sandboxes return plain JSON)
  const priv = forge.pki.privateKeyFromPem(ourPrivateKeyPem);
  const session = priv.decrypt(
    forge.util.decode64(resp.encSessionKey),
    "RSAES-PKCS1-V1_5"
  );
  const aesKey = session.slice(0, 16);
  const iv = session.slice(16, 32);

  const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
  decipher.start({ iv });
  decipher.update(
    forge.util.createBuffer(forge.util.decode64(resp.encryptedData))
  );
  const ok = decipher.finish();
  if (!ok) throw new Error("Decrypt failed");
  return JSON.parse(decipher.output.toString("utf8"));
}
