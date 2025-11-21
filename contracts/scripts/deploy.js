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

  // Log deployment info
  console.log("📋 Deployment Summary:");
  console.log("=======================");
  console.log("SimpleStorage:", simpleStorageAddress);
  console.log("MyNFT:", myNFTAddress);
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
      MyNFT: myNFTAddress
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
