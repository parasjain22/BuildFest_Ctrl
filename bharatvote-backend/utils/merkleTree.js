const { MerkleTree } = require('merkletreejs');
const crypto = require('crypto');

/**
 * SHA-256 hash function for Merkle tree.
 */
const sha256 = (data) => {
    return crypto.createHash('sha256').update(data).digest();
};

/**
 * Build a Merkle tree from an array of leaf hashes (hex strings).
 */
const buildMerkleTree = (leaves) => {
    const leafBuffers = leaves.map((leaf) => Buffer.from(leaf, 'hex'));
    const tree = new MerkleTree(leafBuffers, sha256, { sortPairs: true });
    return tree;
};

/**
 * Get the Merkle root as a hex string.
 */
const getMerkleRoot = (leaves) => {
    if (!leaves || leaves.length === 0) return null;
    const tree = buildMerkleTree(leaves);
    return tree.getRoot().toString('hex');
};

/**
 * Verify that a leaf is included in the Merkle tree.
 */
const verifyLeaf = (leaf, leaves) => {
    if (!leaves || leaves.length === 0) return false;
    const tree = buildMerkleTree(leaves);
    const leafBuffer = Buffer.from(leaf, 'hex');
    const proof = tree.getProof(leafBuffer);
    return tree.verify(proof, leafBuffer, tree.getRoot());
};

/**
 * Generate a leaf hash from vote data.
 * leaf = sha256(encrypted_vote_blob + session_id)
 */
const generateLeafHash = (encryptedVoteBlob, sessionId) => {
    return crypto.createHash('sha256').update(encryptedVoteBlob + sessionId).digest('hex');
};

module.exports = { buildMerkleTree, getMerkleRoot, verifyLeaf, generateLeafHash };
