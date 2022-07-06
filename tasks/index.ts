const deployExtendable = require("./deploy/extendable");
const deployExtension = require("./deploy/extension");
const deploySoul = require("./deploy/soul");

const extend = require("./extend");
const accounts = require("./accounts");

const eatVerifier = require("./soul/eatVerifier");
const mint = require("./soul/mint");
const transfer = require("./soul/transfer");
const getter = require("./soul/getter");

export { accounts, deployExtendable, deployExtension, extend, deploySoul, eatVerifier, mint, transfer, getter };
