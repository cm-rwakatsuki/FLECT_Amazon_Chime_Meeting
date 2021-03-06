const { v4 } = require('uuid');
var AWS = require('aws-sdk');
var ddb        = new AWS.DynamoDB();
const util = require('./util.js')
// Read resource names from the environment
const userTableName  = process.env.USER_TABLE_NAME;
const env_code       = process.env.CODE;
/**
 * 
 * @param {*} userName 
 */
const createUser = async (userName) =>{
  const users = await ddb.query({
    ExpressionAttributeValues: {
        ':userName': { S: userName }
    },
    IndexName: "reverseGSI",
    KeyConditionExpression : 'UserName = :userName',
    ProjectionExpression   : 'UserId, UserName',
    TableName              : userTableName
  })
  .promise();
  console.log(users)
  if(users.Count > 0){
    throw new Error("already the user exist " + userName);
  }

  const userId = v4()
  await ddb.putItem({
    TableName: userTableName,
    Item: {
      'UserId'  : { S: userId },
      'UserName': { S: userName },
    }
  }).promise();
}

/**
 * 
 * @param {*} userName 
 */
exports.getUserId = async (userName) => {
  const users = await ddb.query({
    ExpressionAttributeValues: {
        ':userName': { S: userName }
    },
    IndexName: "reverseGSI",
    KeyConditionExpression : 'UserName = :userName',
    ProjectionExpression   : 'UserId, UserName',
    TableName              : userTableName
  })
  .promise();
  if(users.Count === 0){
    throw new Error("no user exists " + userName);
  }
  console.log("USERS", users)
  const userId = users.Items[0].UserId.S
  console.log("USERS", userId)

  return userId
}

/**
 * 
 * @param {*} userName 
 */
const deleteUser = async (userName) =>{
  await ddb.deleteItem({
      TableName : userTableName,
      Key       : {
        UserName  : { S: userName  },
      }
  })
  .promise();
}

const loginUser = async (userId, code) =>{
  const result = await ddb.getItem({
    TableName: userTableName,
    Key: {
      'UserId': {
        S: userId
      },
    },
  }).promise();
  if (!result.Item) {
    throw new Error("there is no user: " + userName);
  }

  await ddb.updateItem({
    TableName: userTableName,
    Key: {
      'UserId'   : { S: userId },
    },
    UpdateExpression: "set Active = :x, Code = :y",
    ExpressionAttributeValues: {
      ":x":  { BOOL: true },
      ":y":  { S: code}
    }    
  }).promise();

  const new_result = await ddb.getItem({
    TableName: userTableName,
    Key: {
      'UserId': {
        S: userId
      },
    },
  }).promise();


  return {
    'userName': new_result.Item.UserName.S,
    'userId'  : new_result.Item.UserId.S,
    'active'  : new_result.Item.Active.BOOL
  }
}

const logoutUser = async (userName) =>{
  const result = await ddb.getItem({
    TableName: userTableName,
    Key: {
      'UserName': {
        S: userName
      },
    },
  }).promise();
  if (!result.Item) {
    throw new Error("there is no user: " + userName);
  }

  const userId = v4()
  await ddb.updateItem({
    TableName: userTableName,
    Item: {
      'UserName'  : { S: userName },
      'Active'    : { BOOL: false },
    }
  }).promise();
  return {
    'userName': result.Item.UserName.S,
    'userId'  : result.Item.UserId.S,
    'active'  : result.Item.Active.BOOL
  }
}


// ===== Join or create meeting ===================================
exports.createUser = async (event, context, callback) => {
  const response = util.getDefaultResponse()
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  const userName  = event.queryStringParameters.userName
  try{
    await createUser(userName)
  }catch(e){
    console.log(e)
    response["statusCode"] = 400;
    body = {result:"error", detail:"Exception: " + e}
    response.body = JSON.stringify(body, '', 2)    
    callback(null, response);
    return;
  }
  callback(null, response);
}

exports.getUsers = async (event, context, callback) => {
  const response = util.getDefaultResponse()
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  const userName  = event.queryStringParameters.userName
  if(userName !== undefined){
    const userId = await module.exports.getUserId(userName)
    console.log("---------------------------------")
    console.log(userId)
    const body = {userId:userId, userName:userName}
    console.log(body)
    response.body = JSON.stringify(body, '', 2)
  }else{
    body = {result:"error", detail:"not implemented"}
    response.body = JSON.stringify(body, '', 2)
  }
  callback(null, response);
}

exports.deleteUser = async (event, context, callback) => {
  const response = util.getDefaultResponse()
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  const userName  = event.queryStringParameters.userName
  await deleteUser(userName)
  callback(null, response);
}

exports.loginUser = async (event, context, callback) => {
  const response = util.getDefaultResponse()
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  const userId = event.pathParameters.userId
  const code  = event.queryStringParameters.code
  if(code !== env_code){
    console.log(e)
    response["statusCode"] = 400;
    body = {result:"error", detail:"invalid code"}
    response.body = JSON.stringify(body, '', 2)    
    callback(null, response);
    return;
  }

  const userInfo = await loginUser(userId, code)
  response.body = JSON.stringify(userInfo, '', 2);
  callback(null, response);
}
exports.logoutUser = async (event, context, callback) => {
  const response = util.getDefaultResponse()
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  const userName  = event.queryStringParameters.userName
  const userInfo = await logoutUser(userName)
  response.body = JSON.stringify(userInfo, '', 2);
  callback(null, response);
}
