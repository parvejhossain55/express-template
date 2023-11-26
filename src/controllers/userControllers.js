const {user:User} = require("../../prisma/index")
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../config/mailConfig");
const CryptoJS = require("crypto-js");



/**
 * @description this function using for create user
 * @param {*} req 
 * @param {*} res 
 * @returns create user object 
 */
const requiredFields = ["email", "password", "name", "address"]
const createUserSchema = Joi.object().keys({
    name: Joi.string().min(4).max(30).required(),
    email:Joi.string().email().required(),
    password:Joi.string().min(6).max(15).required(),
    address:Joi.object().keys({street:Joi.string(), city:Joi.string(), state:Joi.string(), zip:Joi.string()})
});
module.exports.createUser = async (req, res)=> {
    try {
        // check all requeued filed  
        if (!Object.keys(req.body).every(f=> requiredFields.includes(f))) return res.status(201).send("fields is missing")
        
        // check all filed data type
        const {error} = createUserSchema.validate(req.body);
        if(error) return res.status(202).send("Invalid request");

        // check mail unique
        if(req.body.email){
            const existUser = await User.findUnique({where:{email:req.body.email}})
            if(existUser) return res.status(400).send("Email already exists");
        }

        // bcrypt user password
        req.body.password = await bcrypt.hash(req.body.password, 10);

        // creating user 
        const user  = await User.create({data:req.body});
        res.status(200).send(user);
    } catch (err) {
        console.log(err);
        if(err.code === "P2002") return  res.status(203).send("Email Already exists ");
        res.status(500).send("soothing wrong");
    }
} 


/**
 * @description this function using for get all users
 * @param {*} req 
 * @param {*} res 
 * @returns all user data array of object  
 */
module.exports.getUsers = async (req, res)=> {
    try {
        const users =  await User.findMany();
        res.status(200).send(users);
    } catch (error) {
        console.log(err);
        res.status(500).send("soothing wrong")
    }
} 


/**
 * @description this function using for get single user
 * @param {*} req 
 * @param {*} res 
 * @returns single user object  
 */
module.exports.getUser = async (req, res)=> {
    try {
        const user = await User.findUnique({where:{id:req.params.id}});
        res.status(200).send(user);
    } catch (error) {
        console.log(err);
        res.status(500).send("soothing wrong")
    }
} 



/**
 * @description this function using for update user
 * @param {*} req 
 * @param {*} res 
 * @returns updated user
 */
const updateUserSchema = Joi.object().keys({
    name: Joi.string().min(4).max(30),
    email:Joi.string().email(),
    password:Joi.string().min(6).max(15),
    address:Joi.object().keys({street:Joi.string(), city:Joi.string(), state:Joi.string(), zip:Joi.string()})
});
module.exports.updateUser = async (req, res)=> {
    try {
         // check all filed data type
         const {error} = updateUserSchema.validate(req.body);
         if(error) return res.status(202).send("Invalid request");

        // password bcrypt
        if(req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);

        //  updating user 
        const user = await User.update({where:{id:req.params.id},data:req.body});
        res.status(200).send(user);
        
    } catch (error) {
        console.log(err);
        if(err.code === "P2002") return  res.status(203).send("Email Already exists ");
        res.status(500).send("soothing wrong")
    }
} 



/**
 * @description this function using for delete user
 * @param {*} req 
 * @param {*} res 
 * @returns deleted user
 */
module.exports.deleteUser = async (req, res)=> {
    try {
        const user = await User.delete({where:{id:req.params.id}});
        res.status(200).send(user);
    } catch (error) {
        console.log(err);
        res.status(500).send("soothing wrong")
    }
} 


/**
 * @description this function using for forget password
 * @param {*} req 
 * @param {*} res 
 * @returns user object 
 */
module.exports.forgotPassword = async (req, res)=> {
    try {
        // check mail exists 
        const user = await User.findUnique({where:{email:req.body.email}});
        if(!user) return res.status(401).send("Your mail invalid");

        // create token 
        const date = Date.now();
        const code = Math.floor(1000 + Math.random() * 9000);
        const token = CryptoJS.AES.encrypt(JSON.stringify({code,date, email:user.email}), process.env.JWT_SECRET).toString();
        await sendMail({to:req.body.email, subject:"Forgot Password verification code", text:`${code}`});
        res.status(200).send({token})
    } catch (err) {
        console.log(err);
        res.status(500).send("soothing wrong")
    }
} 


/**
 * @description this function using for forget password verification code check 
 * @param {*} req 
 * @param {*} res 
 * @returns user object 
 */
const maxTime = 20 * 60 * 1000;
const codeSchema = Joi.object().keys({
    code: Joi.number().min(4).required(),
    token:Joi.string().required(),
});
module.exports.codeVerification = async (req, res) => {
    try {
    // check valid data
      const {error} = codeSchema.validate(req.body);
      if(error) return res.status(202).send("Invalid request");

      const bytes  = CryptoJS.AES.decrypt(req.body.token, process.env.JWT_SECRET);
      const decode = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      const timeDiff = Date.now() - decode.date;
      
      //  check time limit 
      if(timeDiff > maxTime) return res.status(201).send("Maximum time limit expirer");
      
      //  check code valid
      if(decode.code !== req.body.code) return res.status(201).send("Code is not valid");

      res.status(200).send({message:"success",email:decode.email})
    } catch (err) {
        console.log(err);
        res.status(500).send("soothing wrong")
    }
}

/**
 * @description this function using for forget password
 * @param {*} req 
 * @param {*} res 
 * @returns user object 
 */
const passwordSchema = Joi.object().keys({
    password:Joi.string().min(6).max(15).required(),
    token:Joi.string(),
});
module.exports.newPassword = async (req, res)=> {
    try {
      // check valid data
      const {error} = passwordSchema.validate(req.body);
      if(error) return res.status(202).send("Invalid request");

      const bytes  = CryptoJS.AES.decrypt(req.body.token, process.env.JWT_SECRET);
      const decode = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
     
      const timeDiff = Date.now() - decode.date;
      
      //  check time limit 
      if(timeDiff > maxTime) return res.status(201).send("Maximum time limit expirer");

      //  password bcrypt
      req.body.password = await bcrypt.hash(req.body.password, 10);
      const user =  await User.update({where:{email:decode.email},data:{password:req.body.password}});
      res.status(200).send(user);
    } catch (err) {
        console.log(err);
        res.status(500).send("soothing wrong");
    }
} 


/**
 * @description this function using for logout user
 * @param {*} req 
 * @param {*} res 
 * @returns user object 
 */
module.exports.logoutUser = async (req, res)=> {
    try {
        console.log(req);
    } catch (error) {
        console.log(err);
        res.status(500).send("soothing wrong")
    }
} 

/**
 * @description this function using for login user
 * @param {*} req 
 * @param {*} res 
 * @returns user object 
 */
const requiredField = ["email", "password"]
const loginUserSchema = Joi.object().keys({
    email:Joi.string().email(),
    password:Joi.string().min(6).max(15),
});
module.exports.loginUser = async (req, res)=> {

    try {
        // check all requeued filed  
        if (!Object.keys(req.body).every(f=> requiredField.includes(f))) return res.status(201).send("fields is missing")

        // check all filed data type
        const {error} = loginUserSchema.validate(req.body);
        if(error) return res.status(202).send("Invalid request");

        const user = await User.findUnique({where:{email:req.body.email}});

        if(user){
            // check password valid
           const isValid = await bcrypt.compare(req.body.password,user.password);
           if(!isValid) return res.status(200).send("Password or Email invalid");

           // creating wen token  
           user.token = jwt.sign({email:user.email, id:user.id}, process.env.JWT_SECRET, {expiresIn: "7d"})
           return res.status(200).send(user);
        }
        res.status(200).send("Password or Email invalid");
    } catch (error) {
        console.log(error);
        res.status(500).send("soothing wrong")
    }

} 


/**
 * @description this function using for google auth successful
 * @param {*} req 
 * @param {*} res 
 * @returns user object 
 */
module.exports.googleAuthSuccess = async(req, res)=>{
    try {
      let user =  await User.findUnique({where:{email:req.user.email}});
      if(!user) user =  await User.create({data:{email:req.user.email, name:req.user.displayName, avatar:req.user.picture }})
      res.status(200).send(user)
    } catch (error) {
        console.log(error);
        res.status(500).send("soothing wrong")
    }
}

/**
 * @description this function using for facebook auth successful
 * @param {*} req 
 * @param {*} res 
 * @returns user object 
 */
module.exports.facebookAuthSuccess = async(req, res)=>{
    try {
      res.status(200).send("success")
    } catch (error) {
        console.log(error);
        res.status(500).send("soothing wrong")
    }
}

/**
 * @description this function using for github auth successful
 * @param {*} req 
 * @param {*} res 
 * @returns user object 
 */
module.exports.githubAuthSuccess = async(req, res)=>{
    try {
      res.status(200).send("login success");
    } catch (error) {
        console.log(error);
        res.status(500).send("soothing wrong")
    }
}