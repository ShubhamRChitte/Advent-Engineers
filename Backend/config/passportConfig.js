const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcryptjs");
const { UserModel } = require("../models/UserModel");

module.exports = (passport) => {
    // 1. Local Strategy (for login)
    passport.use(
        new LocalStrategy(
            { usernameField: "employeeId" },
            async (employeeId, password, done) => {
                try {
                    const upperEmployeeId = employeeId ? employeeId.toUpperCase() : employeeId;
                    const user = await UserModel.findOne({ employeeId: upperEmployeeId });
                    if (!user) {
                        return done(null, false, { message: "User not found" });
                    }

                    const isMatch = await bcrypt.compare(password, user.password);
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: "Incorrect password" });
                    }
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    // 2. JWT Strategy (for API requests)
    if (!process.env.JWT_SECRET) {
        throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing!");
    }

    const opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
    };

    passport.use(
        new JwtStrategy(opts, async (jwt_payload, done) => {
            try {
                const user = await UserModel.findById(jwt_payload.id);
                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (err) {
                return done(err, false);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await UserModel.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};
