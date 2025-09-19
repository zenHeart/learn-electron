const { ipcRenderer} = require('electron')

const dbs = {}

exports.registDb = dbName=>{
    if(dbs[dbName]){
        return dbs[dbName]
    }
    ipcRenderer.send('db:registDb',dbName)
    const opts = ['insert', 'update', 'remove', 'find', 'findOne', 'count']
    const returnValue = {
    }
    opts.forEach(opt=>{
        returnValue[opt] = (...args)=>ipcRenderer.invoke('db:invokeFn',dbName,opt,...args)
    })
    dbs[dbName] = returnValue
    return returnValue
}