const got = require('got');
const { create, globSource } = require('ipfs-http-client');
const { Keyring } = require('@polkadot/keyring');

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    // 1. Get all inputss
    const path = './build';
    const seeds = process.argv[2];
    const ipfsGateway = 'https://crustwebsites.net'; // IPFS Web3 Authed Gateway address
    const ipfsPinningService = 'https://pin.crustcode.com/psa'; // IPFS Web3 Authed Pinning Service address

    // 2. Construct auth header
    const keyring = new Keyring();
    const pair = keyring.addFromUri(seeds);
    const sig = pair.sign(pair.address);
    const sigHex = '0x' + Buffer.from(sig).toString('hex');

    const authHeader = Buffer.from(`sub-${pair.address}:${sigHex}`).toString('base64');

    // 3. Create ipfs http client
    const ipfs = create({
        url: ipfsGateway + '/api/v0',
        headers: {
            authorization: 'Basic ' + authHeader
        }
    });

    const { cid } = await ipfs.add(globSource(path, { recursive: true }));

    if (cid) {
        console.log(cid.toV0().toString());
    } else {
        throw new Error('IPFS add failed, please try again.');
    }

    // 4. Pin to crust with IPFS standard W3Authed pinning service
    const {body} = await got.post(
        ipfsPinningService + '/pins',
        {
            headers: {
                authorization: 'Bearer ' + authHeader
            },
            json: {
                cid: cid.toV0().toString(),
                name: 'crust-demo'
            }
        }
    );

    if (body) {
        const rid = JSON.parse(body)['requestId'];
        console.log(body, rid);
        // 5. Query pinning status through pinning service
        while (true) {
            const {body: pinningStat} = await got(
                ipfsPinningService + `/pins/${rid}`,
                {
                    headers: {
                        authorization: 'Bearer ' + authHeader
                    }
                }
            );
            console.log(pinningStat); // After success, you can query the cid on Crust

            await timeout(1000);
        }
    } else {
        console.log(body);
        throw new Error('Crust pin failed, please try again.');
    }
}

main().catch(error => {
    console.error(error.message);
});