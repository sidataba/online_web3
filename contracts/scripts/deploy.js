const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy SimpleStorage
  console.log("📦 Deploying SimpleStorage...");
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();
  await simpleStorage.waitForDeployment();
  const simpleStorageAddress = await simpleStorage.getAddress();
  console.log("✅ SimpleStorage deployed to:", simpleStorageAddress, "\n");

  // Deploy MyNFT
  console.log("📦 Deploying MyNFT...");
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy(deployer.address);
  await myNFT.waitForDeployment();
  const myNFTAddress = await myNFT.getAddress();
  console.log("✅ MyNFT deployed to:", myNFTAddress, "\n");

  // Deploy DAppToken
  console.log("📦 Deploying DAppToken...");
  const DAppToken = await hre.ethers.getContractFactory("DAppToken");
  const dappToken = await DAppToken.deploy(deployer.address);
  await dappToken.waitForDeployment();
  const dappTokenAddress = await dappToken.getAddress();
  console.log("✅ DAppToken deployed to:", dappTokenAddress, "\n");

  // Deploy TokenStaking
  console.log("📦 Deploying TokenStaking...");
  const TokenStaking = await hre.ethers.getContractFactory("TokenStaking");
  const tokenStaking = await TokenStaking.deploy(dappTokenAddress, dappTokenAddress, deployer.address);
  await tokenStaking.waitForDeployment();
  const tokenStakingAddress = await tokenStaking.getAddress();
  console.log("✅ TokenStaking deployed to:", tokenStakingAddress, "\n");

  // Deploy NFTMarketplace
  console.log("📦 Deploying NFTMarketplace...");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy(deployer.address);
  await nftMarketplace.waitForDeployment();
  const nftMarketplaceAddress = await nftMarketplace.getAddress();
  console.log("✅ NFTMarketplace deployed to:", nftMarketplaceAddress, "\n");

  // Deploy DAO
  console.log("📦 Deploying DAO...");
  const DAO = await hre.ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(dappTokenAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("✅ DAO deployed to:", daoAddress, "\n");

  // Deploy SimpleSwap
  console.log("📦 Deploying SimpleSwap...");
  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy();
  await simpleSwap.waitForDeployment();
  const simpleSwapAddress = await simpleSwap.getAddress();
  console.log("✅ SimpleSwap deployed to:", simpleSwapAddress, "\n");

  // Deploy TokenVesting
  console.log("📦 Deploying TokenVesting...");
  const TokenVesting = await hre.ethers.getContractFactory("TokenVesting");
  const tokenVesting = await TokenVesting.deploy(dappTokenAddress, deployer.address);
  await tokenVesting.waitForDeployment();
  const tokenVestingAddress = await tokenVesting.getAddress();
  console.log("✅ TokenVesting deployed to:", tokenVestingAddress, "\n");

  // Deploy BatchTransaction
  console.log("📦 Deploying BatchTransaction...");
  const BatchTransaction = await hre.ethers.getContractFactory("BatchTransaction");
  const batchTransaction = await BatchTransaction.deploy();
  await batchTransaction.waitForDeployment();
  const batchTransactionAddress = await batchTransaction.getAddress();
  console.log("✅ BatchTransaction deployed to:", batchTransactionAddress, "\n");

  // Deploy P2PEscrow
  console.log("📦 Deploying P2PEscrow...");
  const P2PEscrow = await hre.ethers.getContractFactory("P2PEscrow");
  const p2pEscrow = await P2PEscrow.deploy();
  await p2pEscrow.waitForDeployment();
  const p2pEscrowAddress = await p2pEscrow.getAddress();
  console.log("✅ P2PEscrow deployed to:", p2pEscrowAddress, "\n");

  // Log deployment info
  console.log("📋 Deployment Summary:");
  console.log("=======================");
  console.log("SimpleStorage:", simpleStorageAddress);
  console.log("MyNFT:", myNFTAddress);
  console.log("DAppToken:", dappTokenAddress);
  console.log("TokenStaking:", tokenStakingAddress);
  console.log("NFTMarketplace:", nftMarketplaceAddress);
  console.log("DAO:", daoAddress);
  console.log("SimpleSwap:", simpleSwapAddress);
  console.log("TokenVesting:", tokenVestingAddress);
  console.log("BatchTransaction:", batchTransactionAddress);
  console.log("P2PEscrow:", p2pEscrowAddress);
  console.log("Network:", hre.network.name);
  console.log("=======================\n");

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      SimpleStorage: simpleStorageAddress,
      MyNFT: myNFTAddress,
      DAppToken: dappTokenAddress,
      TokenStaking: tokenStakingAddress,
      NFTMarketplace: nftMarketplaceAddress,
      DAO: daoAddress,
      SimpleSwap: simpleSwapAddress,
      TokenVesting: tokenVestingAddress,
      BatchTransaction: batchTransactionAddress,
      P2PEscrow: p2pEscrowAddress
    }
  };

  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
