const deployExtension = require("./deploy/extension");
const deploySoul = require("./deploy/soul");

const extend = require("./extend");
const accounts = require("./accounts");

const eatVerifier = require("./soultoken/eatVerifier");
const mint = require("./soultoken/mint");
const burn = require("./soultoken/burn");
const transfer = require("./soultoken/transfer");
const getter = require("./soultoken/getter");
const uri = require("./soultoken/uri");

export { accounts, deployExtension, extend, deploySoul, eatVerifier, mint, burn, transfer, getter, uri };
