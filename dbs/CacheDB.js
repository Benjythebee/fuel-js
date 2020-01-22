const { TypeDB } = require('../types/types');

// Memory DB
function CacheDB(cacheDB, storageDB) {
  TypeDB(cacheDB);
  TypeDB(storageDB);

  // Supports notation
  this.supports = {
    permanence: true,
    bufferKeys: false,
    promises: true,
    secondaryIndexes: false,
    backgroundProcessing: false,
    secondaryStorage: true,
  };

  this.storage = cacheDB.storage || {};
  this.storageDB = storageDB;
  this.put = (key, value) => new Promise((resolve, reject) => storageDB.put(key, value)
    .then(() => cacheDB.put(key, value))
    .then(resolve)
    .catch(reject));
  this.get = key => cacheDB.get(key);
  this.del = key => new Promise((resolve, reject) => storageDB.del(key)
    .then(() => cacheDB.del(key))
    .then(resolve)
    .catch(reject));
  this.batch = (opts) => Promise.all([cacheDB.batch(opts), storageDB.batch(opts)])
    .then(v => v[0] || [])
    .catch(err => Promise.reject(err));
  this.createReadStream = opts => cacheDB.createReadStream(opts);
  this.clear = () => Promise.all([cacheDB.clear(), storageDB.clear()]);
}

module.exports = CacheDB;
