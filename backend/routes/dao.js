import express from 'express';
import { getProposals, getProposal, checkVote } from '../controllers/daoController.js';

const router = express.Router();

router.get('/proposals/:contractAddress', getProposals);
router.get('/proposal/:contractAddress/:proposalId', getProposal);
router.get('/vote/:contractAddress/:proposalId/:userAddress', checkVote);

export default router;
