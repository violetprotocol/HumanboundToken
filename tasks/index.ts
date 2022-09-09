const deployExtension = require("./deploy/extension");
const deployHumanbound = require("./deploy/humanbound");

const extend = require("./extend");
const accounts = require("./accounts");

const eatVerifier = require("./humanboundtoken/eatVerifier");
const mint = require("./humanboundtoken/mint");
const burn = require("./humanboundtoken/burn");
const transfer = require("./humanboundtoken/transfer");
const getter = require("./humanboundtoken/getter");
const uri = require("./humanboundtoken/uri");

export { accounts, deployExtension, extend, deployHumanbound, eatVerifier, mint, burn, transfer, getter, uri };
