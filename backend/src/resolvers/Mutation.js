const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {randomBytes} = require('crypto');
const {promisify} = require('util');
const {transport, makeEmail} = require('../mail');

const Mutations = {
    async createItem(parent, args, ctx, info){
        if(!ctx.request.userId){
            throw new Error('You must be logged in to do that!')
        }
        const item =  await ctx.db.mutation.createItem({
            data:{
                //create relationship between item and user
                user:{
                    connect:{
                        id: ctx.request.userId
                    }
                },
                ...args
            }
        },info);
        return item;
    },
    
    updateItem(parent, args, ctx, info){
        const updates = {...args};
        delete updates.id;
        return ctx.db.mutation.updateItem({
            data: updates,
            where:{id: args.id},
        }, info)
    },

    async deleteItem(parent, args, ctx, info){
        const where = {id: args.id};
        const item = await ctx.db.query.item({where},`{id title}`);
        return ctx.db.mutation.deleteItem({where}, info);
    },

    async signup(parent, args, ctx, info){
        args.email = args.email.toLowerCase();
        const password = await bcrypt.hash(args.password, 10);
        const user = await ctx.db.mutation.createUser({
            data:{
                ...args,
                password,
                permissions: {set: ['USER']}
            },
        },info);
        const token = jwt.sign({userId: user.id}, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
        });
        return user
    },

    async signin(parent, {email, password}, ctx, info){
        const user = await ctx.db.query.user({where: {email} });
        if(!user){
            throw new Error(`${email} does not exist`)
        };
        const valid =  await bcrypt.compare(password, user.password);
        if(!valid){
            throw new Error('Invalid password')
        };
        const token = jwt.sign({userId: user.id}, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
        });
        return user
    },

    signout(parent, args, ctx, info){
        ctx.response.clearCookie('token');
        return {message:'Goodbye'};
    },
    
    async requestReset(parent, args, ctx, info){
        const user = await ctx.db.query.user({where: {email: args.email}});
        if(!user){
            throw new Error(`${args.email} does not exist`)
        };
        const randomBytesPromisified = promisify(randomBytes);
        const resetToken = (await randomBytesPromisified(20)).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
        const res = await ctx.db.mutation.updateUser({
            where: {email: args.email},
            data: {resetToken, resetTokenExpiry}
        });
        const mailRes = await transport.sendMail({
            from:"admin@sickFits.com",
            to: user.email,
            subject: "Your Password Reset Token",
            html: makeEmail(`Your Password Reset Token Is Here! 
                \n\n
                <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click Here To Reset</a>`)
        });
        return {message: 'Thanks!'}
    },

    async resetPassword(parent, args, ctx, info){
        if(args.password !== args.confirmPassword){
            throw new Error('Passwords do not match')
        };
        const [user] = await ctx.db.query.users({
            where: {
                resetToken: args.resetToken,
                resetTokenExpiry_gte: Date.now() - 3600000
            },
        });
        if(!user){
            throw new Error('This token is either invalid or expired!')
        };
        const password = await bcrypt.hash(args.password, 10);
        const updatedUser =  await ctx.db.mutation.updateUser({
            where: {email: user.email},
            data: {password, resetToken: null, resetTokenExpiry: null}
        });
        const token =  jwt.sign({userId: updatedUser.id}, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
        });
        return updatedUser;
    }

};

module.exports = Mutations;
