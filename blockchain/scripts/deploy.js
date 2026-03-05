const hre = require("hardhat");

async function main() {
    console.log("[Pro Layer] Deploying ModelRegistry to local blockchain...");

    const ModelRegistry = await hre.ethers.getContractFactory("ModelRegistry");
    const registry = await ModelRegistry.deploy();

    await registry.waitForDeployment();

    const address = await registry.getAddress();
    console.log(`[Pro Layer] ModelRegistry deployed to: ${address}`);

    // Write the address to a file so the Node.js backend can read it
    const fs = require("fs");
    const path = require("path");
    const deployData = {
        address: address,
        network: "localhost",
        timestamp: new Date().toISOString()
    };

    const outputPath = path.resolve(__dirname, "../deployed_address.json");
    fs.writeFileSync(outputPath, JSON.stringify(deployData, null, 2));
    console.log(`[Pro Layer] Contract address saved to: ${outputPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
