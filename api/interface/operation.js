const operationQuery = (query) => {
    console.log('Start Query: '+query);
}


const interfaceMessage = (type, text) => {
    console.log(`API ROUTE ${type} ${text}`);
    console.log('======================');
}

const interfaceShowBody = (type, text, body) => {
    console.log(`API ROUTE ${type} ${text}`);
    console.log('======================');
    console.log(`request body: ${JSON.stringify(body, null, 2)}`); // ใช้ JSON.stringify
    console.log('======================');
}

const interfaceShowId = (type, text, id) => {
    console.log(`API ROUTE ${type} ${text}`);
    console.log('======================');
    console.log(`request id: ${id}`);
    console.log('======================');

}




module.exports = {
    operationQuery,
    interfaceMessage,
    interfaceShowBody,
    interfaceShowId
};