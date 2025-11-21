import { uploadToIPFS, uploadJSONToIPFS, getIPFSUrl } from '../utils/ipfsClient.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Upload file to IPFS
 */
export const uploadFile = async (req, res, next) => {
  try {
    const { data } = req.body;

    if (!data) {
      throw new AppError('No data provided', 400);
    }

    const result = await uploadToIPFS(data);

    res.json({
      success: true,
      cid: result.cid,
      url: result.url
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload JSON metadata to IPFS
 */
export const uploadMetadata = async (req, res, next) => {
  try {
    const { name, description, image, attributes } = req.body;

    if (!name) {
      throw new AppError('Name is required', 400);
    }

    const metadata = {
      name,
      description: description || '',
      image: image || '',
      attributes: attributes || []
    };

    const result = await uploadJSONToIPFS(metadata);

    res.json({
      success: true,
      cid: result.cid,
      url: result.url,
      metadata
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get IPFS content URL
 */
export const getIPFSContent = async (req, res, next) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      throw new AppError('CID is required', 400);
    }

    const url = getIPFSUrl(cid);

    res.json({
      cid,
      url,
      gateways: [
        `https://ipfs.io/ipfs/${cid}`,
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`
      ]
    });
  } catch (error) {
    next(error);
  }
};
