const IpfsHttpClient = require('ipfs-http-client');
const { globSource } = IpfsHttpClient;
import CrustPinner from '@crustio/crust-pin';

/**
 * 
 * @param folderPath Site files path
 * @returns IPFS CID
 */
async function pin(path: string): Promise<string> {
    // 1. Create IPFS client
    const ipfs = IpfsHttpClient();

    // 2. Pin it
    const { cid } = await ipfs.add(globSource(path, { recursive: true }));

    return cid;
}

/**
 * 
 * @param cid IPFS cid
 */
async function publish(cid: string) {
    console.log(process.env.CRUST_SEEDS, cid);
    // 1. Create CrustPinner
    const crustPinner = new CrustPinner(process.env.CRUST_SEEDS);
    
    // 2. Publish to Crust
    await crustPinner.pin(cid);
}

async function main(path: string) {
    const cid = await pin(path);

    if (cid) {
        await publish(cid);
    }
}

main('./build/');

