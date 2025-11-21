import { create } from 'ipfs-http-client';
import dotenv from 'dotenv';

dotenv.config();

let ipfsClient = null;

/**
 * Get IPFS client instance
 */
export const getIPFSClient = () => {
  if (!ipfsClient) {
    // Use Infura IPFS if credentials provided, otherwise use public gateway
    if (process.env.INFURA_IPFS_PROJECT_ID && process.env.INFURA_IPFS_SECRET) {
      const auth = 'Basic ' + Buffer.from(
        process.env.INFURA_IPFS_PROJECT_ID + ':' + process.env.INFURA_IPFS_SECRET
      ).toString('base64');

      ipfsClient = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
          authorization: auth,
        },
      });
    } else {
      // Fallback to local IPFS node or public gateway
      ipfsClient = create({
        host: process.env.IPFS_HOST || 'localhost',
        port: process.env.IPFS_PORT || 5001,
        protocol: process.env.IPFS_PROTOCOL || 'http'
      });
    }

    console.log('✅ IPFS Client initialized');
  }

  return ipfsClient;
};

/**
 * Upload data to IPFS
 */
export const uploadToIPFS = async (data) => {
  try {
    const client = getIPFSClient();
    const result = await client.add(data);
    return {
      cid: result.path,
      url: `https://ipfs.io/ipfs/${result.path}`
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
};

/**
 * Upload JSON to IPFS
 */
export const uploadJSONToIPFS = async (jsonData) => {
  const data = JSON.stringify(jsonData);
  return uploadToIPFS(data);
};

/**
 * Get IPFS gateway URL
 */
export const getIPFSUrl = (cid) => {
  return `https://ipfs.io/ipfs/${cid}`;
};
