const responseMessageAndData = (res, message, data) => {
    console.log('======================')
    console.log('Response :', { message: message , data: data});
    res.status(200).json({ message: 'Successfuly get user', data: data });
       
}

const responseMessageId = (res, message, id) => {
    console.log('======================')
    console.log('Response: ', { message: message , id: id});
    res.status(200).json({ message: message + id })
}

const responseMessage = (res, message) => {
    console.log('======================')
    console.log('Response: ', { message: message });
    res.status(200).json({ message: message})
}




module.exports = { 
    responseMessageAndData, 
    responseMessageId,
    responseMessage,
};