import fs from 'fs';
import path from 'path';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { typesBundleForPolkadot } from '@crustio/type-definitions';
import { KeyPair } from 'near-api-js';
import { Keyring } from '@polkadot/keyring';
import { u8aToHex } from '@polkadot/util'

const crustChainEndpoint = 'wss://rpc.crust.network'; // More endpoints: https://github.com/crustio/crust-apps/blob/master/packages/apps-config/src/endpoints/production.ts#L9
const ipfsW3GW = 'https://crustipfs.xyz'; // More web3 authed gateways: https://github.com/crustio/ipfsscan/blob/main/lib/constans.ts#L29
const crustSeeds = 'xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx'; // Create account(seeds): https://wiki.crust.network/docs/en/crustAccount
const api = new ApiPromise({
    provider: new WsProvider(crustChainEndpoint),
    typesBundle: typesBundleForPolkadot,
});

main();

async function main() {
    // I. Upload file to IPFS
    // 1. Read file
    const filePath = 'sampleFile.txt';
    const fileContent = await fs.readFileSync(path.resolve(__dirname, filePath));

    // 2. [Local] Create IPFS instance
    const ipfsLocal = await create({ url: 'http://localhost:5001' });

    // 2. [Gateway] Create IPFS instance
    // 1. get authheader 
    const keyPair = KeyPair.fromRandom('ed25519');
    // get address
    const addressRaw = keyPair.getPublicKey().toString();
    const address = addressRaw.substring(8);
    // get singature 
    const {signature} = keyPair.sign(Buffer.from(address));
    const sig = u8aToHex(signature).substring(2);
    // Authorization: Bear <base64(ChainType-PubKey:SignedMsg)>
    // compile a authHeader
    const authHeaderRaw = `near-${address}:${sig}`;
    const authHeader = Buffer.from(authHeaderRaw).toString('base64');
    const ipfsRemote = create({
        url: `${ipfsW3GW}/api/v0`,
        headers: {
            authorization: `Basic ${authHeader}`
        }
    });

    // 3. Add IPFS
    const rst = await addFile(ipfsRemote, fileContent); // Or use IPFS local
    console.log(rst);

    // II. Place storage order
    await placeStorageOrder(rst.cid, rst.size);
    // III. [OPTIONAL] Add prepaid
    // Learn what's prepard for: https://wiki.crust.network/docs/en/DSM#3-file-order-assurance-settlement-and-discount
    const addedAmount = 100; // in pCRU, 1 pCRU = 10^-12 CRU
    await addPrepaid(rst.cid, addedAmount);

    // IV. Query storage status
    // Query forever here ...
    while (true) {
        const orderStatus: any = (await getOrderState(rst.cid)).toJSON();
        console.log('Replica count: ', orderStatus['reported_replica_count']); // Print the replica count
        await new Promise(f => setTimeout(f, 1500)); // Just wait 1.5s for next chain-query
    }
}

async function addFile(ipfs: IPFSHTTPClient, fileContent: any) {
    // 1. Add file to ipfs
    const cid = await ipfs.add(fileContent);

    // 2. Get file status from ipfs
    const fileStat = await ipfs.files.stat("/ipfs/" + cid.path);

    return {
        cid: cid.path,
        size: fileStat.cumulativeSize
    };
}

async function placeStorageOrder(fileCid: string, fileSize: number) {
    // 1. Construct place-storage-order tx
    const tips = 0;
    const memo = '';
    await api.isReadyOrError;
    const tx = api.tx.market.placeStorageOrder(fileCid, fileSize, tips, memo);

    // 2. Load seeds(account)
    const kr = new Keyring({ type: 'sr25519' });
    const krp = kr.addFromUri(crustSeeds);

    // 3. Send transaction
    return new Promise((resolve, reject) => {
        tx.signAndSend(krp, ({events = [], status}) => {
            console.log(`💸  Tx status: ${status.type}, nonce: ${tx.nonce}`);

            if (status.isInBlock) {
                events.forEach(({event: {method, section}}) => {
                    if (method === 'ExtrinsicSuccess') {
                        console.log(`✅  Place storage order success!`);
                        resolve(true);
                    }
                });
            } else {
                // Pass it
            }
        }).catch(e => {
            reject(e);
        })
    });
}

async function addPrepaid(fileCid: string, amount: number) {
    // 1. Construct add-prepaid tx
    const tx = api.tx.market.addPrepaid(fileCid, amount);

    // 2. Load seeds(account)
    const kr = new Keyring({ type: 'sr25519' });
    const krp = kr.addFromUri(crustSeeds);

    // 3. Send transaction
    await api.isReadyOrError;
    return new Promise((resolve, reject) => {
        tx.signAndSend(krp, ({events = [], status}) => {
            console.log(`💸  Tx status: ${status.type}, nonce: ${tx.nonce}`);

            if (status.isInBlock) {
                events.forEach(({event: {method, section}}) => {
                    if (method === 'ExtrinsicSuccess') {
                        console.log(`✅  Add prepaid success!`);
                        resolve(true);
                    }
                });
            } else {
                // Pass it
            }
        }).catch(e => {
            reject(e);
        })
    });
}

async function getOrderState(cid: string) {
    await api.isReadyOrError;
    return await api.query.market.filesV2(cid);
}
