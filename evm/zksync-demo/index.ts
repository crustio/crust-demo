const { ethers } = require("ethers");
import { Wallet, Provider } from "zksync-web3";

// Base
const ABI = `[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"customer","type":"address"},{"indexed":false,"internalType":"address","name":"merchant","type":"address"},{"indexed":false,"internalType":"string","name":"cid","type":"string"},{"indexed":false,"internalType":"uint256","name":"size","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"},{"indexed":false,"internalType":"bool","name":"isPermanent","type":"bool"}],"name":"Order","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"inputs":[{"internalType":"address","name":"nodeAddress","type":"address"}],"name":"addOrderNode","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getNodesNumber","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"size","type":"uint256"},{"internalType":"bool","name":"isPermanent","type":"bool"}],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"nodeArray","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nodes","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"cid","type":"string"},{"internalType":"uint256","name":"size","type":"uint256"},{"internalType":"bool","name":"isPermanent","type":"bool"}],"name":"placeOrder","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"cid","type":"string"},{"internalType":"uint256","name":"size","type":"uint256"},{"internalType":"address","name":"nodeAddress","type":"address"},{"internalType":"bool","name":"isPermanent","type":"bool"}],"name":"placeOrderWithNode","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"priceOracle","outputs":[{"internalType":"contract IPriceOracle","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"nodeAddress","type":"address"}],"name":"removeOrderNode","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"priceOracleAddress","type":"address"}],"name":"setPriceOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"}]`
const CONTRACT_ADDRESS = " 0xf8e6F7bb144D3475fcf39Bd879510Fa93C775ee2";
const CHAIN_URL = "https://mainnet.era.zksync.io";
const ZKSYNC_NETWORK = "mainnet";
const PRIVATE_KEY = "0xxxxxxxxxxxxxxxxxxxxxxxxxxxx";

// File infomation
const fileCid = "QmTWBmGaUhEEusN5cftWFWjcegbfd9KftRND9EdsZrUvh2";
const fileSize = 44358;
const isPermanentStorage = false; // false means 6 months storage

async function main() {
    const zkSyncProvider = new Provider(CHAIN_URL);
    const ethereumProvider = ethers.getDefaultProvider(ZKSYNC_NETWORK);
    const zkWallet = new Wallet(PRIVATE_KEY, zkSyncProvider, ethereumProvider);

    const storeContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        zkWallet
    );

    console.log("Get the file storage fee");
    const price = await storeContract.getPrice(fileSize, isPermanentStorage);
    console.log("Fee: " + price + " wei");

    console.log("Place storge order");
    const tx = await storeContract.placeOrder(fileCid, fileSize, isPermanentStorage, { value: price });
    await tx.wait();
    console.log("Done this");
}

(async () => {
    await main();
})().catch(e => {
    console.error(e);
});
