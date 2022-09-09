const deployExtension = require("./deploy/extension");
const deployAll = require("./deploy/all");
const deployHumanbound = require("./deploy/humanbound");

const extend = require("./extend");
const accounts = require("./accounts");

const eatVerifier = require("./humanboundtoken/eatVerifier");
const mint = require("./humanboundtoken/mint");
const burn = require("./humanboundtoken/burn");
const transfer = require("./humanboundtoken/transfer");
const getter = require("./humanboundtoken/getter");
const uri = require("./humanboundtoken/uri");

export {
  accounts,
  deployExtension,
  deployAll,
  extend,
  deployHumanbound,
  eatVerifier,
  mint,
  burn,
  transfer,
  getter,
  uri,
};
