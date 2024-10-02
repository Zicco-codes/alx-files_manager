const crypto = require('crypto');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');


class UsersController{

    static async postNew(req, res) {
        const { email, password } = req.body;

        //check if email is provided
        if (!email) {
            return res.status(400).json({ error: 'Missing email'});
        }

        //check if password is provided
        if (!password) {
            return res.status(400).json({ error: 'Missing password'});
        }


        //checks if user already exists
        const existingUser = await dbClient.db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Already exists'});
        }


        //hash the password
        const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');


        //create a new user
        try{
            const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword});
            return res.status(201).json({ id: result.insertedId, email });
        } catch (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }


    static async getMe(req, res) {
        const token = req.headers['x-token'];
        if(!token) {
            return res.status(401).json({ error: 'Unauthorized'});
        }


        //get user id suing the token
        const UserId = await redisClient.get(`auth_${token}`);
        if (!UserId) {
            return res.status(401).json({ error: 'Unauthorized'});
        }

        //get user data from db
        const user = await dbClient.db.collection('users').findOne({ _id: dbClient.getObjectId(UserId) });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized'});
        }

        //return user data
        return res.status(200).json({ id: user._id, email: user.email });
    }
}

module.exports = UsersController;
