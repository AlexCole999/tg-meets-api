const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

module.exports = s3;

