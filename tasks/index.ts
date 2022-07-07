const deployExtendable = require("./deploy/extendable");
const deployExtension = require("./deploy/extension");
const deploySoul = require("./deploy/soul");

const extend = require("./extend");
const accounts = require("./accounts");

const eatVerifier = require("./soul/eatVerifier");
const mint = require("./soul/mint");
const burn = require("./soul/burn");
const transfer = require("./soul/transfer");
const getter = require("./soul/getter");
const uri = require("./soul/uri");

export {
  accounts,
  deployExtendable,
  deployExtension,
  extend,
  deploySoul,
  eatVerifier,
  mint,
  burn,
  transfer,
  getter,
  uri,
};
