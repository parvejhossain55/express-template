const jwt = require("jsonwebtoken");
const { user:User } = require("../../prisma");

module.exports.auth = async (req, res, next) =>{

    try {
        const token = req.headers.authorization.split(" ")[1]
        if(!token) return res.status(400).send("Atomization failed")

        const user = jwt.decode(token);
        if(!user) return res.status(400).send("Atomization failed");
        
        // check user exists
        const userExists =  await User.findUnique({where:{id:user.id}})
        if(!userExists) return res.status(400).send("Atomization failed")
        req.email = user.email;
        req.id = user.id;
        next()
    } catch (err) {
        console.log(err);
        res.status(500).send("soothing wrong")
    }

}