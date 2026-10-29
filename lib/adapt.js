module.exports = (h) => async (req, res) => {
  try {
    const r = await h({ queryStringParameters: req.query || {} });
    res.statusCode = r.statusCode || 200;
    for (const k in r.headers || {}) res.setHeader(k, r.headers[k]);
    res.end(r.isBase64Encoded ? Buffer.from(r.body, "base64") : r.body);
  } catch (e) {
    res.statusCode = 500;
    res.end(String(e));
  }
};
