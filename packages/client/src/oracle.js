const utils = require('@fuel-js/utils');
const schema = require('@fuel-js/interface');

// Stablecoin IDs.
const stablecoinsIds = {
    'dai': 1,
    /*
    'cusdt': 1,
    'cdai': 2,
    'cusdc': 3,
    'usdc': 5,
    'curve': 6,
    'usdt': 7,
    'ausdc': 8,
    'adai': 9,
    'ausdt': 10,
    */
};
// const ether = utils.emptyAddress;
const etherTokenId = 0;

/// @dev the Price feed oracle.
async function oracle(loop = {}, settings = {}) {
    // Mainnet requirement / stop.
    utils.assert(settings.network.name === 'homestead', 'oracle should run on network=mainnet');

    // Main loop.
    while(loop.continue) {
        // Get the gas and ether price.
        const gasPrices = await utils.fetchJson(
            'https://www.etherchain.org/api/gasPriceOracle'
        );
        const ethPrices = await utils.fetchJson(
            'https://api.coingecko.com/api/v3/coins/markets?ids=ethereum&vs_currency=usd'
        );

        // The gas and ether price.
        const gasPrice = gasPrices.standard;
        const ethPriceUSD = ethPrices[0].current_price;

        // Eth to USD price per Byte
        const calldataGas = 16;
        const gweiCost = utils.parseUnits(
            String(calldataGas * gasPrice), 'gwei');
        const ethGwei = utils.parseEther('1000000000')
            .div(utils.parseUnits('1', 'gwei'));

        // Cost per byte in USD in 18 decimals places.
        const costPerByteInUSD = gweiCost
            .mul(ethGwei)
            .mul(parseInt(ethPriceUSD, 10))
            .div(utils.parseEther('1'));

        // Log cost per byte.
        settings.console.log(
            `Gas Price (gwei) ${
                gasPrice
            } | Eth (USD) ${
                ethPriceUSD
            } | USD per Byte ${
                utils.formatEther(costPerByteInUSD)
            }`,
        );

        // Setting cost per id.
        settings.console.log('Setting stablecoin cost per byte.');

        // Set stablecoin price.
        for (const tag of Object.keys(stablecoinsIds)) {
            // Get the address and id.
            const tokenId = stablecoinsIds[tag];

            // Cost per byte.
            await settings.db.put([
                schema.db.fee,
                tokenId,
            ], costPerByteInUSD);
        }

        // Set the cost per byte for ether.
        await settings.db.put([
            schema.db.fee,
            etherTokenId,
        ], gweiCost);

        // Setting cost per id.
        settings.console.log('Stablecoin prices set.');

        // Counter in seconds.
        let counter = 0;

        // Do checks every second, update the feed every hour.
        while (counter < (60 * 60) && settings.continue()) {
            // Increase counter in minutes.
            counter += 1;

            // Wait one minute.
            await utils.wait(1000);
        }

        // Break the while loop.
        if (!settings.continue()) {
            return;
        }
    }
};

module.exports = oracle;

// stablecoins
/*
const stablecoinsAddresses = {
    'cusdt': '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
    'cdai': '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
    'cusdc': '0x39aa39c021dfbae8fac545936693ac917d5e7563',
    'dai': '0x6b175474e89094c44da98b954eedeac495271d0f',
    'usdc': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    'curve': '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8',
    'usdt': '0xdac17f958d2ee523a2206206994597c13d831ec7',
    'ausdc': '0x9bA00D6856a4eDF4665BcA2C2309936572473B7E',
    'adai': '0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d',
    'ausdt': '0x71fc860F7D3A592A4a98740e39dB31d25db65ae8',
};
*/
